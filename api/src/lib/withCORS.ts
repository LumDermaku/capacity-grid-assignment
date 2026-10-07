const httpMethods = ['GET', 'POST', 'OPTIONS'];

const allowedHeaders = ['Content-Type', 'Accept', 'Origin', 'Referer', 'User-Agent'];

export default function withCORS(request: Request, response: Response) {
    const requestOrigin = request.headers.get('origin');
    response.headers.set('Access-Control-Allow-Origin', requestOrigin || '*');
    response.headers.set('Access-Control-Allow-Methods', httpMethods.join(','));
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(','));
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    return response;
}
