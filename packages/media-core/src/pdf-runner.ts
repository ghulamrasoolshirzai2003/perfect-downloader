import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { PDFDocument, degrees, PageSizes } from '@cantoo/pdf-lib';
import { AppError, parsePageRanges, parseRangeGroups } from '@pd/shared';
import sharp from 'sharp';

export interface PdfMetadataResult {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pages: Array<{
    pageNumber: number;
    width: number;
    height: number;
    rotation: number;
  }>;
}

export async function inspectPdf(inputPath: string): Promise<PdfMetadataResult> {
  try {
    const bytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    const pages = pdfDoc.getPages().map((page, index) => {
      const { width, height } = page.getSize();
      return {
        pageNumber: index + 1,
        width: Math.round(width),
        height: Math.round(height),
        rotation: page.getRotation().angle,
      };
    });

    return {
      pageCount,
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate()?.toISOString(),
      modificationDate: pdfDoc.getModificationDate()?.toISOString(),
      pages,
    };
  } catch (err: any) {
    throw new AppError('INVALID_FILE', `Failed to read PDF: ${err.message}`);
  }
}

export async function mergePdfs(inputPaths: string[], outputPath: string): Promise<void> {
  if (inputPaths.length < 2) {
    throw new AppError('INVALID_OPTIONS', 'At least 2 PDF files are required for merging');
  }

  try {
    const mergedDoc = await PDFDocument.create();

    for (const p of inputPaths) {
      const bytes = await fs.readFile(p);
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      for (const page of pages) {
        mergedDoc.addPage(page);
      }
    }

    const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
    await fs.writeFile(outputPath, mergedBytes);
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError('PROCESSING_FAILED', `PDF merge failed: ${err.message}`);
  }
}

export async function splitPdf(
  inputPath: string,
  outputDir: string,
  opts: { mode: 'every' | 'ranges'; ranges?: string },
): Promise<string[]> {
  try {
    const bytes = await fs.readFile(inputPath);
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = srcDoc.getPageCount();
    const createdFiles: string[] = [];

    if (opts.mode === 'every') {
      for (let i = 0; i < pageCount; i++) {
        const doc = await PDFDocument.create();
        const [copied] = await doc.copyPages(srcDoc, [i]);
        if (copied) doc.addPage(copied);
        const fileName = `page_${i + 1}.pdf`;
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, await doc.save({ useObjectStreams: true }));
        createdFiles.push(filePath);
      }
    } else {
      const groups = parseRangeGroups(opts.ranges || '', pageCount);
      if (!groups || groups.length === 0) {
        throw new AppError('INVALID_OPTIONS', 'Invalid page range specification');
      }

      for (let idx = 0; idx < groups.length; idx++) {
        const pagesInGroup = groups[idx]!;
        const doc = await PDFDocument.create();
        const indices = pagesInGroup.map((p) => p - 1);
        const copiedPages = await doc.copyPages(srcDoc, indices);
        for (const page of copiedPages) {
          doc.addPage(page);
        }
        const fileName = `part_${idx + 1}.pdf`;
        const filePath = path.join(outputDir, fileName);
        await fs.writeFile(filePath, await doc.save({ useObjectStreams: true }));
        createdFiles.push(filePath);
      }
    }

    return createdFiles;
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError('PROCESSING_FAILED', `PDF split failed: ${err.message}`);
  }
}

export async function extractPdfPages(
  inputPath: string,
  outputPath: string,
  pageSpec: string,
): Promise<void> {
  try {
    const bytes = await fs.readFile(inputPath);
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = srcDoc.getPageCount();

    const selectedPages = parsePageRanges(pageSpec, pageCount);
    if (!selectedPages || selectedPages.length === 0) {
      throw new AppError('INVALID_OPTIONS', `Invalid pages requested. Document has ${pageCount} pages.`);
    }

    const doc = await PDFDocument.create();
    const indices = selectedPages.map((p) => p - 1);
    const copiedPages = await doc.copyPages(srcDoc, indices);
    for (const page of copiedPages) {
      doc.addPage(page);
    }

    await fs.writeFile(outputPath, await doc.save({ useObjectStreams: true }));
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError('PROCESSING_FAILED', `PDF extraction failed: ${err.message}`);
  }
}

export async function rotatePdfPages(
  inputPath: string,
  outputPath: string,
  angleDegrees: number,
  pageSpec: string,
): Promise<void> {
  try {
    const bytes = await fs.readFile(inputPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();

    const selected = parsePageRanges(pageSpec, pageCount);
    if (!selected) {
      throw new AppError('INVALID_OPTIONS', 'Invalid page selection for rotation');
    }

    const targetIndices = new Set(selected.map((p) => p - 1));
    const pages = doc.getPages();

    for (let i = 0; i < pages.length; i++) {
      if (targetIndices.has(i)) {
        const page = pages[i]!;
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + angleDegrees) % 360));
      }
    }

    await fs.writeFile(outputPath, await doc.save({ useObjectStreams: true }));
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError('PROCESSING_FAILED', `PDF rotation failed: ${err.message}`);
  }
}

export async function compressPdf(inputPath: string, outputPath: string): Promise<void> {
  try {
    const bytes = await fs.readFile(inputPath);
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    // Re-saving with object streams enabled removes redundant uncompressed cross-reference and structural bloat
    const compressed = await doc.save({ useObjectStreams: true });
    await fs.writeFile(outputPath, compressed);
  } catch (err: any) {
    throw new AppError('PROCESSING_FAILED', `PDF compression failed: ${err.message}`);
  }
}

export async function imagesToPdf(
  imagePaths: string[],
  outputPath: string,
  pageSize: 'fit' | 'a4' | 'letter' = 'a4',
  margin: 'none' | 'small' | 'large' = 'small',
): Promise<void> {
  try {
    const doc = await PDFDocument.create();

    const marginPt = margin === 'none' ? 0 : margin === 'small' ? 20 : 40;

    for (const imgPath of imagePaths) {
      // Normalize image to PNG buffer via Sharp to ensure clean PDF embedding regardless of source format (WebP, AVIF, HEIC, TIFF, JPEG)
      const pngBuffer = await sharp(imgPath).png().toBuffer();
      const meta = await sharp(pngBuffer).metadata();
      const imgWidth = meta.width ?? 800;
      const imgHeight = meta.height ?? 600;

      const embedded = await doc.embedPng(pngBuffer);

      let pWidth: number;
      let pHeight: number;

      if (pageSize === 'fit') {
        pWidth = imgWidth + marginPt * 2;
        pHeight = imgHeight + marginPt * 2;
      } else if (pageSize === 'letter') {
        [pWidth, pHeight] = PageSizes.Letter;
      } else {
        [pWidth, pHeight] = PageSizes.A4;
      }

      const page = doc.addPage([pWidth, pHeight]);

      const availableW = pWidth - marginPt * 2;
      const availableH = pHeight - marginPt * 2;

      // Fit aspect ratio within available printable box
      const scale = Math.min(availableW / imgWidth, availableH / imgHeight, 1);
      const drawW = imgWidth * scale;
      const drawH = imgHeight * scale;

      const x = (pWidth - drawW) / 2;
      const y = (pHeight - drawH) / 2;

      page.drawImage(embedded, {
        x,
        y,
        width: drawW,
        height: drawH,
      });
    }

    await fs.writeFile(outputPath, await doc.save({ useObjectStreams: true }));
  } catch (err: any) {
    throw new AppError('PROCESSING_FAILED', `Image-to-PDF failed: ${err.message}`);
  }
}
