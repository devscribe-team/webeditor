"use client";

import { NodeViewComponentProps } from "@handlewithcare/react-prosemirror";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec, Schema } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React from "react";

export const fooNodeSpec: NodeSpec = {
  group: "block",
  content: "block+",
  attrs: {
    dummy: { default: "fosso" },
  },
  selectable: true,
  isolating: true,

  parseDOM: [
    {
      tag: "foo",
      getAttrs: (dom) => ({
        foo: dom.getAttribute("foo") || "another default in case it wasnt provided",
      }),
    },
  ],

  toDOM: (node) => [
    "foo",
    {
      dummy: node.attrs.dummy,
    },
  ],
};

export const FooNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Break(
  { nodeProps, ...props },
  ref,
) {
  const foo = nodeProps.node.attrs.foo || "ok still missing";

  return (
    <div className="p-8 bg-red-500 rounded-lg">
      <h1 contentEditable={false}>{foo}</h1>
      <div {...props} ref={ref} />
    </div>
  );
});

export function addFooRule(schema: Schema) {
  return new InputRule(/^<foo\s*\/>/, (state, match, start, end) => {
    const tr = state.tr;

    const node = schema.nodes.foo.create({}, schema.nodes.paragraph.create());
    tr.replaceRangeWith(start, end, node);
    tr.setSelection(Selection.near(tr.doc.resolve(start + 1)));

    return tr;
  });
}

export function insertFoo(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    dummy: "fosso",
  };

  const foo = state.schema.nodes.foo.create(attrs, state.schema.nodes.paragraph.create());

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(foo);

  // Position cursor inside the foo content
  const insertPos = tr.selection.from;
  const innerPos = insertPos + 1;
  tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));

  return tr;
}
