import { HttpContext } from "./router.js";
export declare const HTTP_RESPONDER: unique symbol;
/**
 * A type that can respond to an HTTP request.
 */
export interface HttpResponder {
    /**
     * A function that handles an HTTP request and response.
     *
     * @param context - The HTTP context.
     */
    [HTTP_RESPONDER]: (context: HttpContext) => void;
}
/**
 * Determines if a value is an HttpResponder.
 * @param value - The value to check.
 * @returns `true` if the value is an HttpResponder, otherwise `false`.
 */
export declare function isHttpResponder(value: unknown): value is HttpResponder;
/**
 * An Error that can respond to an HTTP request if thrown from a route handler.
 */
export declare class HttpResponderError extends Error implements HttpResponder {
    #private;
    constructor(statusCode: number, message: string);
    [HTTP_RESPONDER](ctx: HttpContext): void;
}
/**
 * The requested resource was not found.
 */
export declare class NotFoundError extends HttpResponderError {
    constructor();
}
/**
 * The request was malformed.
 */
export declare class BadRequestError extends HttpResponderError {
    constructor();
}
/**
 * The request is missing required authentication credentials.
 */
export declare class UnauthorizedError extends HttpResponderError {
    constructor();
}
/**
 * The request is missing required permissions.
 */
export declare class ForbiddenError extends HttpResponderError {
    constructor();
}
/**
 * The request conflicts with the current state of the server.
 */
export declare class ConflictError extends HttpResponderError {
    constructor();
}
/**
 * The server encountered an unexpected condition that prevented it from fulfilling the request.
 */
export declare class InternalServerError extends HttpResponderError {
    constructor();
}
/**
 * The server does not support the functionality required to fulfill the request.
 */
export declare class NotImplementedError extends HttpResponderError {
    constructor();
}
