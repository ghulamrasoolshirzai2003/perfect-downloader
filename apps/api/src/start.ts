import { loadConfig } from './config';
import { buildServer } from './server';

const config = loadConfig();
const { app } = await buildServer();

app.listen({ port: config.port, host: config.host }, (err, address) => {
  if (err) {
    console.error('Failed to start API:', err);
    process.exit(1);
  }
  console.log(`[API] Perfect Downloader API listening on ${address}`);
  console.log(`[API] OpenAPI Docs available at ${address}/docs`);
});
