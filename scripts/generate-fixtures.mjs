import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import { PDFDocument, rgb } from '@cantoo/pdf-lib';

const fixturesDir = path.resolve('tests', 'fixtures');
await fs.mkdir(fixturesDir, { recursive: true });

console.log('Generating test media fixtures in:', fixturesDir);

// 1. Image fixtures (PNG & JPEG)
const testPng = path.join(fixturesDir, 'test-image.png');
const testJpg = path.join(fixturesDir, 'test-image.jpg');

await sharp({
  create: {
    width: 320,
    height: 240,
    channels: 4,
    background: { r: 59, g: 130, b: 246, alpha: 1 },
  },
})
  .png()
  .toFile(testPng);

await sharp({
  create: {
    width: 320,
    height: 240,
    channels: 3,
    background: { r: 239, g: 68, b: 68 },
  },
})
  .jpeg({ quality: 90 })
  .toFile(testJpg);

console.log('Images generated:', testPng, testJpg);

// 2. PDF fixture (3 pages)
const testPdf = path.join(fixturesDir, 'test-document.pdf');
const pdfDoc = await PDFDocument.create();

for (let i = 1; i <= 3; i++) {
  const page = pdfDoc.addPage([400, 300]);
  page.drawText(`Test Page ${i}`, {
    x: 50,
    y: 200,
    size: 24,
    color: rgb(0.1, 0.1, 0.1),
  });
}
await fs.writeFile(testPdf, await pdfDoc.save());
console.log('PDF generated:', testPdf);

// 3. Audio fixture using FFmpeg sine synth (2 seconds MP3)
const testMp3 = path.join(fixturesDir, 'test-audio.mp3');
spawnSync('ffmpeg', [
  '-hide_banner',
  '-y',
  '-f', 'lavfi',
  '-i', 'sine=frequency=440:duration=2',
  '-c:a', 'libmp3lame',
  '-b:a', '128k',
  testMp3,
], { stdio: 'inherit' });
console.log('Audio generated:', testMp3);

// 4. Video fixture using FFmpeg testsrc (2 seconds MP4 with audio)
const testMp4 = path.join(fixturesDir, 'test-video.mp4');
spawnSync('ffmpeg', [
  '-hide_banner',
  '-y',
  '-f', 'lavfi',
  '-i', 'testsrc=duration=2:size=320x240:rate=15',
  '-f', 'lavfi',
  '-i', 'sine=frequency=440:duration=2',
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-c:a', 'aac',
  '-shortest',
  testMp4,
], { stdio: 'inherit' });
console.log('Video generated:', testMp4);

console.log('All fixtures created successfully.');
