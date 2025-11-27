import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { retrievePDF } from '@/lib/pdfGenerator';

/**
 * /api/pdf/download/[id]
 * Download generated PDF from GridFS
 */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log(`🔄 Retrieving PDF: ${params.id}`);

    const pdfBuffer = await retrievePDF(params.id);

    console.log(`✅ PDF retrieved: ${params.id} (${pdfBuffer.length} bytes)`);

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="document_${params.id}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error: any) {
    console.error('❌ Error downloading PDF:', error.message);
    
    if (error.message.includes('not found') || error.message.includes('FileNotFound')) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to download PDF' },
      { status: 500 }
    );
  }
}
