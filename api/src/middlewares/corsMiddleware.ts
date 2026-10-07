import type { Middleware } from '../lib/middlewarePipeline';
import withCORS from '../lib/withCORS';

const corsMiddleware: Middleware = async (req, next) => withCORS(req, await next(req));

export default corsMiddleware;
