import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth';
import { generatePDF, storePDF, PDFOptions } from '@/lib/pdfGenerator';
import { connectDB } from '@/lib/db';

/**
 * /api/pdf/generate
 * Generate PDF from HTML content
 */

const GeneratePDFSchema = z.object({
  htmlContent: z.string().min(1),
  formId: z.string().optional(),
  filename: z.string().optional(),
  options: z
    .object({
      format: z.enum(['A4', 'Letter', 'Legal']).optional(),
      orientation: z.enum(['portrait', 'landscape']).optional(),
      margins: z
        .object({
          top: z.string().optional(),
          right: z.string().optional(),
          bottom: z.string().optional(),
          left: z.string().optional(),
        })
        .optional(),
      displayHeaderFooter: z.boolean().optional(),
      headerTemplate: z.string().optional(),
      footerTemplate: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = GeneratePDFSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { htmlContent, formId, filename, options } = parsed.data;

    console.log('🔄 Generating PDF...');
    const startTime = Date.now();

    // Generate PDF
    const pdfBuffer = await generatePDF(
      htmlContent,
      options || {}
    );

    const generationTime = Date.now() - startTime;
    console.log(`✅ PDF generated in ${generationTime}ms`);

    // Store PDF in GridFS
    await connectDB();
    const pdfId = await storePDF(pdfBuffer, {
      filename: filename || `form_${Date.now()}.pdf`,
      formId,
      userId: String(user._id),
    });

    console.log(`✅ PDF stored in GridFS: ${pdfId}`);

    return NextResponse.json({
      pdfId,
      downloadUrl: `/api/pdf/download/${pdfId}`,
      sizeBytes: pdfBuffer.length,
      generationTimeMs: generationTime,
    });
  } catch (error: any) {
    console.error('❌ Error generating PDF:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
