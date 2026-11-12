import { spawn } from 'node:child_process';

console.log('--------------------------------------------------');
console.log(' Starting Perfect Downloader Fullstack Platform');
console.log('   - API: http://localhost:4000 (Docs: /docs)');
console.log('   - Web: http://localhost:3000');
console.log('--------------------------------------------------');

// 1. Start API Server
const api = spawn('npm', ['run', 'dev', '-w', '@pd/api'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '4000' },
});

// 2. Start Web Application
const web = spawn('npm', ['run', 'dev', '-w', '@pd/web'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '3000', API_URL: 'http://localhost:4000' },
});

const cleanup = () => {
  console.log('\nShutting down Perfect Downloader services...');
  api.kill();
  web.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
