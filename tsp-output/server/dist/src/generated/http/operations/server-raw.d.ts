import { HttpContext } from "../../helpers/router.js";
import { Widgets } from "../../models/all/widget-service.js";
export declare function widgets_list(__ctx_2: HttpContext, __operations_4: Widgets): Promise<void>;
export declare function widgets_read(__ctx_6: HttpContext, __operations_8: Widgets, id: string): Promise<void>;
export declare function widgets_create(__ctx_10: HttpContext, __operations_12: Widgets): Promise<void>;
export declare function widgets_delete(__ctx_16: HttpContext, __operations_18: Widgets, id: string): Promise<void>;
