import { createWriteStream } from 'node:fs';
import * as path from 'node:path';
import archiver from 'archiver';
import { AppError } from '@pd/shared';

/**
 * Packs multiple files or a directory into a zip archive with deflate compression
 */
export async function createZipArchive(
  files: Array<{ sourcePath: string; nameInZip: string }>,
  outputZipPath: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const output = createWriteStream(outputZipPath);
    const archive = archiver('zip', {
      zlib: { level: 6 },
    });

    output.on('close', () => resolve());
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        reject(new AppError('PROCESSING_FAILED', `Zip warning: ${err.message}`));
      }
    });
    archive.on('error', (err) => {
      reject(new AppError('PROCESSING_FAILED', `Zip packing failed: ${err.message}`));
    });

    archive.pipe(output);

    for (const f of files) {
      archive.file(f.sourcePath, { name: f.nameInZip });
    }

    archive.finalize().catch(reject);
  });
}
