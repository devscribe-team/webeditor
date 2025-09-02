"use client";

import { NodeViewComponentProps, useEditorEventCallback } from "@handlewithcare/react-prosemirror";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useState } from "react";
import { useEditorEditable } from "../editorEditableContext";
import { IconEditModal } from "./modals/IconEditModal";
import { resolveInlineIcon, DEFAULT_CARD_ICON } from "./card";

// Icon node spec for ProseMirror
export const iconNodeSpec: NodeSpec = {
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,
  attrs: {
    name: { default: "FileText" },
    size: { default: 20 },
  },
  parseDOM: [
    {
      tag: "icon",
      getAttrs: (dom) => ({
        name: dom.getAttribute("name") || "FileText",
        size: parseInt(dom.getAttribute("size") || "20"),
      }),
    },
  ],
  toDOM: (node) => [
    "icon",
    {
      name: node.attrs.name,
      size: node.attrs.size.toString(),
      class: `inline-flex items-center justify-center text-muted-foreground`,
      style: `width: ${node.attrs.size}px; height: ${node.attrs.size}px;`,
    },
  ],
};

// React NodeView for icon
export const IconNodeView = React.forwardRef<HTMLSpanElement, NodeViewComponentProps>(function Icon(
  { nodeProps },
  ref,
) {
  const [modalOpen, setModalOpen] = useState(false);
  const name = nodeProps.node.attrs.name || "FileText";
  const size = nodeProps.node.attrs.size || 20;
  const editable = useEditorEditable();

  const updateIcon = useEditorEventCallback(
    (view, { icon: newIcon, size: newSize }: { icon: string; size: number }) => {
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
        name: newIcon,
        size: newSize,
      });
      view.dispatch(tr);
      setModalOpen(false);
    },
  );

  const iconElement = resolveInlineIcon(name, {
    size: size,
    showIcon: true,
    fallbackIcon: DEFAULT_CARD_ICON,
  });

  return (
    <>
      <IconEditModal
        open={modalOpen}
        initialIcon={name}
        initialSize={size}
        onCloseAction={() => setModalOpen(false)}
        onSubmitAction={updateIcon}
        modalTitle="Edit Icon"
        iconLabel="Icon Name"
        iconPlaceholder="e.g. FileText, Book, Star, Heart"
        sizeLabel="Size (pixels)"
        sizePlaceholder="e.g. 16, 20, 24, 32"
        showSize={true}
      />
      <span
        data-icon=""
        data-name={name}
        className={`inline-flex items-center justify-center text-muted-foreground ${
          editable ? "cursor-pointer hover:cursor-pointer hover:text-foreground transition-colors" : ""
        }`}
        ref={ref}
        contentEditable={false}
        suppressContentEditableWarning
        onClick={(e) => {
          if (!editable) return;
          e.stopPropagation();
          setModalOpen(true);
        }}
        onKeyDown={(e) => {
          if (!editable) return;
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            setModalOpen(true);
          }
        }}
        tabIndex={editable ? 0 : -1}
        aria-disabled={!editable}
        aria-label={editable ? `Change icon (currently ${name})` : undefined}
        title={editable ? `Click to change icon (${name})` : name}
      >
        {iconElement}
      </span>
    </>
  );
});

// Input rule for <icon name="..." size="..."/>
export const addIconRule = new InputRule(/^<icon(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
  const { tr, schema } = state;
  const attrs = {
    name: "FileText",
    size: 20,
  };

  if (match[1]) {
    const nameMatch = match[1].match(/name="([^"]*)"/);
    if (nameMatch) attrs.name = nameMatch[1];

    const sizeMatch = match[1].match(/size="([^"]*)"/);
    if (sizeMatch) attrs.size = parseInt(sizeMatch[1]) || 20;
  }

  if (!schema.nodes.icon) return null;

  const iconNode = schema.nodes.icon.create(attrs);

  tr.replaceRangeWith(start, end, iconNode);

  // Place selection after the icon
  tr.setSelection(Selection.near(tr.doc.resolve(start + iconNode.nodeSize)));

  return tr;
});

export function insertIcon(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    name: "FileText",
    size: 20,
  };

  const iconNode = state.schema.nodes.icon.create(attrs);

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(iconNode);

  // Place selection after the icon
  tr = tr.setSelection(Selection.near(tr.doc.resolve(tr.selection.from + iconNode.nodeSize)));

  return tr;
}
