import { logger } from '../lib/logger';
import type { Middleware } from '../lib/middlewarePipeline';

// First in the pipeline, so the time covers the whole request.
const responseLoggingMiddleware: Middleware = async (req, next) => {
    const start = performance.now();
    const response = await next(req);
    logger.info(
        { statusCode: response.status, responseTime: `${(performance.now() - start).toFixed(1)}ms` },
        'Request completed',
    );
    return response;
};

export default responseLoggingMiddleware;
