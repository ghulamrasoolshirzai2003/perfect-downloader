import sharp from 'sharp';
import { AppError } from '@pd/shared';

export interface SharpImageMetadata {
  format?: string;
  width?: number;
  height?: number;
  space?: string;
  channels?: number;
  depth?: string;
  density?: number;
  isProgressive?: boolean;
  hasAlpha?: boolean;
  hasProfile?: boolean;
  exif?: Record<string, unknown>;
  size?: number;
}

/**
 * Inspects real image dimensions, format, color space, and metadata
 */
export async function inspectImage(inputPath: string): Promise<SharpImageMetadata> {
  try {
    const meta = await sharp(inputPath).metadata();
    return {
      format: meta.format,
      width: meta.width,
      height: meta.height,
      space: meta.space,
      channels: meta.channels,
      depth: meta.depth,
      density: meta.density,
      isProgressive: meta.isProgressive,
      hasAlpha: meta.hasAlpha,
      hasProfile: meta.hasProfile,
      size: meta.size,
    };
  } catch (err: any) {
    throw new AppError('INVALID_FILE', `Failed to read image: ${err.message}`);
  }
}

export interface ConvertImageOptions {
  format: 'jpg' | 'png' | 'webp' | 'avif' | 'gif' | 'tiff';
  quality?: number;
  stripMetadata?: boolean;
}

export async function convertImage(
  inputPath: string,
  outputPath: string,
  opts: ConvertImageOptions,
): Promise<void> {
  try {
    let pipeline = sharp(inputPath, { animated: opts.format === 'gif' || opts.format === 'webp' });

    if (!opts.stripMetadata) {
      pipeline = pipeline.withMetadata();
    }

    const quality = opts.quality ?? 80;

    switch (opts.format) {
      case 'jpg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9, effort: 7 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality, effort: 5 });
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality, effort: 4 });
        break;
      case 'gif':
        pipeline = pipeline.gif({ effort: 7 });
        break;
      case 'tiff':
        pipeline = pipeline.tiff({ quality });
        break;
      default:
        throw new AppError('UNSUPPORTED_FORMAT', `Unsupported format: ${opts.format}`);
    }

    await pipeline.toFile(outputPath);
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError('PROCESSING_FAILED', `Image conversion failed: ${err.message}`);
  }
}

export interface ResizeImageOptions {
  width?: number;
  height?: number;
  fit?: 'inside' | 'cover' | 'contain' | 'fill';
  withoutEnlargement?: boolean;
}

export async function resizeImage(
  inputPath: string,
  outputPath: string,
  opts: ResizeImageOptions,
): Promise<void> {
  try {
    const pipeline = sharp(inputPath, { animated: true }).resize({
      width: opts.width && opts.width > 0 ? opts.width : undefined,
      height: opts.height && opts.height > 0 ? opts.height : undefined,
      fit: opts.fit ?? 'inside',
      withoutEnlargement: opts.withoutEnlargement ?? true,
    });
    await pipeline.toFile(outputPath);
  } catch (err: any) {
    throw new AppError('PROCESSING_FAILED', `Image resizing failed: ${err.message}`);
  }
}

export interface CropImageOptions {
  mode: 'aspect' | 'custom';
  aspect?: string;
  position?: 'center' | 'attention' | 'top' | 'bottom' | 'left' | 'right';
  left?: number;
  top?: number;
  width?: number;
  height?: number;
}

export async function cropImage(
  inputPath: string,
  outputPath: string,
  opts: CropImageOptions,
): Promise<void> {
  try {
    const meta = await sharp(inputPath).metadata();
    const origW = meta.width ?? 1000;
    const origH = meta.height ?? 1000;

    let pipeline = sharp(inputPath);

    if (opts.mode === 'custom' && opts.width && opts.height) {
      pipeline = pipeline.extract({
        left: Math.max(0, Math.min(origW - 1, opts.left ?? 0)),
        top: Math.max(0, Math.min(origH - 1, opts.top ?? 0)),
        width: Math.min(origW - (opts.left ?? 0), opts.width),
        height: Math.min(origH - (opts.top ?? 0), opts.height),
      });
    } else if (opts.mode === 'aspect' && opts.aspect) {
      const [rW, rH] = opts.aspect.split(':').map(Number);
      if (rW && rH) {
        let targetW = origW;
        let targetH = Math.round((targetW * rH) / rW);

        if (targetH > origH) {
          targetH = origH;
          targetW = Math.round((targetH * rW) / rH);
        }

        const positionMap: Record<string, sharp.Gravity> = {
          center: sharp.gravity.center,
          top: sharp.gravity.north,
          bottom: sharp.gravity.south,
          left: sharp.gravity.west,
          right: sharp.gravity.east,
          attention: sharp.strategy.attention,
        };

        const pos = opts.position ? positionMap[opts.position] ?? sharp.gravity.center : sharp.gravity.center;

        pipeline = pipeline.resize({
          width: targetW,
          height: targetH,
          fit: 'cover',
          position: pos,
        });
      }
    }

    await pipeline.toFile(outputPath);
  } catch (err: any) {
    throw new AppError('PROCESSING_FAILED', `Image crop failed: ${err.message}`);
  }
}

export interface RotateImageOptions {
  angle: number;
  flip?: 'none' | 'horizontal' | 'vertical';
}

export async function rotateImage(
  inputPath: string,
  outputPath: string,
  opts: RotateImageOptions,
): Promise<void> {
  try {
    let pipeline = sharp(inputPath);
    if (opts.angle > 0) {
      pipeline = pipeline.rotate(opts.angle);
    }
    if (opts.flip === 'horizontal') {
      pipeline = pipeline.flop();
    } else if (opts.flip === 'vertical') {
      pipeline = pipeline.flip();
    }
    await pipeline.toFile(outputPath);
  } catch (err: any) {
    throw new AppError('PROCESSING_FAILED', `Image rotation failed: ${err.message}`);
  }
}
