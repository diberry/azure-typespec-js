import type * as http from "node:http";
export interface HttpPart {
    headers: {
        [k: string]: string | undefined;
    };
    body: ReadableStream<Buffer>;
}
/**
 * Processes a request as a multipart request, returning a stream of `HttpPart` objects, each representing an individual
 * part in the multipart request.
 *
 * Only call this function if you have already validated the content type of the request and confirmed that it is a
 * multipart request.
 *
 * @throws Error if the content-type header is missing or does not contain a boundary field.
 *
 * @param request - the incoming request to parse as multipart
 * @returns a stream of HttpPart objects, each representing an individual part in the multipart request
 */
export declare function createMultipartReadable(request: http.IncomingMessage): ReadableStream<HttpPart>;
declare global {
    interface ReadableStream<R> {
        [Symbol.asyncIterator](): AsyncIterableIterator<R>;
    }
}
