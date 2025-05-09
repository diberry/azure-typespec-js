import "@typespec/http";

using Http;
@service(#{ title: "Widget Service" })
namespace WidgetService;

model Widget {
  id: string;
  weight: int32;
  color: "red" | "blue";
}

model WidgetList {
  widgets: Read<Widget>[],
}

@error
model WidgetError {
  code: int32;
  message: string;
}

model AnalyzeResult {
  id: string;
  analysis: string;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  @get op list(): WidgetList | WidgetError;
  @get read(@path id: string): Read<Widget> | WidgetError;
  @post create(...Create<Widget>): Read<Widget> | WidgetError;
  @delete delete(@path id: string): void | WidgetError;
}