/**
 * PDF Generation Utility
 * Generates PDFs from HTML content using Puppeteer
 */

import { connectDB, getDB } from './db';
import mongoose from 'mongoose';

// PDF generation options
export interface PDFOptions {
  format?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

/**
 * Generate PDF from HTML using Puppeteer
 * Note: This is a server-side only function
 */
export async function generatePDF(
  html: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  // Dynamic import to avoid client-side bundling issues
  const puppeteer = await import('puppeteer');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    
    // Set content with proper styling
    const styledHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #1a1a1a;
              margin-top: 1em;
              margin-bottom: 0.5em;
            }
            h1 { font-size: 24pt; }
            h2 { font-size: 20pt; }
            h3 { font-size: 16pt; }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }
            table, th, td {
              border: 1px solid #ddd;
            }
            th, td {
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            blockquote {
              border-left: 4px solid #ddd;
              padding-left: 1em;
              margin-left: 0;
              font-style: italic;
              color: #666;
            }
            code {
              background-color: #f4f4f4;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
            }
            pre {
              background-color: #f4f4f4;
              padding: 10px;
              border-radius: 5px;
              overflow-x: auto;
            }
            ul, ol {
              margin: 0.5em 0;
              padding-left: 2em;
            }
            @page {
              margin: ${options.margins?.top || '20mm'} ${options.margins?.right || '20mm'} ${options.margins?.bottom || '20mm'} ${options.margins?.left || '20mm'};
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
    
    await page.setContent(styledHTML, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      landscape: options.orientation === 'landscape',
      printBackground: true,
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

/**
 * Store PDF in MongoDB GridFS
 */
export async function storePDF(
  pdfBuffer: Buffer,
  metadata: {
    filename: string;
    formId?: string;
    userId: string;
  }
): Promise<string> {
  await connectDB();
  const db = getDB();
  
  if (!db.db) {
    throw new Error('Database connection not established');
  }
  
  const bucket = new mongoose.mongo.GridFSBucket(db.db, {
    bucketName: 'pdfs',
  });
  
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(metadata.filename, {
      metadata: {
        formId: metadata.formId,
        userId: metadata.userId,
        contentType: 'application/pdf',
        uploadedAt: new Date(),
      },
    });
    
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve(uploadStream.id.toString());
    });
    
    uploadStream.end(pdfBuffer);
  });
}

/**
 * Retrieve PDF from GridFS
 */
export async function retrievePDF(pdfId: string): Promise<Buffer> {
  await connectDB();
  const db = getDB();
  
  if (!db.db) {
    throw new Error('Database connection not established');
  }
  
  const bucket = new mongoose.mongo.GridFSBucket(db.db, {
    bucketName: 'pdfs',
  });
  
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    const downloadStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(pdfId)
    );
    
    downloadStream.on('data', (chunk) => chunks.push(chunk));
    downloadStream.on('error', reject);
    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

/**
 * Delete PDF from GridFS
 */
export async function deletePDF(pdfId: string): Promise<void> {
  await connectDB();
  const db = getDB();
  
  if (!db.db) {
    throw new Error('Database connection not established');
  }
  
  const bucket = new mongoose.mongo.GridFSBucket(db.db, {
    bucketName: 'pdfs',
  });
  
  await bucket.delete(new mongoose.Types.ObjectId(pdfId));
}
