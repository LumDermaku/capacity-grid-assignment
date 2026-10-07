import type { Middleware } from '../lib/middlewarePipeline';

// The app's operations are a few hundred bytes; anything far bigger is not ours.
export const MAX_BODY_BYTES = 8 * 1024;

const tooLarge = () => Response.json({ errors: [{ message: 'request body too large' }] }, { status: 413 });

const bodyLimitMiddleware: Middleware = async (req, next) => {
    if (req.method !== 'POST') return next(req);
    if (Number(req.headers.get('content-length')) > MAX_BODY_BYTES) return tooLarge();
    // Content-Length can be absent (chunked) or wrong, so check what actually arrived.
    const body = await req.arrayBuffer();
    if (body.byteLength > MAX_BODY_BYTES) return tooLarge();
    return next(new Request(req, { body }));
};

export default bodyLimitMiddleware;
