import "@typespec/http";

using Http;
@service(#{ title: "Widget Service" })
namespace DemoService;

model Widget {
  id: string;
  weight: int32;
  color: "red" | "blue";
}

model WidgetList {
  items: Widget[];
}

@error
model Error {
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
  @get list(): Read<Widget>[] | Error;
  @get read(@path id: string): Read<Widget> | Error;
  @post create(...Create<Widget>): Read<Widget> | Error;
  @delete delete(@path id: string): void | Error;
}