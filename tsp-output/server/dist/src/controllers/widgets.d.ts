import { Widgets, Error } from "../generated/models/all/demo-service.js";
import { HttpContext } from "../generated/helpers/router.js";
import { ReadWidget } from "../generated/models/all/typespec.js";
export declare class WidgetsImpl implements Widgets<HttpContext> {
    list(ctx: HttpContext): Promise<ReadWidget[] | Error>;
    read(ctx: HttpContext, id: string): Promise<ReadWidget | Error>;
    create(ctx: HttpContext, id: string, weight: number, color: "red" | "blue"): Promise<ReadWidget | Error>;
    delete(ctx: HttpContext, id: string): Promise<void | Error>;
}
