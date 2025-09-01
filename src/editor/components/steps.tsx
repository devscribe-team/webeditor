"use client";

import { NodeViewComponentProps, useEditorEventCallback, useStopEvent } from "@handlewithcare/react-prosemirror";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec, Node } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useState } from "react";
import { useEditorEditable } from "../editorEditableContext";
import { TitleDescriptionEditModal } from "./modals/TitleDescriptionEditModal";

// Step node spec
export const stepNodeSpec: NodeSpec = {
  group: "block",
  content: "block+",
  attrs: {
    title: { default: "" },
    stepNumber: { default: 1 },
  },
  selectable: true,
  parseDOM: [
    {
      tag: "step",
      getAttrs: (dom) => ({
        title: dom.getAttribute("title") || "",
        stepNumber: parseInt(dom.getAttribute("stepNumber") || "1"),
      }),
    },
  ],
  toDOM: (node) => [
    "step",
    {
      title: node.attrs.title,
      stepNumber: node.attrs.stepNumber.toString(),
    },
    0,
  ],
};

// Step node view
export const StepNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Step(
  { nodeProps, children, ...props },
  ref,
) {
  const [modalOpen, setModalOpen] = useState(false);
  const [numberModalOpen, setNumberModalOpen] = useState(false);
  const title = nodeProps.node.attrs.title || "";
  const stepNumber = nodeProps.node.attrs.stepNumber || 1;
  const editable = useEditorEditable();

  const updateTitle = useEditorEventCallback((view, newTitle: string) => {
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
      title: newTitle,
    });
    view.dispatch(tr);
    setModalOpen(false);
  });

  const createNewStep = useEditorEventCallback((view) => {
    const { getPos } = nodeProps;
    if (typeof getPos !== "function") return;

    const pos = getPos();
    if (typeof pos !== "number") return;

    const tr = view.state.tr;

    // Find the next step number by checking what comes after this step
    const nextStepNumber = stepNumber + 1;
    const insertPos = pos + nodeProps.node.nodeSize;

    // Check if there's already a step after this one and update its number if needed
    const $insertPos = tr.doc.resolve(insertPos);
    if ($insertPos.nodeAfter && $insertPos.nodeAfter.type.name === "step") {
      // There's already a step after, we need to renumber subsequent steps
      const updateStepNumbers = (doc: Node, startPos: number, increment: number) => {
        doc.descendants((node: Node, pos: number) => {
          if (node.type.name === "step" && pos >= startPos) {
            const currentNumber = node.attrs.stepNumber;
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              stepNumber: currentNumber + increment,
            });
          }
        });
      };
      updateStepNumbers(tr.doc, insertPos, 1);
    }

    // Create a new step node
    const newStep = view.state.schema.nodes.step.create(
      { title: "", stepNumber: nextStepNumber },
      view.state.schema.nodes.paragraph.create(),
    );

    // Insert after current step
    tr.insert(insertPos, newStep);

    // Move cursor to the new step
    tr.setSelection(Selection.near(tr.doc.resolve(insertPos + 1)));

    view.dispatch(tr);
    view.focus();
  });

  // Handle Enter key to create new steps
  useStopEvent((view, event) => {
    if (!editable) return false;

    if (event instanceof KeyboardEvent && event.key === "Enter" && !event.shiftKey) {
      const { $head, empty } = view.state.selection;

      // Check if we're at the end of an empty paragraph in this step
      if (empty && $head.parent.type.name === "paragraph" && $head.parent.content.size === 0) {
        event.preventDefault();
        createNewStep();
        return true;
      }
    }

    return false;
  });

  return (
    <div ref={ref} data-step="" className="relative flex gap-4" {...props}>
      <TitleDescriptionEditModal
        open={modalOpen}
        initialTitle={title}
        onCloseAction={() => setModalOpen(false)}
        onSubmitAction={({ title }) => updateTitle(title)}
        titleLabel="Title"
        modalTitle="Edit Step Title"
        showDescription={false}
        titlePlaceholder="Step title"
      />
      <TitleDescriptionEditModal
        open={numberModalOpen}
        initialTitle={stepNumber.toString()}
        onCloseAction={() => setNumberModalOpen(false)}
        onSubmitAction={({ title }) => {
          const newNumber = parseInt(title);
          if (!isNaN(newNumber) && newNumber > 0) {
            updateTitle(newNumber.toString());
          }
        }}
        titleLabel="Step Number"
        modalTitle="Edit Step Number"
        showDescription={false}
        titlePlaceholder="1"
      />
      {/* Step indicator and line */}
      <div contentEditable={false} className="flex flex-col items-center flex-shrink-0">
        <button
          className={`flex h-8 w-8 min-h-[2rem] min-w-[2rem] items-center justify-center rounded-full bg-gray-800 text-sm font-semibold text-white flex-shrink-0 ${
            editable ? "cursor-pointer hover:cursor-pointer hover:bg-gray-700 transition-colors" : ""
          }`}
          onClick={(e) => {
            if (!editable) return;
            e.stopPropagation();
            setNumberModalOpen(true);
          }}
          onKeyDown={(e) => {
            if (!editable) return;
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              setNumberModalOpen(true);
            }
          }}
          tabIndex={editable ? 0 : -1}
          aria-disabled={!editable}
          aria-label={editable ? `Change step number (currently ${stepNumber})` : undefined}
        >
          {stepNumber}
        </button>
        {/* Connecting line */}
        <div className="mt-2 h-full min-h-[3rem] w-px bg-border" />
      </div>
      {/* Step content */}
      <div className="flex-1 pb-4">
        {title && (
          <button
            contentEditable={false}
            className={`mb-3 text-lg font-semibold text-foreground ${editable ? "cursor-pointer hover:cursor-pointer" : ""}`}
            onClick={(e) => {
              if (!editable) return;
              e.stopPropagation();
              setModalOpen(true);
            }}
            tabIndex={editable ? 0 : -1}
            onKeyDown={(e) => {
              if (!editable) return;
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                setModalOpen(true);
              }
            }}
            aria-disabled={!editable}
          >
            {title}
          </button>
        )}
        <div className="text-muted-foreground prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          {children}
        </div>
      </div>
    </div>
  );
});

// Helper function to find the next step number in sequence
const findNextStepNumber = (state: EditorState): number => {
  let maxStepNumber = 0;

  // Look through the document to find the highest step number
  state.doc.descendants((node: Node) => {
    if (node.type.name === "step") {
      const stepNum = node.attrs.stepNumber || 1;
      if (stepNum > maxStepNumber) {
        maxStepNumber = stepNum;
      }
    }
  });

  return maxStepNumber + 1;
};

// Input rule for <Step title="..."/>
export const addStepRule = new InputRule(/^<step(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
  const { tr, schema } = state;
  let title = "";
  let stepNumber = 1;

  if (match[1]) {
    const titleMatch = match[1].match(/title="([^"]*)"/);
    if (titleMatch) title = titleMatch[1];

    const numberMatch = match[1].match(/stepNumber="([^"]*)"/);
    if (numberMatch) {
      stepNumber = parseInt(numberMatch[1]) || 1;
    } else {
      // Auto-assign next step number if not specified
      stepNumber = findNextStepNumber(state);
    }
  } else {
    // Auto-assign next step number if no attributes specified
    stepNumber = findNextStepNumber(state);
  }

  const step = schema.nodes.step.create({ title, stepNumber }, schema.nodes.paragraph.create());
  tr.replaceRangeWith(start, end, step);
  const newPos = start + 1;
  tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
  return tr;
});

export function insertStep(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    title: "Step Title",
    stepNumber: findNextStepNumber(state),
  };

  const step = state.schema.nodes.step.create(attrs, state.schema.nodes.paragraph.create());

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(step);

  // Position cursor inside the step content
  const insertPos = tr.selection.from;
  const innerPos = insertPos + 1;
  tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));

  return tr;
}
