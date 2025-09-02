import { NodeViewComponentProps, useEditorEventCallback } from "@handlewithcare/react-prosemirror";
import { Info, Lightbulb, MessageSquareWarning, OctagonAlert, TriangleAlert } from "lucide-react";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useState } from "react";
import { useEditorEditable } from "../editorEditableContext";
import { CalloutType, CalloutTypeEditModal } from "./modals/CalloutTypeEditModal";

export const calloutNodeSpec: NodeSpec = {
  group: "block",
  content: "block+",
  attrs: {
    type: { default: "info" },
  },
  selectable: true,

  parseDOM: [
    {
      tag: "callout",
      getAttrs: (dom) => ({
        type: dom.getAttribute("type") || "info",
      }),
    },
    {
      tag: "info",
      getAttrs: () => ({ type: "info" }),
    },
    {
      tag: "important",
      getAttrs: () => ({ type: "important" }),
    },
    {
      tag: "warning",
      getAttrs: () => ({ type: "warning" }),
    },
    {
      tag: "caution",
      getAttrs: () => ({ type: "caution" }),
    },
    {
      tag: "tip",
      getAttrs: () => ({ type: "tip" }),
    },
  ],

  toDOM: (node) => [
    "callout",
    {
      type: node.attrs.type || "info",
    },
    0,
  ],
};

export const CalloutNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Callout(
  { nodeProps, ...props },
  ref,
) {
  const [modalOpen, setModalOpen] = useState(false);
  const type: CalloutType = nodeProps.node.attrs.type || "info";
  const editable = useEditorEditable();

  const typeInformation = (
    {
      info: {
        icon: Info,
        headerText: "Note",
        iconColor: "text-blue-600",
        backgroundColor: "bg-blue-500/10",
        borderColor: "border-blue-500/20",
      },
      warning: {
        icon: TriangleAlert,
        headerText: "Warning",
        iconColor: "text-yellow-600",
        backgroundColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
      },
      caution: {
        icon: OctagonAlert,
        headerText: "Caution",
        iconColor: "text-red-600",
        backgroundColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
      },
      important: {
        icon: MessageSquareWarning,
        headerText: "Important",
        iconColor: "text-violet-600",
        backgroundColor: "bg-violet-500/10",
        borderColor: "border-violet-500/20",
      },
      tip: {
        icon: Lightbulb,
        headerText: "Tip",
        iconColor: "text-green-600",
        backgroundColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
      },
    } as const
  )[type];

  const updateType = useEditorEventCallback((view, newType: CalloutType) => {
    const { getPos, node } = nodeProps;
    if (typeof getPos !== "function") {
      console.error("getPos is not a function");
      return;
    }
    const pos = getPos();
    if (typeof pos !== "number") {
      console.error("getPos did not return a number");
      return;
    }
    const tr = view.state.tr;
    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      type: newType,
    });
    view.dispatch(tr);
    setModalOpen(false);
  });

  const handleTypeClick = (e: React.MouseEvent) => {
    if (!editable) return;
    e.stopPropagation();
    setModalOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.stopPropagation();
      setModalOpen(true);
    }
  };

  return (
    <div
      className={`w-full border rounded-lg overflow-hidden py-2 ${typeInformation.borderColor} ${typeInformation.backgroundColor}`}
    >
      <CalloutTypeEditModal
        open={modalOpen}
        initialType={type}
        onCloseAction={() => setModalOpen(false)}
        onSubmitAction={updateType}
      />
      <div className="flex flex-row w-full items-start">
        <div
          contentEditable={false}
          className={`flex px-4 py-1 ${editable ? "cursor-pointer hover:cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
          onClick={handleTypeClick}
          onKeyDown={handleKeyDown}
          tabIndex={editable ? 0 : -1}
          aria-disabled={!editable}
          role={editable ? "button" : undefined}
          aria-label={editable ? `Change callout type (currently ${typeInformation.headerText})` : undefined}
          title={typeInformation.headerText}
        >
          <typeInformation.icon className={`size-7 ${typeInformation.iconColor}`} />
        </div>

        <div className="flex-1 px-4 pl-0 prose prose-sm max-w-none" {...props} ref={ref} />
      </div>
    </div>
  );
});

export const addCalloutRule = new InputRule(/^<callout(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
  const { tr, schema } = state;
  let type = "info";
  if (match[1]) {
    const typeMatch = match[1].match(/type="([^"]*)"/);
    if (typeMatch) type = typeMatch[1];
  }
  const callout = schema.nodes.callout.create({ type }, schema.nodes.paragraph.create());
  tr.replaceRangeWith(start, end, callout);
  const newPos = start + 1;
  tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
  return tr;
});

export function insertCallout(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    type: "info",
  };

  const callout = state.schema.nodes.callout.create(attrs, state.schema.nodes.paragraph.create());

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(callout);

  // Position cursor inside the callout content
  const insertPos = tr.selection.from;
  const innerPos = insertPos + 1;
  tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));

  return tr;
}
