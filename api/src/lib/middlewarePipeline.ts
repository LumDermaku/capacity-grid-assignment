export type Middleware = (req: Request, next: (req: Request) => Promise<Response>) => Promise<Response>;

export function createMiddlewarePipeline(...middlewares: Middleware[]) {
    return async function handle(initialReq: Request): Promise<Response> {
        let index = -1;

        async function dispatch(i: number, req: Request): Promise<Response> {
            if (i <= index) throw new Error('next() called multiple times');
            index = i;
            const fn = middlewares[i];
            if (!fn) return new Response('Not Found', { status: 404 });
            return fn(req, (newReq) => dispatch(i + 1, newReq));
        }

        return dispatch(0, initialReq);
    };
}
