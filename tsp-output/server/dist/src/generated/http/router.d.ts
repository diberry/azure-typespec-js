import * as http from "node:http";
import { Widgets } from "../models/all/demo-service.js";
import { RouterOptions, HttpContext } from "../helpers/router.js";
export interface DemoServiceRouter {
    /**
     * Dispatches the request to the appropriate service based on the request path.
     *
     * This member function may be used directly as a handler for a Node HTTP server.
     *
     * @param request - The incoming HTTP request.
     * @param response - The outgoing HTTP response.
     */
    dispatch(request: http.IncomingMessage, response: http.ServerResponse): void;
    /**
     * An Express middleware function that dispatches the request to the appropriate service based on the request path.
     *
     * This member function may be used directly as an application-level middleware function in an Express app.
     *
     * If the router does not match a route, it will call the `next` middleware registered with the application,
     * so it is sensible to insert this middleware at the beginning of the middleware stack.
     *
     * @param req - The incoming HTTP request.
     * @param res - The outgoing HTTP response.
     * @param next - The next middleware function in the stack.
     */
    expressMiddleware(req: http.IncomingMessage, res: http.ServerResponse, next: () => void): void;
}
export declare function createDemoServiceRouter(widgets: Widgets, options?: RouterOptions<{
    widgets: Widgets<HttpContext>;
}>): DemoServiceRouter;
