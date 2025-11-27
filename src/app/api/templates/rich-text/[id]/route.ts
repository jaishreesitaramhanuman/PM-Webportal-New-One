import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { authenticateRequest, requireRoles } from '@/lib/auth';
import { RichTextTemplate } from '@/models/richTextTemplate';
import { generateMetadata } from '@/lib/richTextUtils';

/**
 * /api/templates/rich-text/[id]
 * Single template operations: GET, PUT, DELETE
 */

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  htmlContent: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// GET - Retrieve single template
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const template = await RichTextTemplate.findById(params.id)
      .populate('createdBy', 'name email');

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Record usage
    await template.recordUsage(user._id);

    console.log(`✅ Retrieved template: ${template._id}`);
    return NextResponse.json(template);
  } catch (error: any) {
    console.error('❌ Error fetching template:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch template' },
      { status: 500 }
    );
  }
}

// PUT - Update template
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const template = await RichTextTemplate.findById(params.id);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only creator or admins can update
    const isCreator = template.createdBy.toString() === user._id.toString();
    const isAdmin = requireRoles(user, ['Super Admin', 'State Advisor']);

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only template creator or admins can update' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = UpdateTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const updates = parsed.data;

    // Update fields
    if (updates.name) template.name = updates.name;
    if (updates.description !== undefined) template.description = updates.description;
    if (updates.isDefault !== undefined) template.isDefault = updates.isDefault;
    if (updates.isShared !== undefined) template.isShared = updates.isShared;
    if (updates.tags) template.tags = updates.tags;
    if (updates.status) template.status = updates.status;

    // If HTML content changed, regenerate metadata and increment version
    if (updates.htmlContent) {
      template.htmlContent = updates.htmlContent;
      template.metadata = generateMetadata(updates.htmlContent);
      template.version += 1;
    }

    await template.save();

    console.log(`✅ Template updated: ${template._id}`);
    return NextResponse.json({ ok: true, template });
  } catch (error: any) {
    console.error('❌ Error updating template:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const template = await RichTextTemplate.findById(params.id);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only creator or admins can delete
    const isCreator = template.createdBy.toString() === user._id.toString();
    const isAdmin = requireRoles(user, ['Super Admin']);

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only template creator or admins can delete' },
        { status: 403 }
      );
    }

    // Cannot delete default templates
    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 400 }
      );
    }

    // Check if template is being used in any forms
    const { FormSubmission } = await import('@/models/form');
    const formsUsingTemplate = await FormSubmission.countDocuments({
      richTextTemplateId: params.id,
    });

    if (formsUsingTemplate > 0) {
      // Instead of deleting, archive it
      template.status = 'archived';
      await template.save();
      console.log(`⚠️ Template archived (in use): ${template._id}`);
      return NextResponse.json({
        ok: true,
        message: 'Template archived as it is being used in forms',
      });
    }

    // Actually delete if not in use
    await RichTextTemplate.findByIdAndDelete(params.id);

    console.log(`✅ Template deleted: ${params.id}`);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('❌ Error deleting template:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    );
  }
}
