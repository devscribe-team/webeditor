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

// Field node spec for parameter documentation
export const fieldNodeSpec: NodeSpec = {
  group: "block",
  content: "block+",
  attrs: {
    name: { default: "" },
    type: { default: "string" },
    required: { default: false },
  },
  selectable: true,
  parseDOM: [
    {
      tag: "field",
      getAttrs: (dom) => ({
        name: dom.getAttribute("name") || "",
        type: dom.getAttribute("type") || "string",
        required: dom.getAttribute("required") === "true",
      }),
    },
  ],
  toDOM: (node) => [
    "field",
    {
      name: node.attrs.name,
      type: node.attrs.type,
      required: node.attrs.required.toString(),
    },
    0,
  ],
};

// Field edit modal component
interface FieldEditModalProps {
  open: boolean;
  initialName: string;
  initialType: string;
  initialRequired: boolean;
  onCloseAction: () => void;
  onSubmitAction: (values: { name: string; type: string; required: boolean }) => void;
  modalTitle?: string;
}

function FieldEditModal({
  open,
  initialName,
  initialType,
  initialRequired,
  onCloseAction,
  onSubmitAction,
  modalTitle = "Edit Parameter Field",
}: FieldEditModalProps) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState(initialType);
  const [required, setRequired] = useState(initialRequired);
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    if (open) {
      setName(initialName);
      setType(initialType);
      setRequired(initialRequired);
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open, initialName, initialType, initialRequired]);

  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmitAction({
        name: name.trim(),
        type: type.trim() || "string",
        required,
      });
    }
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
              <Label htmlFor="field-name" className="text-sm font-medium text-foreground">
                Parameter Name
              </Label>
              <Input
                id="field-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-background border-border focus:border-primary focus:ring-primary/20"
                placeholder="e.g., userId, callback, options"
                autoFocus
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field-type" className="text-sm font-medium text-foreground">
                Type
              </Label>
              <Input
                id="field-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-background border-border focus:border-primary focus:ring-primary/20"
                placeholder="e.g., string, number, boolean, object, array"
                spellCheck={false}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="field-required"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/40 focus:ring-2 hover:cursor-pointer"
              />
              <Label htmlFor="field-required" className="text-sm font-medium text-foreground hover:cursor-pointer">
                Required parameter
              </Label>
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
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
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

// React NodeView for field
export const FieldNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Field(
  { nodeProps, ...props },
  ref,
) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editField, setEditField] = useState<"name" | "type" | null>(null);
  const name = nodeProps.node.attrs.name || "";
  const type = nodeProps.node.attrs.type || "string";
  const required = nodeProps.node.attrs.required ?? false;
  const editable = useEditorEditable();

  const updateField = useEditorEventCallback(
    (
      view,
      { name: newName, type: newType, required: newRequired }: { name: string; type: string; required: boolean },
    ) => {
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
        name: newName,
        type: newType,
        required: newRequired,
      });
      view.dispatch(tr);
      setModalOpen(false);
      setEditField(null);
    }
  );

  return (
    <div ref={ref} className="border border-border bg-card rounded-lg p-4 mb-4">
      <FieldEditModal
        open={modalOpen}
        initialName={name}
        initialType={type}
        initialRequired={required}
        onCloseAction={() => {
          setModalOpen(false);
          setEditField(null);
        }}
        onSubmitAction={updateField}
      />

      <div className="flex flex-col gap-3">
        {/* Parameter header */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <code
              contentEditable={false}
              className={`text-lg font-semibold text-foreground font-mono ${editable ? "cursor-pointer hover:text-primary transition-colors hover:cursor-pointer" : ""}`}
              onClick={(e) => {
                if (!editable) return;
                e.stopPropagation();
                setModalOpen(true);
                setEditField("name");
              }}
              onKeyDown={(e) => {
                if (!editable) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setModalOpen(true);
                  setEditField("name");
                }
              }}
              tabIndex={editable ? 0 : -1}
              aria-disabled={!editable}
            >
              {name || "parameterName"}
            </code>

            <span
              contentEditable={false}
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 font-mono ${editable ? "cursor-pointer hover:bg-primary/20 transition-colors hover:cursor-pointer" : ""}`}
              onClick={(e) => {
                if (!editable) return;
                e.stopPropagation();
                setModalOpen(true);
                setEditField("type");
              }}
              onKeyDown={(e) => {
                if (!editable) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setModalOpen(true);
                  setEditField("type");
                }
              }}
              tabIndex={editable ? 0 : -1}
              aria-disabled={!editable}
            >
              {type}
            </span>

            <span
              contentEditable={false}
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                required
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-muted text-muted-foreground border border-border"
              } ${editable ? "cursor-pointer hover:opacity-80 transition-opacity hover:cursor-pointer" : ""}`}
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
              {required ? "required" : "optional"}
            </span>
          </div>
        </div>

        {/* Parameter description */}
        <div className="prose prose-sm max-w-none text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          <div {...props} />
        </div>
      </div>
    </div>
  );
});

// Input rule for <field name="..." type="..." required />
export const addFieldRule = new InputRule(/^<field(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
  const { tr, schema } = state;
  const attrs = {
    name: "",
    type: "string",
    required: false,
  };

  if (match[1]) {
    const nameMatch = match[1].match(/name="([^"]*)"/);
    if (nameMatch) attrs.name = nameMatch[1];

    const typeMatch = match[1].match(/type="([^"]*)"/);
    if (typeMatch) attrs.type = typeMatch[1];

    attrs.required = /required(?:=true|\s|$)/.test(match[1]);
  }

  const field = schema.nodes.field.create(attrs, schema.nodes.paragraph.create());
  tr.replaceRangeWith(start, end, field);
  const newPos = start + 1;
  tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
  return tr;
});

export function insertField(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    name: "parameterName",
    type: "string",
    required: false,
  };

  const field = state.schema.nodes.field.create(attrs, state.schema.nodes.paragraph.create());

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(field);

  // Position cursor inside the field content
  const insertPos = tr.selection.from;
  const innerPos = insertPos + 1;
  tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));

  return tr;
}
