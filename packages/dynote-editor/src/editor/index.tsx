import { ProseMirror, ProseMirrorDoc, reactKeys, useEditorEffect } from "@handlewithcare/react-prosemirror";
import { baseKeymap } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { DOMParser, DOMSerializer, Fragment, Node } from "prosemirror-model";
import { EditorState, Plugin, Selection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccordionNodeView, insertAccordion } from "./components/accordion";
import { BadgeNodeView, insertBadge } from "./components/badge";
import { BreakNodeView, insertBreak } from "./components/break";
import { CalloutNodeView, insertCallout } from "./components/callout";
import { CardNodeView, insertCard } from "./components/card";
import { CodeSnippetNodeView, insertCodeSnippet } from "./components/code-snippet";
import { ColumnNodeView, ColumnsNodeView, insertColumns } from "./components/columns";
import { FieldNodeView, insertField } from "./components/field";
import { FooNodeView, insertFoo } from "./components/foo";
import { FrameNodeView, insertFrame } from "./components/frame";
import { IconNodeView, insertIcon } from "./components/icon";
import { insertMermaid, MermaidNodeView } from "./components/mermaid";
import { TooltipPromptModal } from "./components/modals/TooltipPromptModal";
import { insertStep, StepNodeView } from "./components/steps";
import { insertTabs, TabsNodeView } from "./components/tabs";
import { EditorEditableProvider } from "./editorEditableContext";
import { keymapPlugin } from "./keymap";
import { inputPlugin } from "./markdown";
import { schema } from "./schema";
import { type AttributePromptConfig, AttributePromptDialog } from "./utils/attribute-prompts";
import { type Command, commandMenuSetup, isComponentCommand } from "./utils/command-system";
import {
    executeTooltipMark,
    hasTextSelection,
    isSimpleMarkCommand,
    isTooltipMarkCommand,
    type MarkCommand,
    marksMenuSetup,
} from "./utils/marks-system";
import { createTooltipClickPlugin, removeTooltipMark, updateTooltipMark } from "./utils/tooltip-click-plugin";
import "./index.css";
import { preprocessMarkdownToHTML } from "./preprocessMarkdown";

function proseMirrorToHTML(doc: Node) {
  const serializer = DOMSerializer.fromSchema(schema);
  const domNode = serializer.serializeFragment(doc.content);

  const container = document.createElement("div");
  container.appendChild(domNode);

  return container.innerHTML;
}

function htmlToProseMirror(html: string) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  // Use ProseMirror's DOMParser to convert back
  const parser = DOMParser.fromSchema(schema);
  const fragment = parser.parseSlice(tempDiv).content;

  return fragment;
}

function mdxLikeToProseMirror(markdown: string) {
  const html = preprocessMarkdownToHTML(markdown);
  return htmlToProseMirror(html);
}

export function DynoteEditor(props: { value?: string; editable?: boolean; onChange?: (doc: string) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const marksDialogRef = useRef<HTMLDialogElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const [dialogPosition, setDialogPosition] = useState({ top: 0, left: 0 });
  const [marksDialogPosition, setMarksDialogPosition] = useState({ top: 0, left: 0 });

  // Command menu search query
  const [commandMenuQuery, setCommandMenuQuery] = useState("");
  const [marksMenuQuery, setMarksMenuQuery] = useState("");

  // Menu type state
  const [currentMenuType, setCurrentMenuType] = useState<"commands" | "marks">("commands");

  // Dialog menu dimensions for clamping
  const DIALOG_WIDTH = 400;
  const DIALOG_HEIGHT = 400;
  function clampDialogPosition(top: number, left: number) {
    const padding = 16;
    const maxTop = window.innerHeight - DIALOG_HEIGHT - padding;
    const maxLeft = window.innerWidth - DIALOG_WIDTH - padding;
    return {
      top: Math.max(padding, Math.min(top, maxTop)),
      left: Math.max(padding, Math.min(left, maxLeft)),
    };
  }
  const [dialogSelectedIdx, setDialogSelectedIdx] = useState(0);

  // Memoized filtered commands for consistent reference
  const filteredCommands = useMemo(
    () =>
      commandMenuSetup.filter((command) => {
        // Hide separators when searching
        if ("separator" in command && commandMenuQuery) return false;
        if (!commandMenuQuery) return true;
        const q = commandMenuQuery.toLowerCase();
        // @ts-expect-error command is unknown
        return command.name.toLowerCase().includes(q) || command.description?.toLowerCase().includes(q);
      }),
    [commandMenuQuery],
  );

  // Memoized filtered marks for consistent reference
  const filteredMarks = useMemo(
    () =>
      marksMenuSetup.filter((command) => {
        // Hide separators when searching
        if ("separator" in command && marksMenuQuery) return false;
        if (!marksMenuQuery) return true;
        const q = marksMenuQuery.toLowerCase();
        // @ts-expect-error command is unknown
        return command.name.toLowerCase().includes(q) || command.description?.toLowerCase().includes(q);
      }),
    [marksMenuQuery],
  );

  // Always reset selection to first non-separator on query change
  useEffect(() => {
    const items = currentMenuType === "commands" ? filteredCommands : filteredMarks;
    const firstIdx = items.findIndex((cmd) => !("separator" in cmd));
    setDialogSelectedIdx(firstIdx === -1 ? 0 : firstIdx);
  }, [commandMenuQuery, marksMenuQuery, filteredCommands, filteredMarks, currentMenuType]);

  // Clamp selection to first non-separator if filtered list shrinks or changes
  useEffect(() => {
    const items = currentMenuType === "commands" ? filteredCommands : filteredMarks;
    if (dialogSelectedIdx > items.length - 1 || (items[dialogSelectedIdx] && "separator" in items[dialogSelectedIdx])) {
      const firstIdx = items.findIndex((cmd) => !("separator" in cmd));
      setDialogSelectedIdx(firstIdx === -1 ? 0 : firstIdx);
    }
  }, [filteredCommands, filteredMarks, dialogSelectedIdx, currentMenuType]);

  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [showCommandHint, setShowCommandHint] = useState(false);
  const [hintPosition, setHintPosition] = useState({ top: 0, left: 0 });

  const [attributePromptOpen, setAttributePromptOpen] = useState(false);
  const [attributePromptConfig, setAttributePromptConfig] = useState<AttributePromptConfig | null>(null);
  const [attributePromptValues, setAttributePromptValues] = useState<Record<string, any>>({});
  const [attributePromptErrors, setAttributePromptErrors] = useState<Record<string, string>>({});
  const [pendingAttributeCommand, setPendingAttributeCommand] = useState<Command | null>(null);

  // Tooltip prompt state
  const [tooltipPromptOpen, setTooltipPromptOpen] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  const [isEditingTooltip, setIsEditingTooltip] = useState(false);
  const [tooltipEditRange, setTooltipEditRange] = useState<{ from: number; to: number } | null>(null);

  // Ref for the editor container (no longer needed for hint position)
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to check if command hint should be shown
  const checkCommandHint = useCallback(
    (view: EditorView) => {
      const { $head, empty } = view.state.selection;

      if (empty && $head.parent.type.name === "paragraph") {
        const isEmptyParagraph = $head.parent.content.size === 0;

        if (isEmptyParagraph) {
          try {
            const coords = view.coordsAtPos($head.pos);
            const containerRect = containerRef.current?.getBoundingClientRect();

            if (!containerRect) {
              setShowCommandHint(false);
              return;
            }

            // Calculate position relative to the container using actual cursor coordinates
            const relativeTop = coords.bottom - containerRect.top - 25;
            const relativeLeft = coords.left - containerRect.left + 4;

            setHintPosition({
              top: relativeTop,
              left: relativeLeft,
            });
            setShowCommandHint(true);
            return;
          } catch {
            // ignore
          }
        }
      }

      setShowCommandHint(false);
    },
    [setShowCommandHint, setHintPosition],
  );

  // Command hint is now handled by React, not a ProseMirror plugin

  // Custom paste handler plugin
  function customPastePlugin() {
    return new Plugin({
      props: {
        handlePaste(view, event) {
          if (event.clipboardData) {
            // Prefer HTML if available
            const html = event.clipboardData.getData("text/html");
            if (html) {
              const fragment = htmlToProseMirror(html);
              if (fragment) {
                const topNode = view.state.schema.topNodeType.create(null, fragment);
                view.dispatch(view.state.tr.replaceSelectionWith(topNode));
                return true;
              }
            }

            // Fallback to plain text
            const text = event.clipboardData.getData("text/plain");
            if (text) {
              const fragment = mdxLikeToProseMirror(text);
              if (fragment) {
                const topNode = view.state.schema.topNodeType.create(null, fragment);
                view.dispatch(view.state.tr.replaceSelectionWith(topNode));
                return true;
              }
            }
          }
          return false;
        },
      },
    });
  }

  const plugins = useMemo(
    () => [
      reactKeys(),
      createTooltipClickPlugin({
        onTooltipClick: (tooltipText, from, to) => {
          setTooltipText(tooltipText);
          setTooltipEditRange({ from, to });
          setIsEditingTooltip(true);
          setTooltipPromptOpen(true);
        },
      }),
      keymapPlugin({
        "Mod-z": undo,
        "Mod-r": redo,

        "/": (state, _dispatch, view) => {
          if (!view) return false;

          const { $head, empty } = state.selection;

          // Check if CodeMirror is currently focused (inside a code snippet)
          const activeElement = document.activeElement;
          if (activeElement) {
            // Check if the focused element is inside a CodeMirror editor
            const cmEditor = activeElement.closest(".cm-editor");
            const cmContent = activeElement.closest(".cm-content");
            if (cmEditor || cmContent) {
              // CodeMirror is focused, don't trigger command menu
              return false;
            }
          }

          // Only trigger if:
          // 1. Selection is empty (no text selected)
          // 2. We're in a paragraph node
          // 3. The paragraph is empty OR we're at the very beginning of the line
          if (empty && $head.parent.type.name === "paragraph") {
            const parentStart = $head.start($head.depth);
            const isAtStart = $head.pos === parentStart;
            const isEmptyParagraph = $head.parent.content.size === 0;

            if (isEmptyParagraph || isAtStart) {
              const coords = view.coordsAtPos($head.pos);
              const { top, left } = clampDialogPosition(coords.bottom + 5, coords.left);

              setDialogPosition({
                top,
                left,
              });

              setCurrentMenuType("commands");
              openDialog();
              return true; // Prevent default behavior
            }
          }

          // Check if we have a text selection - show marks menu
          if (!empty && hasTextSelection(state)) {
            const coords = view.coordsAtPos(state.selection.from);
            const { top, left } = clampDialogPosition(coords.bottom + 5, coords.left);

            setMarksDialogPosition({
              top,
              left,
            });

            setCurrentMenuType("marks");
            openMarksDialog();
            return true; // Prevent default behavior
          }

          // Allow normal "/" typing in other cases
          return false;
        },
      }),
      history(),
      inputPlugin(),
      customPastePlugin(),
      keymap(baseKeymap),
    ],
    [],
  );

  // Only re-initialize editor state when value prop changes (i.e., when a new file is loaded)
  useEffect(() => {
    if (props.value !== undefined) {
      const fragment = props.value.length > 0 ? mdxLikeToProseMirror(props.value) : Fragment.empty;
      const topNode = schema.topNodeType.create(null, fragment);

      const newState = EditorState.create({
        schema,
        doc: topNode,
        plugins,
      });

      setEditorState(newState);
    } else {
      // Handle case where value is undefined (reset to empty state)
      const newState = EditorState.create({
        schema,
        plugins,
      });
      setEditorState(newState);
    }
  }, [props.value, plugins]);

  async function handleCommandWrapper(command: Command) {
    closeDialog();

    const view = editorViewRef.current;
    if (!view) return;
    const { state, dispatch } = view;

    // Map component names to their insert functions
    const insertFunctions = {
      accordion: insertAccordion,
      badge: insertBadge,
      break: insertBreak,
      callout: insertCallout,
      card: insertCard,
      code_snippet: insertCodeSnippet,
      columns: insertColumns,
      field: insertField,
      foo: insertFoo,
      frame: insertFrame,
      icon: insertIcon,
      mermaid: insertMermaid,
      step: insertStep,
      tabs: insertTabs,
    };

    // Check if this is a component command with an insert function
    if (isComponentCommand(command) && command.componentName in insertFunctions) {
      const insertFunction = insertFunctions[command.componentName as keyof typeof insertFunctions];
      const tr = insertFunction(state);
      dispatch(tr);
      view.focus();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const text = (command as any).write;
    if (typeof text !== "string") return;

    // Fall back to typing simulation for other commands
    const { from, to } = state.selection;
    let currentPos = from;
    if (from !== to) {
      const deleteTransaction = state.tr.delete(from, to);
      dispatch(deleteTransaction);
      currentPos = from;
    }
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const currentState = view.state;
      const handled = view.someProp("handleTextInput", (f) =>
        f(view, currentPos, currentPos, char, () => currentState.tr),
      );
      if (!handled) {
        const tr = currentState.tr.insertText(char, currentPos);
        view.dispatch(tr);
      }
      currentPos++;
    }
    view.focus();
  }

  async function handleMarkCommand(command: MarkCommand) {
    closeMarksDialog();

    const view = editorViewRef.current;
    if (!view) return;
    const { state, dispatch } = view;

    if (isSimpleMarkCommand(command)) {
      command.execute(state, dispatch);
      view.focus();
    } else if (isTooltipMarkCommand(command)) {
      // Open tooltip prompt for new tooltip
      setTooltipText("");
      setIsEditingTooltip(false);
      setTooltipEditRange(null);
      setTooltipPromptOpen(true);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const items = currentMenuType === "commands" ? filteredCommands : filteredMarks;
    let newIdx = dialogSelectedIdx;
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        // Skip separators
        do {
          newIdx = newIdx < items.length - 1 ? newIdx + 1 : 0;
        } while (items[newIdx] && "separator" in items[newIdx]);
        setDialogSelectedIdx(newIdx);
        setTimeout(() => {
          const el = document.querySelector(`[data-cmd-idx="${newIdx}"]`);
          if (el) {
            (el as HTMLElement).scrollIntoView({ block: "nearest" });
          }
        }, 0);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        // Skip separators
        do {
          newIdx = newIdx > 0 ? newIdx - 1 : items.length - 1;
        } while (items[newIdx] && "separator" in items[newIdx]);
        setDialogSelectedIdx(newIdx);
        setTimeout(() => {
          const el = document.querySelector(`[data-cmd-idx="${newIdx}"]`);
          if (el) {
            (el as HTMLElement).scrollIntoView({ block: "nearest" });
          }
        }, 0);
        break;
      }

      case "Escape":
        e.preventDefault();
        if (currentMenuType === "commands") {
          closeDialog();
        } else {
          closeMarksDialog();
        }
        break;

      case "Enter": {
        e.preventDefault();
        const idx = dialogSelectedIdx;
        const selectedItem = items[idx];
        if (selectedItem && !("separator" in selectedItem)) {
          if (currentMenuType === "commands") {
            handleCommandWrapper(selectedItem as Command);
          } else {
            handleMarkCommand(selectedItem as MarkCommand);
          }
        }
        break;
      }
      default:
        break;
    }
  }

  function openDialog() {
    setShowCommandHint(false);
    setCommandMenuQuery(""); // Reset search on open
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
    setShowCommandHint(false);
    setCommandMenuQuery(""); // Reset search on close
  }

  function openMarksDialog() {
    setShowCommandHint(false);
    setMarksMenuQuery(""); // Reset search on open
    marksDialogRef.current?.showModal();
  }

  function closeMarksDialog() {
    marksDialogRef.current?.close();
    setShowCommandHint(false);
    setMarksMenuQuery(""); // Reset search on close
  }

  // Always select the first filtered command when the search query changes
  useEffect(() => {
    setDialogSelectedIdx(0);
  }, [commandMenuQuery, marksMenuQuery]);

  // Clamp dialogSelectedIdx to 0 if out of bounds when filtered items change
  useEffect(() => {
    const items = currentMenuType === "commands" ? filteredCommands : filteredMarks;
    if (dialogSelectedIdx > items.length - 1) {
      setDialogSelectedIdx(0);
    }
  }, [filteredCommands, filteredMarks, dialogSelectedIdx, currentMenuType]);

  return (
    <EditorEditableProvider editable={props.editable ?? true}>
      {/* The surrounding div */}
      <div className="p-4 shadow-lg m-4 rounded-lg min-h-96" style={{ position: "relative" }} ref={containerRef}>
        {/* Commands Dialog */}
        <dialog
          onKeyDown={onKeyDown}
          onClick={closeDialog}
          ref={dialogRef}
          className="fixed m-0 p-1.5 drop-shadow-lg border border-zinc-800/70 rounded-lg bg-zinc-900/95 z-1000 backdrop:bg-transparent"
          style={{
            top: `${dialogPosition.top}px`,
            left: `${dialogPosition.left}px`,
            width: `${DIALOG_WIDTH}px`,
            maxHeight: `${DIALOG_HEIGHT}px`,
            overflowY: "auto",
          }}
        >
          {/* Command menu search input */}
          <input
            autoFocus
            type="text"
            placeholder="Type to search components…"
            className="w-full mb-2 px-2 py-1 rounded bg-zinc-900/80 text-white/80 border border-zinc-800/70 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm font-mono"
            value={commandMenuQuery}
            onChange={(e) => {
              setCommandMenuQuery(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
          />

          <ol className="outline-none overflow-y-auto max-h-[350px]">
            {filteredCommands.map((command, index) => {
              // Always highlight the dialogSelectedIdx
              const isSelected = index === dialogSelectedIdx;

              if ("separator" in command) {
                return (
                  <li key={`separator-${index}`} className="my-2">
                    <hr className="border-zinc-800/70" />
                  </li>
                );
              }

              return (
                <li key={command.id}>
                  <button
                    type="button"
                    data-cmd-idx={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCommandWrapper(command);
                    }}
                    className={`flex flex-row items-center gap-3 outline-none px-2 py-1.5 rounded transition-colors duration-100 cursor-pointer w-full text-left font-mono text-sm
                      ${isSelected ? "bg-zinc-800/80 text-white/90" : "text-white/70"}
                      hover:bg-zinc-800/80 hover:text-white/90`}
                  >
                    <command.icon className="w-4 h-4" />

                    <div className="flex flex-col w-full">
                      <h2 className="font-semibold">{command.name}</h2>
                      <p className="text-white/50 text-xs">{command.description}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </dialog>

        {/* Marks Dialog */}
        <dialog
          onKeyDown={onKeyDown}
          onClick={closeMarksDialog}
          ref={marksDialogRef}
          className="fixed m-0 p-1.5 drop-shadow-lg border border-zinc-800/70 rounded-lg bg-zinc-900/95 z-1000 backdrop:bg-transparent"
          style={{
            top: `${marksDialogPosition.top}px`,
            left: `${marksDialogPosition.left}px`,
            width: `${DIALOG_WIDTH}px`,
            maxHeight: `${DIALOG_HEIGHT}px`,
            overflowY: "auto",
          }}
        >
          {/* Marks menu search input */}
          <input
            autoFocus
            type="text"
            placeholder="Type to search marks…"
            className="w-full mb-2 px-2 py-1 rounded bg-zinc-900/80 text-white/80 border border-zinc-800/70 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm font-mono"
            value={marksMenuQuery}
            onChange={(e) => {
              setMarksMenuQuery(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
          />

          <ol className="outline-none overflow-y-auto max-h-[350px]">
            {filteredMarks.map((command, index) => {
              // Always highlight the dialogSelectedIdx
              const isSelected = index === dialogSelectedIdx;

              if ("separator" in command) {
                return (
                  <li key={`separator-${index}`} className="my-2">
                    <hr className="border-zinc-800/70" />
                  </li>
                );
              }

              return (
                <li key={command.id}>
                  <button
                    type="button"
                    data-cmd-idx={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkCommand(command);
                    }}
                    className={`flex flex-row items-center gap-3 outline-none px-2 py-1.5 rounded transition-colors duration-100 cursor-pointer w-full text-left font-mono text-sm
                      ${isSelected ? "bg-zinc-800/80 text-white/90" : "text-white/70"}
                      hover:bg-zinc-800/80 hover:text-white/90`}
                  >
                    <command.icon className="w-4 h-4" />

                    <div className="flex flex-col w-full">
                      <h2 className="font-semibold">{command.name}</h2>
                      <p className="text-white/50 text-xs">{command.description}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </dialog>

        {/* The actual input */}
        {editorState && (
          <ProseMirror
            className="outline-none min-h-96"
            editable={() => props.editable ?? true}
            state={editorState}
            dispatchTransaction={(tr) => {
              const oldSelection = editorState?.selection;
              const newState = editorState.apply(tr);
              setEditorState(newState);

              // Check for selection changes and update hint
              if (oldSelection && !tr.selection.eq(oldSelection)) {
                const view = editorViewRef.current;
                if (view) {
                  setTimeout(() => checkCommandHint(view), 0);
                }
              }

              // Also check on any document changes that might affect positioning
              if (tr.docChanged) {
                const view = editorViewRef.current;
                if (view) {
                  setTimeout(() => checkCommandHint(view), 0);
                }
              }

              // Ideally should only actually serialize when needed (saving a file) and not during every transaction
              props.onChange?.(proseMirrorToHTML(newState.doc));
            }}
            nodeViews={{
              card: CardNodeView,
              tabs: TabsNodeView,
              callout: CalloutNodeView,
              code_snippet: CodeSnippetNodeView,
              break: BreakNodeView,
              badge: BadgeNodeView,
              icon: IconNodeView,
              step: StepNodeView,
              accordion: AccordionNodeView,
              columns: ColumnsNodeView,
              column: ColumnNodeView,
              foo: FooNodeView,
              mermaid: MermaidNodeView,
              field: FieldNodeView,
              frame: FrameNodeView,
            }}
          >
            <EditorViewCapture viewRef={editorViewRef} checkCommandHint={checkCommandHint} />
            <ProseMirrorDoc />
          </ProseMirror>
        )}

        {/* Command Hint is now handled by React */}
        {props.editable !== false && showCommandHint && (
          <span
            className="text-zinc-400 dark:text-zinc-500 italic pointer-events-none select-none"
            style={{
              position: "absolute",
              top: hintPosition.top,
              left: hintPosition.left,
              opacity: 0.7,
              fontStyle: "italic",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            Press &apos;/&apos; for commands and marks
          </span>
        )}

        {/* Attribute Prompt Dialog */}
        <AttributePromptDialog
          isOpen={attributePromptOpen}
          config={attributePromptConfig}
          values={attributePromptValues}
          errors={attributePromptErrors}
          onChange={(name, value) => {
            setAttributePromptValues((v) => ({ ...v, [name]: value }));
            // @ts-expect-error attributePromptErrors is unknown
            setAttributePromptErrors((e) => ({ ...e, [name]: undefined }));
          }}
          onSubmit={() => {
            if (!attributePromptConfig || !pendingAttributeCommand) return;
            // Validate
            const newErrors: Record<string, string> = {};
            let hasErrors = false;
            attributePromptConfig.fields.forEach((field) => {
              const value = attributePromptValues[field.name];
              if (field.required && (value === undefined || value === null || value === "")) {
                newErrors[field.name] = `${field.label} is required`;
                hasErrors = true;
                return;
              }
              if (field.validation && value !== undefined && value !== null && value !== "") {
                const error = field.validation(value);
                if (error) {
                  newErrors[field.name] = error;
                  hasErrors = true;
                }
              }
            });
            setAttributePromptErrors(newErrors);
            if (hasErrors) return;

            // Insert the component node directly instead of simulating typing
            const command = pendingAttributeCommand;
            const editorView = editorViewRef.current;
            if (editorView) {
              const { state, dispatch } = editorView;
              const { from, to } = state.selection;

              // @ts-expect-error command is unknown
              const componentName = command.componentName;

              // Create the node directly
              const nodeType = state.schema.nodes[componentName];
              if (!nodeType) {
                console.error("No node type found for", componentName);
                return;
              }

              // Convert attribute values to match the node spec format
              const attrs: Record<string, unknown> = {};
              for (const [key, value] of Object.entries(attributePromptValues)) {
                // Handle boolean conversion for attributes like showIcon
                if (typeof value === "string" && (value === "true" || value === "false")) {
                  attrs[key] = value === "true";
                } else {
                  attrs[key] = value;
                }
              }

              // Create content based on the component type
              let content;
              if (
                componentName === "card" ||
                componentName === "callout" ||
                componentName === "accordion" ||
                componentName === "frame" ||
                componentName === "field"
              ) {
                // These components need block content (typically a paragraph)
                content = state.schema.nodes.paragraph.create();
              } else {
                // Other components are typically leaf nodes with no content
                content = null;
              }

              const node = nodeType.create(attrs, content);

              let tr = state.tr;
              if (from !== to) {
                tr = tr.delete(from, to);
              }
              tr = tr.replaceSelectionWith(node);

              // For content-containing components like field, position cursor inside the content
              if (
                componentName === "card" ||
                componentName === "callout" ||
                componentName === "accordion" ||
                componentName === "frame" ||
                componentName === "field"
              ) {
                const insertPos = tr.selection.from;
                // Position cursor at the start of the paragraph inside the component
                const innerPos = insertPos + 1; // Skip the opening tag of the component
                tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
              }

              dispatch(tr);
              editorView.focus();
            }
            setAttributePromptOpen(false);
            setPendingAttributeCommand(null);
          }}
          onClose={() => {
            setAttributePromptOpen(false);
            setPendingAttributeCommand(null);
          }}
        />

        {/* Tooltip Prompt Modal */}
        <TooltipPromptModal
          open={tooltipPromptOpen}
          initialTooltip={tooltipText}
          isEditing={isEditingTooltip}
          onCloseAction={() => {
            setTooltipPromptOpen(false);
            setTooltipText("");
            setIsEditingTooltip(false);
            setTooltipEditRange(null);
          }}
          onSubmitAction={(text) => {
            const view = editorViewRef.current;
            if (view && text.trim()) {
              if (isEditingTooltip && tooltipEditRange) {
                // Update existing tooltip
                updateTooltipMark(view, tooltipEditRange.from, tooltipEditRange.to, text.trim());
              } else {
                // Create new tooltip
                executeTooltipMark(view.state, view.dispatch, text.trim());
              }
              view.focus();
            }
            setTooltipPromptOpen(false);
            setTooltipText("");
            setIsEditingTooltip(false);
            setTooltipEditRange(null);
          }}
          onRemoveAction={
            isEditingTooltip && tooltipEditRange
              ? () => {
                  const view = editorViewRef.current;
                  if (view) {
                    removeTooltipMark(view, tooltipEditRange.from, tooltipEditRange.to);
                    view.focus();
                  }
                  setTooltipPromptOpen(false);
                  setTooltipText("");
                  setIsEditingTooltip(false);
                  setTooltipEditRange(null);
                }
              : undefined
          }
        />
      </div>
    </EditorEditableProvider>
  );
}

function EditorViewCapture({
  viewRef,
  checkCommandHint,
}: {
  viewRef: React.MutableRefObject<EditorView | null>;
  checkCommandHint: (view: EditorView) => void;
}) {
  useEditorEffect(
    (view) => {
      viewRef.current = view;

      // Initial check
      checkCommandHint(view);

      // Simple focus/blur handling
      const handleFocus = () => {
        setTimeout(() => checkCommandHint(view), 50);
      };

      // Handle scroll events to update hint position
      const handleScroll = () => {
        setTimeout(() => checkCommandHint(view), 0);
      };

      // Handle window scroll events for cases where editor is in a scrollable page
      const handleWindowScroll = () => {
        setTimeout(() => checkCommandHint(view), 0);
      };

      // Handle window resize to update hint position
      const handleWindowResize = () => {
        setTimeout(() => checkCommandHint(view), 0);
      };

      view.dom.addEventListener("focus", handleFocus);
      view.dom.addEventListener("scroll", handleScroll);
      window.addEventListener("scroll", handleWindowScroll);
      window.addEventListener("resize", handleWindowResize);

      return () => {
        viewRef.current = null;
        view.dom.removeEventListener("focus", handleFocus);
        view.dom.removeEventListener("scroll", handleScroll);
        window.removeEventListener("scroll", handleWindowScroll);
        window.removeEventListener("resize", handleWindowResize);
      };
    },
    [checkCommandHint],
  );

  return null;
}
