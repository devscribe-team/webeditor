"use client";

import { NodeViewComponentProps, useEditorEventCallback, useEditorEffect } from "@handlewithcare/react-prosemirror";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec, Schema } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useState, useCallback, useRef } from "react";
import { useEditorEditable } from "../editorEditableContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactDOM from "react-dom";

export const breakNodeSpec: NodeSpec = {
  group: "block",
  content: "",
  attrs: {
    size: { default: 24 },
  },
  selectable: true,
  atom: true,
  defining: true,

  parseDOM: [
    {
      tag: "break",
      getAttrs: (dom) => ({
        size: parseInt(dom.getAttribute("size") || "24"),
      }),
    },
  ],

  toDOM: (node) => [
    "break",
    {
      size: node.attrs.size.toString(),
      style: `height: ${node.attrs.size}px; display: block;`,
    },
  ],
};

export const BreakNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Break(
  { nodeProps, ...props },
  ref,
) {
  const size = nodeProps.node.attrs.size ?? 24;
  const editable = useEditorEditable();
  const [modalOpen, setModalOpen] = useState(false);
  const [inputSize, setInputSize] = useState(size.toString());
  const [isCaretNear, setIsCaretNear] = useState(false);

  const viewRef = useRef(null);

  // Check if caret is near this break node
  const checkCaretProximity = useCallback(
    (view: any) => {
      const { getPos } = nodeProps;
      if (typeof getPos !== "function") return;

      const pos = getPos();
      if (typeof pos !== "number") return;

      const { selection } = view.state;
      const { from, to } = selection;

      // Get break node boundaries
      const breakStart = pos;
      const breakEnd = pos + nodeProps.node.nodeSize;

      // Check if selection is directly adjacent to the break node
      // or within a small range around it
      const proximityRange = 10;
      const isDirectlyAdjacent =
        from === breakStart ||
        from === breakEnd ||
        to === breakStart ||
        to === breakEnd ||
        (from >= breakStart - proximityRange && from <= breakEnd + proximityRange) ||
        (to >= breakStart - proximityRange && to <= breakEnd + proximityRange);

      setIsCaretNear(isDirectlyAdjacent);
    },
    [nodeProps],
  );

  // Use useEditorEffect to properly capture the view and monitor selection changes
  useEditorEffect(
    (view) => {
      viewRef.current = view as any;

      // Initial check
      checkCaretProximity(view);

      return () => {
        viewRef.current = null;
      };
    },
    [checkCaretProximity],
  );

  // Handler to update size attribute
  const updateSize = useEditorEventCallback(
    (view, newSize: number) => {
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
        size: newSize,
      });
      view.dispatch(tr);
      setModalOpen(false);

      // Recheck proximity after update
      setTimeout(() => {
        if (viewRef.current) {
          checkCaretProximity(viewRef.current);
        }
      }, 0);
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSize = parseInt(inputSize);
    if (!isNaN(newSize) && newSize > 0 && newSize <= 200) {
      updateSize(newSize);
    }
  };

  const handleClick = () => {
    if (editable) {
      setInputSize(size.toString());
      setModalOpen(true);
    }
  };

  return (
    <>
      <ViewCapture checkCaretProximity={checkCaretProximity} />
      <div
        ref={ref}
        className={`w-full relative group select-none ${editable ? "cursor-pointer" : ""}`}
        style={{ height: `${size}px`, minHeight: `${size}px` }}
        contentEditable={false}
        onClick={handleClick}
        {...props}
      >
        {/* Dotted line on hover or when caret is near, invisible spacer when not editable */}
        {editable ? (
          <div
            className={`absolute top-1/2 left-0 right-0 border-t-2 border-dashed transform -translate-y-1/2 transition-colors ${
              isCaretNear ? "border-muted-foreground/30" : "border-transparent group-hover:border-muted-foreground/30"
            }`}
          />
        ) : (
          <div className="w-full h-full" />
        )}

        {/* Label that appears on hover or when caret is near, only when editable */}
        {editable && (
          <div
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-muted-foreground transition-opacity bg-background px-2 py-1 rounded border shadow-sm whitespace-nowrap ${
              isCaretNear ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            Break ({size}px) - Click to edit
          </div>
        )}
      </div>

      {/* Edit Size Modal */}
      {modalOpen && (
        <>
          {ReactDOM.createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200"
              onClick={() => setModalOpen(false)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setModalOpen(false);
                }
              }}
              tabIndex={-1}
            >
              <div
                className="relative bg-background border border-border shadow-2xl rounded-lg min-w-[400px] max-w-[90vw] w-full mx-4 transform transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground">Edit Break Size</h2>
                  <p className="text-sm text-muted-foreground mt-1">Adjust the spacing size in pixels (1-200px).</p>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                  <div className="px-6 py-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="size" className="text-sm font-medium text-foreground">
                        Size (px)
                      </Label>
                      <Input
                        id="size"
                        type="number"
                        min="1"
                        max="200"
                        value={inputSize}
                        onChange={(e) => setInputSize(e.target.value)}
                        className="w-full bg-background border-border focus:border-primary focus:ring-primary/20"
                        placeholder="24"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </form>

                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded hover:cursor-pointer"
                  aria-label="Close modal"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>,
            document.body,
          )}
        </>
      )}
    </>
  );
});

export function addBreakRule(schema: Schema) {
  return new InputRule(/^<break(?:\s+size=(\d+))?\s*\/?>$/, (state, match, start, end) => {
    const size = match[1] ? parseInt(match[1]) : 24;
    const tr = state.tr;

    // Create the break node
    const breakNode = schema.nodes.break.create({ size });

    // Replace the matched text with the break node
    tr.replaceRangeWith(start, end, breakNode);

    // Position cursor after the break node
    const breakEnd = start + breakNode.nodeSize;

    // Check if there's content after the break, if not, insert a paragraph
    const $pos = tr.doc.resolve(breakEnd);
    if (!$pos.nodeAfter) {
      const paragraph = schema.nodes.paragraph.create();
      tr.insert(breakEnd, paragraph);
    }

    // Set selection after the break (or in the new paragraph)
    const newPos = breakEnd + ($pos.nodeAfter ? 0 : 1);
    tr.setSelection(Selection.near(tr.doc.resolve(newPos)));

    return tr;
  });
}

// Component to capture view updates and check caret proximity
function ViewCapture({ checkCaretProximity }: { checkCaretProximity: (view: any) => void }) {
  useEditorEffect(
    (view) => {
      // Check proximity on any state change
      const originalDispatch = view.dispatch;
      view.dispatch = (tr) => {
        originalDispatch.call(view, tr);
        // Check after selection or document changes
        if (tr.selectionSet || tr.docChanged) {
          setTimeout(() => checkCaretProximity(view), 0);
        }
      };

      return () => {
        view.dispatch = originalDispatch;
      };
    },
    [checkCaretProximity],
  );

  return null;
}

export function insertBreak(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    size: 24,
  };

  const breakNode = state.schema.nodes.break.create(attrs);

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(breakNode);

  // Position cursor after the break node
  const insertPos = tr.selection.from;
  const afterPos = insertPos + breakNode.nodeSize;

  // Check if there's content after the break, if not, insert a paragraph
  const $pos = tr.doc.resolve(afterPos);
  if (!$pos.nodeAfter) {
    const paragraph = state.schema.nodes.paragraph.create();
    tr = tr.insert(afterPos, paragraph);
  }

  // Set selection after the break (or in the new paragraph)
  const newPos = afterPos + ($pos.nodeAfter ? 0 : 1);
  tr = tr.setSelection(Selection.near(tr.doc.resolve(newPos)));

  return tr;
}
