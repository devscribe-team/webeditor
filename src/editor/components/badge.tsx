import { NodeViewComponentProps, useEditorEventCallback } from "@handlewithcare/react-prosemirror";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useState, useEffect } from "react";
import { useEditorEditable } from "../editorEditableContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReactDOM from "react-dom";

// Badge node spec for ProseMirror
export const badgeNodeSpec: NodeSpec = {
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  attrs: {
    variant: { default: "default" },
    label: { default: "" },
  },
  parseDOM: [
    {
      tag: "badge",
      getAttrs: (dom) => ({
        variant: dom.getAttribute("variant") || "default",
        label: dom.textContent || "",
      }),
    },
  ],
  toDOM: (node) => [
    "badge",
    {
      variant: node.attrs.variant,
      class: badgeClassName(node.attrs.variant),
    },
    node.attrs.label,
  ],
};

// Badge edit modal component
interface BadgeEditModalProps {
  open: boolean;
  initialLabel: string;
  initialVariant: string;
  onCloseAction: () => void;
  onSubmitAction: (values: { label: string; variant: string }) => void;
  modalTitle?: string;
}

function BadgeEditModal({
  open,
  initialLabel,
  initialVariant,
  onCloseAction,
  onSubmitAction,
  modalTitle = "Edit Badge",
}: BadgeEditModalProps) {
  const [label, setLabel] = useState(initialLabel);
  const [variant, setVariant] = useState(initialVariant);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setLabel(initialLabel);
      setVariant(initialVariant);
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open, initialLabel, initialVariant]);

  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitAction({
      label: label.trim(),
      variant,
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

  const variantOptions = [
    { value: "default", label: "Default (Primary)", color: "bg-primary text-primary-foreground" },
    { value: "secondary", label: "Secondary", color: "bg-secondary text-secondary-foreground" },
    { value: "destructive", label: "Destructive", color: "bg-destructive text-white" },
    { value: "outline", label: "Outline", color: "border text-foreground bg-background" },
  ];

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
              <Label htmlFor="badge-label" className="text-sm font-medium text-foreground">
                Badge Text
              </Label>
              <Input
                id="badge-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-background border-border focus:border-primary focus:ring-primary/20"
                placeholder="Enter badge text"
                autoFocus
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badge-variant" className="text-sm font-medium text-foreground">
                Badge Style
              </Label>
              <div className="space-y-2">
                {variantOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-2 rounded-md border border-border hover:bg-accent hover:cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="variant"
                      value={option.value}
                      checked={variant === option.value}
                      onChange={(e) => setVariant(e.target.value)}
                      className="text-primary focus:ring-primary hover:cursor-pointer"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span
                        className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium ${option.color} ${
                          option.value === "outline" ? "border" : "border border-transparent"
                        }`}
                      >
                        {label || "Preview"}
                      </span>
                      <span className="text-sm text-muted-foreground">{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>
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

// Utility for badge styling based on variant
function badgeClassName(variant: string) {
  // Tailwind classes matching the original badge.tsx variants
  switch (variant) {
    case "secondary":
      return "inline-flex items-center justify-center rounded-md border border-transparent bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden";
    case "destructive":
      return "inline-flex items-center justify-center rounded-md border border-transparent bg-destructive text-white px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden";
    case "outline":
      return "inline-flex items-center justify-center rounded-md border text-foreground px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden";
    case "default":
    default:
      return "inline-flex items-center justify-center rounded-md border border-transparent bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden";
  }
}

// React NodeView for badge
export const BadgeNodeView = React.forwardRef<HTMLSpanElement, NodeViewComponentProps>(function Badge(
  { nodeProps },
  ref,
) {
  const [modalOpen, setModalOpen] = useState(false);
  const variant = nodeProps.node.attrs.variant || "default";
  const label = nodeProps.node.attrs.label || "";
  const editable = useEditorEditable();

  const updateBadge = useEditorEventCallback(
    (view, { label: newLabel, variant: newVariant }: { label: string; variant: string }) => {
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
        label: newLabel,
        variant: newVariant,
      });
      view.dispatch(tr);
      setModalOpen(false);
    },
  );

  return (
    <>
      <BadgeEditModal
        open={modalOpen}
        initialLabel={label}
        initialVariant={variant}
        onCloseAction={() => setModalOpen(false)}
        onSubmitAction={updateBadge}
      />
      <span
        data-badge=""
        data-variant={variant}
        className={`${badgeClassName(variant)} ${
          editable ? "cursor-pointer hover:cursor-pointer hover:opacity-80 transition-opacity" : ""
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
        aria-label={editable ? `Edit badge (currently "${label}")` : undefined}
        title={editable ? `Click to edit badge` : undefined}
      >
        {label || "Badge"}
      </span>
    </>
  );
});

// Input rule for <Badge variant="..." label="..."/>
export const addBadgeRule = new InputRule(/^<badge(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
  const { tr, schema } = state;
  const attrs = {
    variant: "default",
    label: "",
  };

  if (match[1]) {
    const variantMatch = match[1].match(/variant="([^"]*)"/);
    if (variantMatch) attrs.variant = variantMatch[1];

    const labelMatch = match[1].match(/label="([^"]*)"/);
    if (labelMatch) attrs.label = labelMatch[1];
  }

  if (!schema.nodes.badge) return null;

  const badgeNode = schema.nodes.badge.create(attrs);

  tr.replaceRangeWith(start, end, badgeNode);

  // Place selection after the badge
  tr.setSelection(Selection.near(tr.doc.resolve(start + badgeNode.nodeSize)));

  return tr;
});

export function insertBadge(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    variant: "default",
    label: "New Badge",
  };

  const badgeNode = state.schema.nodes.badge.create(attrs);

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(badgeNode);

  // Place selection after the badge
  tr = tr.setSelection(Selection.near(tr.doc.resolve(tr.selection.from + badgeNode.nodeSize)));

  return tr;
}
