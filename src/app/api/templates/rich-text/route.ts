import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import { authenticateRequest, requireRoles } from '@/lib/auth';
import { RichTextTemplate } from '@/models/richTextTemplate';
import { generateMetadata } from '@/lib/richTextUtils';

/**
 * /api/templates/rich-text
 * Manage rich text form templates
 */

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  division: z.string().min(1),
  state: z.string().min(1),
  htmlContent: z.string().min(1),
  isDefault: z.boolean().optional(),
  isShared: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// GET - List templates
export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const division = searchParams.get('division');
    const state = searchParams.get('state');
    const recentlyUsed = searchParams.get('recentlyUsed') === 'true';
    const shared = searchParams.get('shared') === 'true';
    const search = searchParams.get('search');

    const query: any = {
      status: 'published',
    };

    // Filter by division and state
    if (division) query.division = division;
    if (state) query.state = state;

    // Filter by shared
    if (shared) {
      query.isShared = true;
    } else if (division && state) {
      // Show division-specific templates OR shared templates
      query.$or = [
        { division, state, isShared: false },
        { isShared: true },
      ];
    }

    // Search by name or tags
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    let templates = await RichTextTemplate.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    // If recently used filter, sort by user's usage
    if (recentlyUsed && user._id) {
      templates = templates
        .filter((t: any) =>
          t.lastUsedBy.some(
            (u: any) => u.userId.toString() === user._id.toString()
          )
        )
        .sort((a: any, b: any) => {
          const aUsage = a.lastUsedBy.find(
            (u: any) => u.userId.toString() === user._id.toString()
          );
          const bUsage = b.lastUsedBy.find(
            (u: any) => u.userId.toString() === user._id.toString()
          );
          return (
            new Date(bUsage?.usedAt || 0).getTime() -
            new Date(aUsage?.usedAt || 0).getTime()
          );
        });
    }

    console.log(`✅ Retrieved ${templates.length} rich text templates`);
    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('❌ Error fetching templates:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only Division YP, HOD, and admins can create templates
  if (
    !requireRoles(user, [
      'Division YP',
      'Division HOD',
      'Super Admin',
      'State Advisor',
    ])
  ) {
    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = CreateTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    await connectDB();

    const { name, description, division, state, htmlContent, isDefault, isShared, tags } =
      parsed.data;

    // Generate metadata from HTML content
    const metadata = generateMetadata(htmlContent);

    const template = await RichTextTemplate.create({
      name,
      description,
      division,
      state,
      htmlContent,
      isDefault: isDefault || false,
      isShared: isShared || false,
      tags: tags || [],
      createdBy: user._id,
      metadata,
    });

    console.log('✅ Template created:', template._id);
    return NextResponse.json({ id: String(template._id), template });
  } catch (error: any) {
    console.error('❌ Error creating template:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    );
  }
}
