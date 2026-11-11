import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import {
  TempStorageManager,
  probeMedia,
  inspectImage,
  convertImage,
  resizeImage,
  cropImage,
  rotateImage,
  inspectPdf,
  mergePdfs,
  splitPdf,
  extractPdfPages,
  rotatePdfPages,
  compressPdf,
  imagesToPdf,
  executeTool,
} from '@pd/media-core';
import { getTool } from '@pd/shared';

const fixturesDir = path.resolve('tests', 'fixtures');
const testVideo = path.join(fixturesDir, 'test-video.mp4');
const testAudio = path.join(fixturesDir, 'test-audio.mp3');
const testImagePng = path.join(fixturesDir, 'test-image.png');
const testImageJpg = path.join(fixturesDir, 'test-image.jpg');
const testPdf = path.join(fixturesDir, 'test-document.pdf');

describe('Media Core Processing', () => {
  let tempManager: TempStorageManager;

  beforeAll(async () => {
    tempManager = new TempStorageManager(path.resolve('.tmp', 'test-media'));
    await tempManager.init();
  });

  afterAll(async () => {
    await tempManager.close();
  });

  it('probes video correctly with ffprobe', async () => {
    const probe = await probeMedia(testVideo);
    expect(probe.duration).toBeGreaterThan(1);
    expect(probe.videoStream).toBeDefined();
    expect(probe.videoStream?.width).toBe(320);
    expect(probe.videoStream?.height).toBe(240);
    expect(probe.audioStreams.length).toBeGreaterThan(0);
  });

  it('probes audio correctly with ffprobe', async () => {
    const probe = await probeMedia(testAudio);
    expect(probe.duration).toBeGreaterThan(1);
    expect(probe.audioStreams.length).toBe(1);
    expect(probe.audioStreams[0]?.codecName).toBe('mp3');
  });

  it('inspects images with Sharp', async () => {
    const meta = await inspectImage(testImagePng);
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(320);
    expect(meta.height).toBe(240);
  });

  it('converts images across WebP, AVIF, and JPEG', async () => {
    const outWebp = await tempManager.createTempFile({ extension: 'webp' });
    await convertImage(testImagePng, outWebp.path, { format: 'webp', quality: 80 });
    const metaWebp = await inspectImage(outWebp.path);
    expect(metaWebp.format).toBe('webp');

    const outJpg = await tempManager.createTempFile({ extension: 'jpg' });
    await convertImage(testImagePng, outJpg.path, { format: 'jpg', quality: 85 });
    const metaJpg = await inspectImage(outJpg.path);
    expect(metaJpg.format).toBe('jpeg');
  });

  it('resizes images preserving dimensions', async () => {
    const outResize = await tempManager.createTempFile({ extension: 'png' });
    await resizeImage(testImagePng, outResize.path, { width: 160, fit: 'inside' });
    const meta = await inspectImage(outResize.path);
    expect(meta.width).toBe(160);
    expect(meta.height).toBe(120);
  });

  it('crops and rotates images', async () => {
    const outCrop = await tempManager.createTempFile({ extension: 'png' });
    await cropImage(testImagePng, outCrop.path, { mode: 'aspect', aspect: '1:1' });
    const metaCrop = await inspectImage(outCrop.path);
    expect(metaCrop.width).toBe(metaCrop.height);

    const outRotate = await tempManager.createTempFile({ extension: 'png' });
    await rotateImage(testImagePng, outRotate.path, { angle: 90 });
    const metaRotate = await inspectImage(outRotate.path);
    expect(metaRotate.width).toBe(240);
    expect(metaRotate.height).toBe(320);
  });

  it('inspects, merges, splits, extracts, and rotates PDFs', async () => {
    // 1. Inspect
    const meta = await inspectPdf(testPdf);
    expect(meta.pageCount).toBe(3);

    // 2. Merge
    const outMerge = await tempManager.createTempFile({ extension: 'pdf' });
    await mergePdfs([testPdf, testPdf], outMerge.path);
    const metaMerge = await inspectPdf(outMerge.path);
    expect(metaMerge.pageCount).toBe(6);

    // 3. Extract pages
    const outExtract = await tempManager.createTempFile({ extension: 'pdf' });
    await extractPdfPages(testPdf, outExtract.path, '1, 3');
    const metaExtract = await inspectPdf(outExtract.path);
    expect(metaExtract.pageCount).toBe(2);

    // 4. Rotate
    const outRotate = await tempManager.createTempFile({ extension: 'pdf' });
    await rotatePdfPages(testPdf, outRotate.path, 90, '1');
    const metaRotate = await inspectPdf(outRotate.path);
    expect(metaRotate.pages[0]?.rotation).toBe(90);

    // 5. Images to PDF
    const outFromImgs = await tempManager.createTempFile({ extension: 'pdf' });
    await imagesToPdf([testImagePng, testImageJpg], outFromImgs.path);
    const metaFromImgs = await inspectPdf(outFromImgs.path);
    expect(metaFromImgs.pageCount).toBe(2);
  });

  it('executes video conversion via executeTool dispatcher', async () => {
    const tool = getTool('video.convert')!;
    const res = await executeTool({
      tool,
      inputFiles: [testVideo],
      options: { format: 'mp4', quality: 'balanced' },
      tempManager,
    });
    expect(res.type).toBe('file');
    expect(res.outputFile).toBeDefined();

    const probe = await probeMedia(res.outputFile!.path);
    expect(probe.duration).toBeGreaterThan(1);
  });

  it('executes audio extraction from video via executeTool', async () => {
    const tool = getTool('video.to-audio')!;
    const res = await executeTool({
      tool,
      inputFiles: [testVideo],
      options: { format: 'mp3', bitrate: '192' },
      tempManager,
    });
    expect(res.type).toBe('file');
    expect(res.outputFileName).toBe('audio.mp3');

    const probe = await probeMedia(res.outputFile!.path);
    expect(probe.audioStreams[0]?.codecName).toBe('mp3');
  });
});
