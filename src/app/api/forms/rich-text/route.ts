import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { authenticateRequest, requireRoles } from '@/lib/auth';
import { FormSubmission } from '@/models/form';
import { RichTextTemplate } from '@/models/richTextTemplate';
import { replaceVariables, sanitizeHTML } from '@/lib/richTextUtils';

/**
 * /api/forms/rich-text
 * Submit and manage rich text forms
 */

const SubmitRichTextFormSchema = z.object({
  requestId: z.string(),
  richTextTemplateId: z.string().optional().nullable(),
  richTextContent: z.string().min(1),
  branch: z.string(),
  state: z.string(),
  isDraft: z.boolean().optional(),
  variableData: z.record(z.any()).optional(), // For replacing {{variables}}
});

// POST - Submit rich text form
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only Division YP can submit forms
  if (!requireRoles(user, ['Division YP', 'Division HOD'])) {
    return NextResponse.json(
      { error: 'Forbidden: Only Division YP/HOD can submit forms' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = SubmitRichTextFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    const {
      requestId,
      richTextTemplateId,
      richTextContent,
      branch,
      state,
      isDraft,
      variableData,
    } = parsed.data;

    // Verify template exists (if provided)
    let template = null;
    if (richTextTemplateId) {
      template = await RichTextTemplate.findById(richTextTemplateId);
      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
    }

    // Verify workflow request exists
    const { WorkflowRequest } = await import('@/models/request');
    const request = await WorkflowRequest.findById(requestId);
    if (!request) {
      return NextResponse.json(
        { error: 'Workflow request not found' },
        { status: 404 }
      );
    }

    // Sanitize HTML content to prevent XSS
    let processedContent = sanitizeHTML(richTextContent);

    // Replace variables if provided
    if (variableData) {
      processedContent = replaceVariables(processedContent, variableData);
    }

    // Check if draft already exists for this user/request/branch
    if (isDraft) {
      const existingDraft = await FormSubmission.findOne({
        requestId,
        branch,
        state,
        submittedBy: user._id,
        status: 'draft',
        formType: 'rich-text',
      });

      if (existingDraft) {
        // Update existing draft
        existingDraft.richTextContent = processedContent;
        existingDraft.richTextTemplateId = richTextTemplateId as any;
        existingDraft.data = variableData || {};
        await existingDraft.save();
        // Find this division's assignment
        const divisionAssignment = request.divisionAssignments?.find(
          (a: any) =>
            a.division === branch &&
            String(a.divisionYPId) === String(user._id)
        );

        if (divisionAssignment) {
          // Update assignment status
          divisionAssignment.status = 'yp_submitted';

          // Assign to this division's HOD
          request.currentAssigneeId = divisionAssignment.divisionHODId;
          request.status = 'in-progress';
          request.history.push({
            action: 'form_submitted',
            userId: user._id,
            timestamp: new Date(),
            notes: `Division YP submitted rich text form for ${branch} division`,
          });
          await request.save();
        }
      }

      // Record template usage (if template was used)
      if (template) {
        await template.recordUsage(user._id);
      }
    }

    console.log(`✅ Rich text form ${isDraft ? 'draft saved' : 'submitted'}: ${formSubmission._id}`);
    return NextResponse.json({
      id: String(formSubmission._id),
      isDraft: isDraft || false,
    });
  } catch (error: any) {
    console.error('❌ Error submitting rich text form:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to submit form' },
      { status: 500 }
    );
  }
}

// GET - List rich text forms
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');
    const branch = searchParams.get('branch');
    const state = searchParams.get('state');
    const draftsOnly = searchParams.get('draftsOnly') === 'true';

    const query: any = {
      formType: 'rich-text',
    };

    if (requestId) query.requestId = requestId;
    if (branch) query.branch = branch;
    if (state) query.state = state;
    if (draftsOnly) {
      query.status = 'draft';
      query.submittedBy = user._id; // Only user's own drafts
    }

    const forms = await FormSubmission.find(query)
      .populate('submittedBy', 'name email')
      .populate('richTextTemplateId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`✅ Retrieved ${forms.length} rich text forms`);
    return NextResponse.json(forms);
  } catch (error: any) {
    console.error('❌ Error fetching forms:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}
