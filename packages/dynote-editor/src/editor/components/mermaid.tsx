"use client";

import { NodeViewComponentProps, useEditorEventCallback } from "@handlewithcare/react-prosemirror";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useEffect, useRef, useState } from "react";
import { useEditorEditable } from "../editorEditableContext";
import mermaid from "mermaid";
import { Edit, Copy, Check, Square, SquareDashed } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ReactDOM from "react-dom";

export const mermaidNodeSpec: NodeSpec = {
  group: "block",
  content: "text*",
  marks: "",
  code: true,
  attrs: {
    code: { default: "graph TD\n    A[Start] --> B[End]" },
    size: { default: "md" },
    showBorder: { default: true },
  },
  selectable: true,

  parseDOM: [
    {
      tag: "mermaid",
      getAttrs: (dom) => ({
        code: dom.textContent || "graph TD\n    A[Start] --> B[End]",
        size: dom.getAttribute("size") || "md",
        showBorder: dom.getAttribute("showBorder") !== "false",
      }),
    },
  ],

  toDOM: (node) => [
    "mermaid",
    {
      class: "mermaid-diagram",
      size: node.attrs.size,
      showBorder: node.attrs.showBorder?.toString(),
    },
    node.attrs.code,
  ],
};

// Initialize mermaid with default config
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "cardinal",
  },
  gantt: {
    useMaxWidth: true,
    fontSize: 11,
  },
  sequence: {
    useMaxWidth: true,
  },
  themeVariables: {
    fontSize: "12px",
    fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
  },
});

interface MermaidEditModalProps {
  open: boolean;
  initialCode: string;
  initialSize?: string;
  onCloseAction: () => void;
  onSubmitAction: (code: string, size?: string) => void;
}

function MermaidEditModal({ open, initialCode, initialSize, onCloseAction, onSubmitAction }: MermaidEditModalProps) {
  const [code, setCode] = useState(initialCode);
  const [size, setSize] = useState(initialSize || "md");
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setCode(initialCode);
    setSize(initialSize || "md");
    setError(null);
  }, [initialCode, initialSize, open]);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isVisible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate mermaid syntax
    try {
      await mermaid.parse(code);
      setError(null);
      onSubmitAction(code, size);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid mermaid syntax");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
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
        className={`relative bg-background border border-border shadow-2xl rounded-lg min-w-[500px] max-w-[90vw] w-full mx-4 transform transition-all duration-200 ${
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Edit Mermaid Diagram</h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mermaid-code" className="text-sm font-medium text-foreground">
                Mermaid Code
              </Label>
              <Textarea
                id="mermaid-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[200px] font-mono text-sm w-full bg-background border-border focus:border-primary focus:ring-primary/20"
                placeholder="Enter your mermaid diagram code..."
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagram-size" className="text-sm font-medium text-foreground">
                Diagram Size
              </Label>
              <select
                id="diagram-size"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background hover:cursor-pointer"
              >
                <option value="sm">Small (300px max width)</option>
                <option value="md">Medium (500px max width)</option>
                <option value="lg">Large (700px max width)</option>
                <option value="xl">Extra Large (900px max width)</option>
                <option value="full">Full Width</option>
              </select>
            </div>
            {error && <div className="text-destructive text-sm bg-destructive/10 p-2 rounded border">{error}</div>}
            <div className="text-xs text-muted-foreground">
              Learn more about mermaid syntax at{" "}
              <a
                href="https://mermaid.js.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground hover:cursor-pointer"
              >
                mermaid.js.org
              </a>
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

// Utility for diagram size classes
function getDiagramSizeStyles(size: string) {
  switch (size) {
    case "sm":
      return { maxWidth: "300px", maxHeight: "200px" };
    case "md":
      return { maxWidth: "500px", maxHeight: "300px" };
    case "lg":
      return { maxWidth: "700px", maxHeight: "400px" };
    case "xl":
      return { maxWidth: "900px", maxHeight: "500px" };
    case "full":
      return { maxWidth: "100%", maxHeight: "600px" };
    default:
      return { maxWidth: "500px", maxHeight: "300px" };
  }
}

export const MermaidNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Mermaid(
  { nodeProps, ...props },
  ref,
) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);
  const code = nodeProps.node.attrs.code || "graph TD\n    A[Start] --> B[End]";
  const size = nodeProps.node.attrs.size || "md";
  const showBorder = nodeProps.node.attrs.showBorder ?? true;
  const editable = useEditorEditable();

  const updateCode = useEditorEventCallback((view, newCode: string, newSize?: string) => {
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
      code: newCode,
      ...(newSize && { size: newSize }),
    });

    // Also update the text content
    const textNode = view.state.schema.text(newCode);
    tr.replaceWith(pos + 1, pos + 1 + node.content.size, textNode);

    // Ensure there's always a paragraph after the mermaid node
    const newNode = tr.doc.nodeAt(pos);
    if (newNode) {
      const afterPos = pos + newNode.nodeSize;
      const isLastNode = afterPos >= tr.doc.content.size;
      const nextNode = !isLastNode ? tr.doc.nodeAt(afterPos) : null;

      if (isLastNode || (nextNode && nextNode.type.name !== "paragraph")) {
        const emptyParagraph = view.state.schema.nodes.paragraph.create();
        tr.insert(afterPos, emptyParagraph);
      }
    }

    view.dispatch(tr);
    setModalOpen(false);
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  const handleEdit = () => {
    if (!editable) return;
    setModalOpen(true);
  };

  const toggleBorder = useEditorEventCallback((view) => {
    const { getPos, node } = nodeProps;
    if (typeof getPos !== "function") return;
    const pos = getPos();
    if (typeof pos !== "number") return;

    const tr = view.state.tr;
    tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      showBorder: !showBorder,
    });
    view.dispatch(tr);
  });

  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagramRef.current) return;

      try {
        setError(null);

        // Clear previous content
        diagramRef.current.innerHTML = "";

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        // Parse and render the diagram
        const { svg } = await mermaid.render(id, code);
        diagramRef.current.innerHTML = svg;

        // Style the SVG
        const svgElement = diagramRef.current.querySelector("svg");
        if (svgElement) {
          // Remove any existing width/height attributes that might override our styles
          svgElement.removeAttribute("width");
          svgElement.removeAttribute("height");

          // Get size styles for current size setting
          const sizeStyles = getDiagramSizeStyles(size);

          // Set responsive sizing
          svgElement.style.maxWidth = "100%";
          svgElement.style.maxHeight = sizeStyles.maxHeight;
          svgElement.style.width = "100%";
          svgElement.style.height = "auto";
          svgElement.style.display = "block";

          // Ensure proper scaling
          const viewBox = svgElement.getAttribute("viewBox");
          if (viewBox) {
            svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid mermaid syntax");
        if (diagramRef.current) {
          diagramRef.current.innerHTML = `
            <div class="p-4 text-center text-destructive bg-destructive/10 rounded border" role="alert">
              <p class="font-medium">Error rendering diagram</p>
              <p class="text-sm mt-1">${err instanceof Error ? err.message : "Invalid mermaid syntax"}</p>
            </div>
          `;
        }
      }
    };

    renderDiagram();
  }, [code, error, size]);

  return (
    <div
      ref={ref}
      className={`relative ${showBorder ? "border border-border" : ""} bg-card rounded-lg overflow-hidden mb-2`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <MermaidEditModal
        open={modalOpen}
        initialCode={code}
        initialSize={size}
        onCloseAction={() => setModalOpen(false)}
        onSubmitAction={updateCode}
      />

      {/* Toolbar */}
      {editable && (
        <div
          className={`absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
          } z-10 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg border border-border`}
        >
          <button
            onClick={handleEdit}
            className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 rounded px-2 py-1 transition-colors text-xs font-medium hover:cursor-pointer"
            title="Edit diagram"
            contentEditable={false}
          >
            <Edit className="w-3 h-3" />
            Edit
          </button>
          <button
            onClick={toggleBorder}
            className="flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded px-2 py-1 transition-colors text-xs font-medium hover:cursor-pointer"
            title={showBorder ? "Hide border" : "Show border"}
            contentEditable={false}
          >
            {showBorder ? <Square className="w-3 h-3" /> : <SquareDashed className="w-3 h-3" />}
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded px-2 py-1 transition-colors text-xs font-medium hover:cursor-pointer"
            title="Copy code"
            contentEditable={false}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {/* Diagram container */}
      <div className="p-4">
        <div
          ref={diagramRef}
          className="flex justify-center items-center min-h-[100px] w-full"
          contentEditable={false}
          style={{
            ...getDiagramSizeStyles(size),
            overflow: "auto",
            margin: "0 auto",
          }}
          role="img"
          aria-label="Mermaid diagram"
        />
      </div>
    </div>
  );
});

export const addMermaidRule = new InputRule(/^<mermaid(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
  const { tr, schema } = state;
  let code = "graph TD\n    A[Start] --> B[End]";

  if (match[1]) {
    const codeMatch = match[1].match(/code="([^"]*)"/);
    if (codeMatch) {
      code = codeMatch[1].replace(/\\n/g, "\n");
    }
  }

  const mermaidNode = schema.nodes.mermaid.create({ code }, schema.text(code));

  // Insert mermaid node and ensure there's a paragraph after it
  tr.replaceRangeWith(start, end, mermaidNode);

  // Check if there's content after the mermaid node (recalculate after insertion)
  const insertedNode = tr.doc.nodeAt(start);
  if (insertedNode) {
    const afterPos = start + insertedNode.nodeSize;
    const isLastNode = afterPos >= tr.doc.content.size;
    const nextNode = !isLastNode ? tr.doc.nodeAt(afterPos) : null;

    // If this is the last node or the next node isn't a paragraph, insert one
    if (isLastNode || (nextNode && nextNode.type.name !== "paragraph")) {
      const emptyParagraph = schema.nodes.paragraph.create();
      tr.insert(afterPos, emptyParagraph);
    }
  }

  const newPos = start + 1;
  tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
  return tr;
});

export function insertMermaid(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    code: "graph TD\n    A[Start] --> B[End]",
    size: "md",
    showBorder: true,
  };

  const mermaidNode = state.schema.nodes.mermaid.create(attrs, state.schema.text(attrs.code));

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(mermaidNode);

  // Get the actual position where the node was inserted
  const insertPos = from;
  const insertedNode = tr.doc.nodeAt(insertPos);

  if (insertedNode) {
    const afterPos = insertPos + insertedNode.nodeSize;
    const isLastNode = afterPos >= tr.doc.content.size;
    const nextNode = !isLastNode ? tr.doc.nodeAt(afterPos) : null;

    // If this is the last node or the next node isn't a paragraph, insert one
    if (isLastNode || (nextNode && nextNode.type.name !== "paragraph")) {
      const emptyParagraph = state.schema.nodes.paragraph.create();
      tr = tr.insert(afterPos, emptyParagraph);

      // Position cursor in the newly inserted paragraph
      const paragraphPos = afterPos + 1;
      tr = tr.setSelection(Selection.near(tr.doc.resolve(paragraphPos)));
    } else {
      // Position cursor after the mermaid node
      tr = tr.setSelection(Selection.near(tr.doc.resolve(afterPos)));
    }
  }

  return tr;
}
