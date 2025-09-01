import { schema as mdSchema } from "prosemirror-markdown";
import { Schema } from "prosemirror-model";
import { cardNodeSpec } from "./components/card";
import { tabsNodeSpec } from "./components/tabs";
import { calloutNodeSpec } from "./components/callout";
import { badgeNodeSpec } from "./components/badge";
import { codeSnippetNodeSpec } from "./components/code-snippet";
import { breakNodeSpec } from "./components/break";
import { stepNodeSpec } from "./components/steps";
import { accordionNodeSpec } from "./components/accordion";
import { columnsNodeSpec, columnNodeSpec } from "./components/columns";
import { fooNodeSpec } from "./components/foo";
import { iconNodeSpec } from "./components/icon";
import { mermaidNodeSpec } from "./components/mermaid";
import { fieldNodeSpec } from "./components/field";
import { frameNodeSpec } from "./components/frame";

const nodes = mdSchema.spec.nodes
  .remove("code_block")
  .append({ card: cardNodeSpec })
  .append({ tabs: tabsNodeSpec })
  .append({ callout: calloutNodeSpec })
  .append({ badge: badgeNodeSpec })
  .append({ code_snippet: codeSnippetNodeSpec })
  .append({ break: breakNodeSpec })
  .append({ step: stepNodeSpec })
  .append({ accordion: accordionNodeSpec })
  .append({ columns: columnsNodeSpec })
  .append({ column: columnNodeSpec })
  .append({ foo: fooNodeSpec })
  .append({ icon: iconNodeSpec })
  .append({ mermaid: mermaidNodeSpec })
  .append({ field: fieldNodeSpec })
  .append({ frame: frameNodeSpec });

// Add strikethrough and tooltip marks to the existing marks
const marks = mdSchema.spec.marks
  .append({
    strikethrough: {
      inclusive: false,
      parseDOM: [
        { tag: "s" },
        { tag: "del" },
        { tag: "strike" },
        {
          style: "text-decoration",
          getAttrs: (value: string | Node) => {
            return typeof value === "string" && value.includes("line-through") ? {} : false;
          },
        },
      ],
      toDOM: () => ["s", 0],
    },
  })
  .append({
    tooltip_mark: {
      attrs: {
        tooltip: { default: "" },
      },
      inclusive: false,
      parseDOM: [
        {
          tag: "span[data-tooltip]",
          getAttrs: (dom) => ({
            tooltip: (dom as HTMLElement).getAttribute("data-tooltip") || "",
          }),
        },
      ],
      toDOM: (mark) => [
        "span",
        {
          "data-tooltip": mark.attrs.tooltip,
          class:
            "underline decoration-dotted decoration-muted-foreground cursor-help hover:decoration-foreground transition-colors relative group",
        },
        0,
      ],
    },
  });

export const schema = new Schema({
  nodes,
  marks,
});
