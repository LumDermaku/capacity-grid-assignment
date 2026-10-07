import { sql, waitForDb } from './db';
import { YOGA_ENDPOINT } from './lib/constants';
import { logger } from './lib/logger';
import { createMiddlewarePipeline } from './lib/middlewarePipeline';
import bodyLimitMiddleware from './middlewares/bodyLimitMiddleware';
import coreMiddleware from './middlewares/coreMiddleware';
import corsMiddleware from './middlewares/corsMiddleware';
import requestLoggingMiddleware from './middlewares/requestLoggingMiddleware';
import responseLoggingMiddleware from './middlewares/responseLoggingMiddleware';

async function healthHandler() {
    try {
        const [{ people }] = await sql`SELECT count(*)::int AS people FROM people`;
        return Response.json({ ok: true, people });
    } catch (err) {
        logger.error({ err }, 'Health check failed');
        return Response.json({ error: 'internal error' }, { status: 500 });
    }
}

async function startServer() {
    try {
        await waitForDb();

        const server = Bun.serve({
            port: 8080,
            routes: {
                '/api/health': { GET: healthHandler },
                [YOGA_ENDPOINT]: createMiddlewarePipeline(
                    // First, so it times the whole request.
                    responseLoggingMiddleware,
                    requestLoggingMiddleware,
                    corsMiddleware,
                    bodyLimitMiddleware,
                    coreMiddleware,
                ),
            },
            error(error) {
                logger.error({ err: error }, 'Request error');
                return Response.json({ error: 'internal error' }, { status: 500 });
            },
        });

        logger.info(`Server started at http://${server.hostname}:${server.port}${YOGA_ENDPOINT}`);

        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}, shutting down gracefully`);
            await server.stop();
            await sql.close();
            process.exit(0);
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        logger.error({ err: error }, 'Error starting server');
        process.exit(1);
    }
}

startServer();
