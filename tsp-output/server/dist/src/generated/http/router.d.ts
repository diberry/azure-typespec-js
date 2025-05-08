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
}
export declare function createDemoServiceRouter(widgets: Widgets, options?: RouterOptions<{
    widgets: Widgets<HttpContext>;
}>): DemoServiceRouter;
