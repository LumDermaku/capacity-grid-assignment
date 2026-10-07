import { logger } from '../lib/logger';
import type { Middleware } from '../lib/middlewarePipeline';
import { MAX_BODY_BYTES } from './bodyLimitMiddleware';

async function operationName(req: Request): Promise<string | undefined> {
    if (req.method === 'GET') return new URL(req.url).searchParams.get('operationName') ?? undefined;
    // Only parse bodies the size limit would let through; chunked ones go unnamed.
    const length = Number(req.headers.get('content-length'));
    if (!length || length > MAX_BODY_BYTES) return undefined;
    const body = await req
        .clone()
        .json()
        .catch(() => null);
    return typeof body?.operationName === 'string' ? body.operationName : undefined;
}

// Logs the operation, never the body: variables can carry user data.
const requestLoggingMiddleware: Middleware = async (req, next) => {
    logger.info({ method: req.method, url: req.url, operationName: await operationName(req) }, 'Incoming request');
    return next(req);
};

export default requestLoggingMiddleware;
