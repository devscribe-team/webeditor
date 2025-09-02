"use client";

import { NodeViewComponentProps, useEditorEventCallback } from "@handlewithcare/react-prosemirror";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useState } from "react";
import { useEditorEditable } from "../editorEditableContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactDOM from "react-dom";

// Frame node spec for ProseMirror
export const frameNodeSpec: NodeSpec = {
  group: "block",
  content: "block+",
  attrs: {
    caption: { default: "" },
    padding: { default: "md" },
  },
  selectable: true,
  parseDOM: [
    {
      tag: "frame",
      getAttrs: (dom) => ({
        caption: dom.getAttribute("caption") || "",
        padding: dom.getAttribute("padding") || "md",
      }),
    },
  ],
  toDOM: (node) => [
    "frame",
    {
      caption: node.attrs.caption,
      padding: node.attrs.padding,
    },
    0,
  ],
};

// Frame edit modal component
interface FrameEditModalProps {
  open: boolean;
  initialCaption: string;
  initialPadding: string;
  onCloseAction: () => void;
  onSubmitAction: (values: { caption: string; padding: string }) => void;
  modalTitle?: string;
}

function FrameEditModal({
  open,
  initialCaption,
  initialPadding,
  onCloseAction,
  onSubmitAction,
  modalTitle = "Edit Frame",
}: FrameEditModalProps) {
  const [caption, setCaption] = useState(initialCaption);
  const [padding, setPadding] = useState(initialPadding);
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    if (open) {
      setCaption(initialCaption);
      setPadding(initialPadding);
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open, initialCaption, initialPadding]);

  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAction({
      caption: caption.trim(),
      padding,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCloseAction();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCloseAction();
    }
  };

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
        open ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className={`relative bg-background border border-border shadow-2xl rounded-lg min-w-[400px] max-w-[90vw] w-full mx-4 transform transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">{modalTitle}</h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frame-caption" className="text-sm font-medium text-foreground">
                Caption (optional)
              </Label>
              <Input
                id="frame-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-background border-border focus:border-primary focus:ring-primary/20"
                placeholder="Add a caption for this frame"
                autoFocus
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frame-padding" className="text-sm font-medium text-foreground">
                Padding Size
              </Label>
              <select
                id="frame-padding"
                value={padding}
                onChange={(e) => setPadding(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background hover:cursor-pointer"
              >
                <option value="sm">Small (0.5rem)</option>
                <option value="md">Medium (1rem)</option>
                <option value="lg">Large (1.5rem)</option>
                <option value="xl">Extra Large (2rem)</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onCloseAction}
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
          onClick={onCloseAction}
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
  );
}

// Utility for frame padding classes
function getPaddingClass(padding: string) {
  switch (padding) {
    case "sm":
      return "p-2";
    case "md":
      return "p-4";
    case "lg":
      return "p-6";
    case "xl":
      return "p-8";
    default:
      return "p-4";
  }
}

// React NodeView for frame
export const FrameNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Frame(
  { nodeProps, ...props },
  ref,
) {
  const [modalOpen, setModalOpen] = useState(false);
  const caption = nodeProps.node.attrs.caption || "";
  const padding = nodeProps.node.attrs.padding || "md";
  const editable = useEditorEditable();

  const updateFrame = useEditorEventCallback(
    (view, { caption: newCaption, padding: newPadding }: { caption: string; padding: string }) => {
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
        caption: newCaption,
        padding: newPadding,
      });
      view.dispatch(tr);
      setModalOpen(false);
    },
  );

  return (
    <div ref={ref} className="mb-4">
      <FrameEditModal
        open={modalOpen}
        initialCaption={caption}
        initialPadding={padding}
        onCloseAction={() => setModalOpen(false)}
        onSubmitAction={updateFrame}
      />

      <div
        className={`border border-border rounded-lg ${getPaddingClass(padding)} relative ${
          editable ? "hover:border-primary/50 transition-colors" : ""
        }`}
      >
        {/* Clickable border areas */}
        {editable && (
          <>
            {/* Top border */}
            <div
              className="absolute top-0 left-0 right-0 h-2 cursor-pointer z-10"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              aria-label="Click to edit frame settings"
            />
            {/* Bottom border */}
            <div
              className="absolute bottom-0 left-0 right-0 h-2 cursor-pointer z-10"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              aria-label="Click to edit frame settings"
            />
            {/* Left border */}
            <div
              className="absolute top-0 bottom-0 left-0 w-2 cursor-pointer z-10"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              aria-label="Click to edit frame settings"
            />
            {/* Right border */}
            <div
              className="absolute top-0 bottom-0 right-0 w-2 cursor-pointer z-10"
              onClick={(e) => {
                e.stopPropagation();
                setModalOpen(true);
              }}
              aria-label="Click to edit frame settings"
            />
          </>
        )}

        <div className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 relative z-0">
          <div {...props} />
        </div>
      </div>

      {caption && (
        <div className="mt-2 text-center">
          <span
            contentEditable={false}
            className={`text-sm text-muted-foreground italic ${
              editable ? "cursor-pointer hover:text-foreground transition-colors hover:cursor-pointer" : ""
            }`}
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
          >
            {caption}
          </span>
        </div>
      )}
    </div>
  );
});

// Input rule for <frame caption="..." padding="..."/>
export const addFrameRule = new InputRule(/^<frame(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
  const { tr, schema } = state;
  const attrs = {
    caption: "",
    padding: "md",
  };

  if (match[1]) {
    const captionMatch = match[1].match(/caption="([^"]*)"/);
    if (captionMatch) attrs.caption = captionMatch[1];

    const paddingMatch = match[1].match(/padding="([^"]*)"/);
    if (paddingMatch) attrs.padding = paddingMatch[1];
  }

  const frame = schema.nodes.frame.create(attrs, schema.nodes.paragraph.create());
  tr.replaceRangeWith(start, end, frame);
  const newPos = start + 1;
  tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
  return tr;
});

export function insertFrame(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    caption: "",
    padding: "md",
  };

  const frame = state.schema.nodes.frame.create(attrs, state.schema.nodes.paragraph.create());

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(frame);

  // Position cursor inside the frame content
  const insertPos = tr.selection.from;
  const innerPos = insertPos + 1;
  tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));

  return tr;
}
