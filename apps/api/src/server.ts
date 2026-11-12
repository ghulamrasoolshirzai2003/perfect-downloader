import { createReadStream, promises as fs } from 'node:fs';
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import {
  AppError,
  ERROR_HTTP_STATUS,
  PLATFORMS,
  toPublicPlatform,
  getToolByRoute,
  buildOptionsSchema,
  missingCapabilities,
  InspectRequestSchema,
  DownloadRequestSchema,
  type PlatformRuntimeContext,
} from '@pd/shared';
import { TempStorageManager, executeTool, type ManagedTempFile } from '@pd/media-core';
import { inspectUrl, executeDownload } from '@pd/downloader-core';
import { loadConfig } from './config';
import { JobStore } from './job-store';
import { detectSystemCapabilities, getSystemCapabilitiesInfo } from './capabilities';

export async function buildServer(): Promise<{ app: FastifyInstance; close: () => Promise<void> }> {
  const config = loadConfig();
  const startTime = Date.now();

  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'error' : 'info',
    },
    disableRequestLogging: process.env.NODE_ENV === 'test',
  });

  const tempManager = new TempStorageManager(config.tempMediaDir, config.jobTtlMs);
  await tempManager.init();

  const jobStore = new JobStore(config.jobTtlMs);

  const runtimeContext: PlatformRuntimeContext = {
    enabledRestricted: config.enabledRestrictedPlatforms,
    disabled: config.disabledPlatforms,
  };

  // 1. CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      // In development allow all local or undefined origins
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        cb(null, true);
        return;
      }
      cb(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // 2. Rate limiting
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
  });

  // 3. Multipart for tool uploads
  await app.register(multipart, {
    limits: {
      fileSize: config.maxUploadSizeMb * 1024 * 1024,
      files: 50,
    },
  });

  // 4. OpenAPI / Swagger documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Perfect Downloader API',
        description: 'Universal media downloader and online media-processing toolkit API.',
        version: '0.1.0',
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // 5. Global Error Handler
  app.setErrorHandler((error: any, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof AppError) {
      reply.status(error.status).send(error.toBody());
      return;
    }

    if (error.validation) {
      reply.status(400).send({
        error: {
          code: 'INVALID_OPTIONS',
          message: error.message,
          details: { validation: error.validation },
        },
      });
      return;
    }

    if (error.statusCode === 429) {
      reply.status(429).send({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests, please try again shortly',
          retryAfter: 60,
        },
      });
      return;
    }

    request.log.error(error);
    reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal error occurred',
      },
    });
  });

  // ── Routes ──────────────────────────────────────────────────────────────────

  // Health
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Capabilities
  app.get('/api/v1/capabilities', async () => {
    return getSystemCapabilitiesInfo(startTime);
  });

  // Platforms registry
  app.get('/api/v1/platforms', async () => {
    const platforms = PLATFORMS.map((p) => toPublicPlatform(p, runtimeContext));
    return { platforms };
  });

  // Inspect URL
  app.post('/api/v1/inspect', async (request, reply) => {
    const parsed = InspectRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('INVALID_URL', parsed.error.issues[0]?.message || 'Invalid URL payload');
    }

    const result = await inspectUrl({
      url: parsed.data.url,
      runtimeContext,
    });

    return { data: result };
  });

  // Start Download Job
  app.post('/api/v1/download', async (request, reply) => {
    const parsed = DownloadRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new AppError('INVALID_OPTIONS', parsed.error.issues[0]?.message || 'Invalid request body');
    }

    const { url, formatId, attestation, targetFormat, title } = parsed.data;

    // Create async job
    const jobRecord = jobStore.createJob('download');
    const jobId = jobRecord.state.id;

    // Execute in background
    (async () => {
      try {
        jobStore.updateProgress(jobId, { stage: 'Starting download' });

        const result = await executeDownload({
          url,
          formatId,
          title,
          attestation,
          targetFormat,
          runtimeContext,
          tempManager,
          onProgress: (p) => {
            jobStore.updateProgress(jobId, {
              percent: p.percent,
              speed: p.speed,
              eta: p.eta,
              stage: 'Downloading media',
            });
          },
          signal: jobRecord.abortController?.signal,
        });

        const stat = await fs.stat(result.file.path);
        jobStore.completeJob(jobId, result.file, {
          fileName: result.fileName,
          mimeType: result.mimeType,
          fileSize: stat.size,
        });
      } catch (err) {
        jobStore.failJob(jobId, err);
      }
    })();

    reply.status(202).send({ job: jobRecord.state });
  });

  // Job Status
  app.get('/api/v1/jobs/:id', async (request) => {
    const { id } = request.params as { id: string };
    const jobRecord = jobStore.getJob(id);
    if (!jobRecord) {
      throw new AppError('JOB_NOT_FOUND', 'The requested job was not found or has expired');
    }
    return { job: jobRecord.state };
  });

  // Download Job Result File
  app.get('/api/v1/jobs/:id/download', async (request, reply) => {
    const { id } = request.params as { id: string };
    const jobRecord = jobStore.getJob(id);

    if (!jobRecord) {
      throw new AppError('JOB_NOT_FOUND', 'The job has expired or does not exist');
    }

    if (jobRecord.state.status !== 'completed' || !jobRecord.tempFile) {
      throw new AppError('JOB_NOT_READY', 'The result file is not ready for download');
    }

    const filePath = jobRecord.tempFile.path;
    const fileName = jobRecord.state.outputFileName || 'media-download';
    const mimeType = jobRecord.state.outputMimeType || 'application/octet-stream';

    const stat = await fs.stat(filePath);

    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    reply.header('Content-Type', mimeType);
    reply.header('Content-Length', stat.size);

    return reply.send(createReadStream(filePath));
  });

  // Execute Tool (Workflow B: file uploads)
  app.post('/api/v1/tools/:category/:action', async (request, reply) => {
    const { category, action } = request.params as { category: string; action: string };
    const tool = getToolByRoute(category, action);

    if (!tool) {
      throw new AppError('NOT_FOUND', `Unknown tool: ${category}/${action}`);
    }

    // Check capability requirements
    const caps = new Set(detectSystemCapabilities());
    const missing = missingCapabilities(tool, caps);
    if (missing.length > 0) {
      throw new AppError('TEMPORARY_SERVICE_UNAVAILABLE', `This tool requires missing server capabilities: ${missing.join(', ')}`);
    }

    const parts = request.parts();
    const uploadedManagedFiles: ManagedTempFile[] = [];
    const rawOptions: Record<string, unknown> = {};

    try {
      for await (const part of parts) {
        if (part.type === 'file') {
          const ext = part.filename.split('.').pop() || 'tmp';
          const managed = await tempManager.createTempFile({ prefix: 'upload', extension: ext });
          await fs.writeFile(managed.path, await part.toBuffer());
          uploadedManagedFiles.push(managed);
        } else {
          // Field
          try {
            rawOptions[part.fieldname] = JSON.parse(part.value as string);
          } catch {
            rawOptions[part.fieldname] = part.value;
          }
        }
      }

      // Check min/max files
      if (uploadedManagedFiles.length < tool.minFiles) {
        throw new AppError('INVALID_OPTIONS', `Tool ${tool.name} requires at least ${tool.minFiles} file(s)`);
      }
      if (uploadedManagedFiles.length > tool.maxFiles) {
        throw new AppError('TOO_MANY_FILES', `Tool ${tool.name} allows at most ${tool.maxFiles} file(s)`);
      }

      // Validate options against tool schema
      const schema = buildOptionsSchema(tool, caps);
      const parseRes = schema.safeParse(rawOptions);
      if (!parseRes.success) {
        throw new AppError('INVALID_OPTIONS', parseRes.error.issues[0]?.message || 'Invalid tool options');
      }

      const inputPaths = uploadedManagedFiles.map((f) => f.path);

      if (tool.output === 'data') {
        // Synchronous inspection tool (metadata)
        const result = await executeTool({
          tool,
          inputFiles: inputPaths,
          options: parseRes.data as Record<string, unknown>,
          tempManager,
        });

        // Cleanup uploads
        await Promise.all(uploadedManagedFiles.map((f) => f.cleanup()));

        return { data: result.data };
      }

      // File-generating tool -> enqueue job
      const jobRecord = jobStore.createJob('tool');
      jobRecord.inputFilesToClean = uploadedManagedFiles;
      const jobId = jobRecord.state.id;

      (async () => {
        try {
          jobStore.updateProgress(jobId, { stage: `Processing ${tool.name}` });

          const result = await executeTool({
            tool,
            inputFiles: inputPaths,
            options: parseRes.data as Record<string, unknown>,
            tempManager,
            onProgress: (p) => jobStore.updateProgress(jobId, p),
            signal: jobRecord.abortController?.signal,
          });

          if (result.outputFile) {
            const stat = await fs.stat(result.outputFile.path);
            jobStore.completeJob(jobId, result.outputFile, {
              fileName: result.outputFileName,
              mimeType: result.outputMimeType,
              fileSize: stat.size,
            });
          }

          // Clean up inputs now that processing is done
          await Promise.all(uploadedManagedFiles.map((f) => f.cleanup()));
          jobRecord.inputFilesToClean = [];
        } catch (err) {
          jobStore.failJob(jobId, err);
          await Promise.all(uploadedManagedFiles.map((f) => f.cleanup())).catch(() => {});
        }
      })();

      reply.status(202).send({ job: jobRecord.state });
    } catch (err) {
      await Promise.all(uploadedManagedFiles.map((f) => f.cleanup())).catch(() => {});
      throw err;
    }
  });

  // Operational stats
  app.get('/api/v1/stats', async () => {
    return {
      activeJobs: jobStore.getActiveCount(),
      totalJobs: jobStore.getTotalCount(),
      uptimeSeconds: Math.round((Date.now() - startTime) / 1000),
      storageBaseDir: tempManager.getBaseDir(),
    };
  });

  const close = async () => {
    await app.close();
    await jobStore.close();
    await tempManager.close();
  };

  return { app, close };
}

// Start standalone if executed directly
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  const config = loadConfig();
  buildServer().then(({ app }) => {
    app.listen({ port: config.port, host: config.host }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Server listening on ${address}`);
    });
  });
}
