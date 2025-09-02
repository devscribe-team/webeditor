"use client";

import { NodeViewComponentProps, useEditorEventCallback } from "@handlewithcare/react-prosemirror";
import { Minus, Plus } from "lucide-react";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec, Fragment } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useState } from "react";
import { useEditorEditable } from "../editorEditableContext";

// Node spec for columns
export const columnsNodeSpec: NodeSpec = {
  group: "block",
  content: "column+",
  attrs: {
    cols: { default: 2 },
    gap: { default: "md" },
  },
  selectable: true,
  parseDOM: [
    {
      tag: "columns",
      getAttrs: (dom) => ({
        cols: parseInt(dom.getAttribute("cols") || "2", 10),
        gap: dom.getAttribute("gap") || "md",
      }),
    },
  ],
  toDOM: (node) => [
    "columns",
    {
      cols: node.attrs.cols,
      gap: node.attrs.gap,
    },
    0,
  ],
};

// Node spec for individual column
export const columnNodeSpec: NodeSpec = {
  content: "block+",
  defining: true,
  isolating: true,
  parseDOM: [{ tag: "column" }],
  toDOM: () => ["column", 0],
};

// Individual column node view
export const ColumnNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Column(
  { nodeProps, children, ...props },
  ref,
) {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

// Node view
export const ColumnsNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Columns(
  { nodeProps, children, ...props },
  ref,
) {
  const cols = parseInt(nodeProps.node.attrs.cols ?? 2, 10);
  const gap = nodeProps.node.attrs.gap ?? "md";
  const editable = useEditorEditable();
  const [showOptions, setShowOptions] = useState(false);

  const gapClasses = {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
  };
  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  const updateColumns = useEditorEventCallback((view, newCols: number) => {
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

    let tr = view.state.tr;
    const currentCols = node.attrs.cols;
    const existingColumns = [];

    // Collect existing column content
    for (let i = 0; i < node.childCount; i++) {
      existingColumns.push(node.child(i));
    }

    // Create new column structure
    const newColumns = [];
    for (let i = 0; i < newCols; i++) {
      if (i < existingColumns.length) {
        // Use existing column
        newColumns.push(existingColumns[i]);
      } else {
        // Create new empty column
        newColumns.push(view.state.schema.nodes.column.create({}, view.state.schema.nodes.paragraph.create()));
      }
    }

    // Create new columns node with updated column count and content
    const newColumnsNode = view.state.schema.nodes.columns.create({ ...node.attrs, cols: newCols }, newColumns);

    tr = tr.replaceWith(pos, pos + node.nodeSize, newColumnsNode);
    view.dispatch(tr);
  });

  const handleDecreaseCols = () => {
    if (cols > 1) {
      updateColumns(cols - 1);
    }
  };

  const handleIncreaseCols = () => {
    if (cols < 4) {
      updateColumns(cols + 1);
    }
  };

  return (
    <div
      ref={ref}
      data-columns=""
      // @ts-expect-error colClasses is unknown
      className={`relative grid ${colClasses[cols] || colClasses[2]} ${gapClasses[gap]} w-full my-6 ${
        editable ? "border-dotted border border-zinc-700/50 rounded-lg p-4" : ""
      }`}
      onMouseEnter={() => editable && setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
      {...props}
    >
      {/* Column count controls */}
      {editable && (
        <div
          className={`absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-200 ${
            showOptions ? "opacity-100" : "opacity-0 pointer-events-none"
          } z-10 bg-black/10 rounded-lg px-2 py-1 shadow-lg`}
        >
          <button
            onClick={handleDecreaseCols}
            disabled={cols <= 1}
            className="flex items-center outline-none select-none hover:cursor-pointer bg-zinc-800/60 text-white/80 rounded px-2 py-0.5 hover:bg-zinc-700/60 transition-colors text-xs font-mono disabled:text-white/40 disabled:cursor-not-allowed disabled:hover:bg-zinc-800/60"
            title="Remove column"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="bg-zinc-800/60 text-white/80 text-xs font-mono px-2 py-0.5 rounded min-w-[1.5rem] text-center">
            {cols}
          </span>
          <button
            onClick={handleIncreaseCols}
            disabled={cols >= 4}
            className="flex items-center outline-none select-none hover:cursor-pointer bg-zinc-800/60 text-white/80 rounded px-2 py-0.5 hover:bg-zinc-700/60 transition-colors text-xs font-mono disabled:text-white/40 disabled:cursor-not-allowed disabled:hover:bg-zinc-800/60"
            title="Add column"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}
      {editable && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: cols }, (_, i) => (
            <div
              key={i}
              className="absolute border border-dashed border-zinc-600/30 rounded"
              style={{
                left: `${(100 / cols) * i}%`,
                width: `${100 / cols}%`,
                top: 0,
                height: "100%",
                marginRight: i < cols - 1 ? "0.75rem" : "0",
              }}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
});

// Input rule for <Columns cols=2 gap="md" />
export const addColumnsRule = new InputRule(/^<columns(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
  const { tr, schema } = state;
  let cols = 2;
  let gap = "md";
  if (match[1]) {
    const colsMatch = match[1].match(/cols="?(\d)"?/);
    if (colsMatch) cols = parseInt(colsMatch[1], 10);
    const gapMatch = match[1].match(/gap="(sm|md|lg)"/);
    if (gapMatch) gap = gapMatch[1];
  }

  // Create column nodes with empty paragraphs
  const columnNodes = Array.from({ length: cols }, () =>
    schema.nodes.column.create({}, schema.nodes.paragraph.create()),
  );

  const columns = schema.nodes.columns.create({ cols, gap }, columnNodes);
  const emptyParagraph = schema.nodes.paragraph.create();

  // Create a fragment with both columns and paragraph
  const fragment = Fragment.from([columns, emptyParagraph]);
  tr.replaceWith(start, end, fragment);

  const newPos = start + 2; // Into first column's paragraph
  // @ts-expect-error tr.selection.constructor.near is unknown
  tr.setSelection(tr.selection.constructor.near(tr.doc.resolve(newPos)));
  return tr;
});

export function insertColumns(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    cols: 2,
    gap: "md",
  };

  // Create column nodes with empty paragraphs
  const columnNodes = Array.from({ length: attrs.cols }, () =>
    state.schema.nodes.column.create({}, state.schema.nodes.paragraph.create()),
  );

  const columns = state.schema.nodes.columns.create(attrs, columnNodes);
  const emptyParagraph = state.schema.nodes.paragraph.create();

  let tr = state.tr;

  const insertPos = from;
  const endPos = to;

  // Create a fragment with both columns and paragraph
  const fragment = Fragment.from([columns, emptyParagraph]);
  tr = tr.replaceWith(insertPos, endPos, fragment);

  // Position cursor inside the first column
  const innerPos = insertPos + 2; // Into first column's paragraph
  tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));

  return tr;
}
