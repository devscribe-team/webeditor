"use client";

import { NodeViewComponentProps } from "@handlewithcare/react-prosemirror";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useState } from "react";
import { useEditorEditable } from "../editorEditableContext";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import ReactDOM from "react-dom";
import { useEditorEventCallback } from "@handlewithcare/react-prosemirror";
import { ChevronDown } from "lucide-react";
import { resolveIcon } from "@/components/tags/icons";

// Node spec for accordion
export const accordionNodeSpec: NodeSpec = {
  group: "block",
  content: "block+",
  attrs: {
    title: { default: "" },
    description: { default: "" },
    icon: { default: null },
    showIcon: { default: true },
    defaultOpen: { default: false },
  },
  selectable: true,
  parseDOM: [
    {
      tag: "accordion",
      getAttrs: (dom) => ({
        title: dom.getAttribute("title") || "",
        description: dom.getAttribute("description") || "",
        icon: dom.getAttribute("icon") || null,
        showIcon: dom.getAttribute("show-icon") !== "false",
        defaultOpen: dom.getAttribute("default-open") === "true",
      }),
    },
  ],
  toDOM: (node) => [
    "accordion",
    {
      title: node.attrs.title,
      description: node.attrs.description,
      icon: node.attrs.icon,
      "show-icon": node.attrs.showIcon?.toString(),
      "default-open": node.attrs.defaultOpen?.toString(),
    },
    0,
  ],
};

/**
 * Reusable modal for editing title and description
 */
// TODO: commented out for now bc new editor implementation is not done
// import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Separator } from "@/components/ui/separator";

import { TitleDescriptionEditModal } from "./modals/TitleDescriptionEditModal";

// Node view
export const AccordionNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Accordion(
  { nodeProps, ...props },
  ref,
) {
  const [isOpen, setIsOpen] = useState(nodeProps.node.attrs.defaultOpen ?? false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editField, setEditField] = useState<"title" | "description" | null>(null);
  const title = nodeProps.node.attrs.title || "";
  const description = nodeProps.node.attrs.description || "";
  const icon = nodeProps.node.attrs.icon;
  const showIcon = nodeProps.node.attrs.showIcon ?? true;
  const iconElement = resolveIcon?.(icon, { size: "w-5 h-5", showIcon });

  const editable = useEditorEditable();

  // Separate update callbacks for title and description
  const updateTitle = useEditorEventCallback(
    (view, newTitle: string) => {
      const { getPos, node } = nodeProps;
      if (typeof getPos !== "function") {
        // eslint-disable-next-line no-console
        console.error("getPos is not a function");
        return;
      }
      const pos = getPos();
      if (typeof pos !== "number") {
        // eslint-disable-next-line no-console
        console.error("getPos did not return a number");
        return;
      }
      const tr = view.state.tr;
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        title: newTitle,
      });
      view.dispatch(tr);
      setModalOpen(false);
      setEditField(null);
    },
    // @ts-expect-error nodeProps is unknown
    [nodeProps],
  );

  const updateDescription = useEditorEventCallback(
    (view, newDescription: string) => {
      const { getPos, node } = nodeProps;
      if (typeof getPos !== "function") {
        // eslint-disable-next-line no-console
        console.error("getPos is not a function");
        return;
      }
      const pos = getPos();
      if (typeof pos !== "number") {
        // eslint-disable-next-line no-console
        console.error("getPos did not return a number");
        return;
      }
      const tr = view.state.tr;
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        description: newDescription,
      });
      view.dispatch(tr);
      setModalOpen(false);
      setEditField(null);
    },
    // @ts-expect-error nodeProps is unknown
    [nodeProps],
  );

  return (
    <div ref={ref} className="border border-border bg-card shadow-sm rounded-lg mb-2">
      <TitleDescriptionEditModal
        open={modalOpen && editField === "title"}
        initialTitle={title}
        onCloseAction={() => {
          setModalOpen(false);
          setEditField(null);
        }}
        onSubmitAction={({ title }) => updateTitle(title)}
        titleLabel="Title"
        modalTitle="Edit Accordion Title"
        showDescription={false}
        titlePlaceholder="Accordion title"
      />
      <TitleDescriptionEditModal
        open={modalOpen && editField === "description"}
        initialTitle={description}
        onCloseAction={() => {
          setModalOpen(false);
          setEditField(null);
        }}
        onSubmitAction={({ title }) => updateDescription(title)}
        titleLabel="Description"
        modalTitle="Edit Accordion Description"
        showDescription={false}
        titlePlaceholder="Accordion description"
      />
      <button
        // @ts-expect-error open is unknown
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full px-4 py-4 text-left flex items-center justify-between hover:bg-accent transition-colors hover:cursor-pointer ${isOpen ? "rounded-t-lg" : "rounded-lg"}`}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${title.replace(/\s+/g, "-").toLowerCase()}`}
        type="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-3">
          {iconElement && <div className="flex-shrink-0">{iconElement}</div>}
          <div className="flex-1">
            <h3
              contentEditable={false}
              className={`text-lg font-semibold text-foreground ${editable ? "cursor-pointer hover:cursor-pointer" : ""}`}
              onClick={(e) => {
                if (!editable) return;
                e.stopPropagation();
                setModalOpen(true);
                setEditField("title");
              }}
              tabIndex={editable ? 0 : -1}
              onKeyDown={(e) => {
                if (!editable) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setModalOpen(true);
                  setEditField("title");
                }
              }}
              aria-disabled={!editable}
            >
              {title}
            </h3>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div
          id={`accordion-content-${title.replace(/\s+/g, "-").toLowerCase()}`}
          className="px-4 pb-4 border-t border-border"
        >
          {description && (
            <p
              contentEditable={false}
              className={`text-sm text-muted-foreground pt-4 pb-2 ${editable ? "cursor-pointer hover:cursor-pointer underline decoration-dotted underline-offset-2" : ""}`}
              tabIndex={editable ? 0 : -1}
              onClick={(e) => {
                if (!editable) return;
                e.stopPropagation();
                setModalOpen(true);
                setEditField("description");
              }}
              onKeyDown={(e) => {
                if (!editable) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setModalOpen(true);
                  setEditField("description");
                }
              }}
              aria-disabled={!editable}
            >
              {description}
            </p>
          )}
          <div className="pt-2 prose prose-sm max-w-none text-foreground">
            <div {...props} />
          </div>
        </div>
      )}
    </div>
  );
});

// Input rule for <Accordion ... />
export const addAccordionRule = new InputRule(
  /^<accordion(?:\s+([^>]+))?(?:\s*\/>|\s*>)/,
  (state, match, start, end) => {
    const { tr, schema } = state;
    const attrs = {
      title: "",
      description: "",
      icon: null,
      showIcon: true,
      defaultOpen: false,
    };
    if (match[1]) {
      const titleMatch = match[1].match(/title="([^"]*)"/);
      if (titleMatch) attrs.title = titleMatch[1];
      const descMatch = match[1].match(/description="([^"]*)"/);
      if (descMatch) attrs.description = descMatch[1];
      const iconMatch = match[1].match(/icon="([^"]*)"/);
      // @ts-expect-error attrs.icon is unknown
      if (iconMatch) attrs.icon = iconMatch[1];
      attrs.showIcon = !/showIcon=false/.test(match[1]);
      attrs.defaultOpen = /defaultOpen(?:=true|\s|$)/.test(match[1]);
    }
    const accordion = schema.nodes.accordion.create(attrs, schema.nodes.paragraph.create());
    tr.replaceRangeWith(start, end, accordion);
    const newPos = start + 1;
    // @ts-expect-error tr.selection.constructor.near is unknown
    tr.setSelection(tr.selection.constructor.near(tr.doc.resolve(newPos)));
    return tr;
  },
);

export function insertAccordion(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    title: "Accordion Title",
    description: "",
    icon: null,
    showIcon: true,
    defaultOpen: false,
  };

  const accordion = state.schema.nodes.accordion.create(attrs, state.schema.nodes.paragraph.create());

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(accordion);

  // Position cursor inside the accordion content
  const insertPos = tr.selection.from;
  const innerPos = insertPos + 1;
  tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));

  return tr;
}
