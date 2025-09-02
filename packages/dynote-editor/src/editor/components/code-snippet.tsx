"use client";
// bun add @codemirror/lang-css @codemirror/lang-html @codemirror/lang-javascript @codemirror/lang-python @codemirror/lang-rust @codemirror/lang-sql @handlewithcare/react-prosemirror @uiw/codemirror-theme-github @uiw/codemirror-theme-tokyo-night @uiw/codemirror-theme-vscode @uiw/react-codemirror lucide-react prosemirror-inputrules prosemirror-model prosemirror-state react react-dom
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { NodeViewComponentProps, useEditorEventCallback, useStopEvent } from "@handlewithcare/react-prosemirror";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import CodeMirror, { Prec } from "@uiw/react-codemirror";
import { Check, ChevronDown, Copy, Square, SquareDashed } from "lucide-react";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec, Schema } from "prosemirror-model";
import { EditorState, Selection, Transaction } from "prosemirror-state";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditorEditable } from "../editorEditableContext";

export const codeSnippetNodeSpec: NodeSpec = {
  group: "block",
  content: "text*",
  marks: "",
  code: true,
  attrs: {
    language: { default: "javascript" },
    title: { default: "" },
    theme: { default: "tokyoNight" },
    showBorder: { default: true },
  },
  parseDOM: [
    {
      tag: "pre code",
      priority: 60,
      preserveWhitespace: "full",
      getAttrs: (dom) => {
        const el = dom as HTMLElement;
        return {
          language: el.getAttribute("language") || "javascript",
          title: el.getAttribute("title") || "",
          theme: el.getAttribute("theme") || "tokyoNight",
          showBorder: el.getAttribute("show-border") !== "false",
        };
      },
    },
  ],
  toDOM: (node) => [
    "pre",
    {
      language: node.attrs["language"],
      title: node.attrs["title"],
      theme: node.attrs["theme"],
      "show-border": node.attrs["showBorder"]?.toString(),
    },
    ["code", 0],
  ],
};

// Map language to CodeMirror extension
const languageExtensions: Record<string, ReturnType<typeof javascript>> = {
  javascript: javascript({ jsx: true }),
  typescript: javascript({ typescript: true, jsx: true }),
  html: html(),
  css: css(),
  python: python(),
  rust: rust(),
  sql: sql(),
};

// Map theme names to theme extensions
const themeExtensions = {
  tokyoNight: tokyoNight,
  githubDark: githubDark,
  githubLight: githubLight,
  vscodeDark: vscodeDark,
  vscodeLight: vscodeLight,
};

// Custom theme extension for padding and rounded corners
const customStyling = EditorView.theme({
  "&": {
    borderRadius: "0.5rem",
    overflow: "hidden",
    backgroundColor: "transparent !important",
  },
  ".cm-editor": {
    borderRadius: "0.5rem",
    backgroundColor: "transparent !important",
  },
  ".cm-editor.cm-focused": {
    backgroundColor: "transparent !important",
  },
  ".cm-scroller": {
    padding: "0.5rem",
    backgroundColor: "transparent !important",
  },
  ".cm-content": {
    padding: "0",
    backgroundColor: "transparent !important",
  },
  ".cm-gutters": {
    backgroundColor: "transparent !important",
    border: "none",
  },
  ".cm-gutter": {
    backgroundColor: "transparent !important",
  },
  ".cm-lineNumbers": {
    backgroundColor: "transparent !important",
  },
  ".cm-activeLine": {
    backgroundColor: "transparent !important",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent !important",
  },
  ".cm-focused": {
    outline: "none",
  },
});

import { keymap as cmKeymap, EditorView } from "@codemirror/view";

export const CodeSnippetNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function CodeSnippet(
  { nodeProps, ...props },
  ref,
) {
  const [value, setValue] = useState(nodeProps.node.textContent ?? "let x = 2;");
  const [language, setLanguage] = useState(nodeProps.node.attrs["language"]);
  const [theme, setTheme] = useState<keyof typeof themeExtensions>(nodeProps.node.attrs["theme"] || "tokyoNight");
  const [showBorder, setShowBorder] = useState(nodeProps.node.attrs["showBorder"] ?? true);
  const [showOptions, setShowOptions] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const codeMirrorRef = useRef<{ view?: EditorView }>(null);
  const [shouldFocus, setShouldFocus] = useState(false);

  const updateAttributes = useEditorEventCallback(
    (view, newContent: string, newLanguage?: string, newTheme?: string, newShowBorder?: boolean) => {
      const { tr } = view.state;
      const pos = nodeProps.getPos();
      const node = tr.doc.nodeAt(pos);

      if (node) {
        // Update language or theme attributes if provided
        if (
          (newLanguage && newLanguage !== nodeProps.node.attrs["language"]) ||
          (newTheme && newTheme !== nodeProps.node.attrs["theme"]) ||
          (newShowBorder !== undefined && newShowBorder !== nodeProps.node.attrs["showBorder"])
        ) {
          tr.setNodeMarkup(pos, undefined, {
            ...nodeProps.node.attrs,
            ...(newLanguage && { ["language"]: newLanguage }),
            ...(newTheme && { ["theme"]: newTheme }),
            ...(newShowBorder !== undefined && { ["showBorder"]: newShowBorder }),
          });
        }

        if (newContent.length !== 0) {
          const textNode = view.state.schema.text(newContent);
          tr.replaceWith(pos + 1, pos + 1 + node.content.size, textNode);
        }
      }

      view.dispatch(tr);
    },
  );

  // Debounce updateAttributes for 5s after value, language, or theme changes
  useEffect(() => {
    const handler = setTimeout(() => {
      updateAttributes(value, language, theme, showBorder);
    }, 100);

    return () => {
      clearTimeout(handler);
    };
  }, [value, language, theme, showBorder, updateAttributes]);

  const editable = useEditorEditable();

  // Auto-focus when component mounts (new code snippet created)
  useEffect(() => {
    // Check if this is a newly created code snippet (empty or default content)
    const isNewSnippet = nodeProps.node.textContent === "" || nodeProps.node.textContent === "let x = 2;";
    if (isNewSnippet && editable) {
      // Focus immediately to prevent typing in ProseMirror
      setShouldFocus(true);

      // Also try to blur any currently focused element to prevent interference
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur?.();
      }
    }
  }, [nodeProps.node.textContent, editable]);

  // Focus the CodeMirror editor when shouldFocus is true
  useEffect(() => {
    if (shouldFocus && codeMirrorRef.current && editable) {
      const focusEditor = () => {
        const view = codeMirrorRef.current?.view;
        if (view) {
          // Prevent ProseMirror from regaining focus
          view.dom.focus();
          view.focus();
          // Position cursor at the end of the content
          const doc = view.state.doc;
          view.dispatch({
            selection: { anchor: doc.length },
            scrollIntoView: true,
          });
        }
        setShouldFocus(false);
      };

      // Focus immediately on next tick to ensure DOM is ready
      Promise.resolve().then(focusEditor);
    }
  }, [shouldFocus, editable]);

  const onChange = useCallback((v: string) => {
    setValue(v);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // This is necessary or events get swallowed by ProseMirror
  useStopEvent((view, event) => {
    if (event instanceof InputEvent) return true;
    return false;
  });

  const deleteNodeFromPM = useEditorEventCallback((view) => {
    const pos = nodeProps.getPos();
    const start = pos;
    const end = pos + nodeProps.node.nodeSize;

    let tr = view.state.tr.delete(start, end);

    // If the document is now empty, insert a paragraph so the caret has somewhere to go.
    if (tr.doc.childCount === 0) {
      const para = view.state.schema.nodes.paragraph.create();
      tr = tr.insert(0, para);
    }

    // Place the caret near where the code block was.
    const targetPos = Math.min(start, tr.doc.content.size);
    tr = tr.setSelection(Selection.near(tr.doc.resolve(targetPos), -1)).scrollIntoView();

    view.dispatch(tr);
    view.focus();
    return true;
  });

  const escapeDownToPM = useEditorEventCallback((view) => {
    const pos = nodeProps.getPos();
    const after = pos + nodeProps.node.nodeSize;

    let tr = view.state.tr;
    const $after = tr.doc.resolve(after);

    // If nothing after the code block, insert an empty paragraph to land in
    if (!$after.nodeAfter) {
      const para = view.state.schema.nodes.paragraph.create();
      tr = tr.insert(after, para);
    }

    // Place the caret just after the code block (into the paragraph)
    tr = tr.setSelection(Selection.near(tr.doc.resolve(after + 1), 1)).scrollIntoView();

    view.dispatch(tr);
    view.focus();
    return true;
  });

  const escapeUpToPM = useEditorEventCallback((view) => {
    const pos = nodeProps.getPos(); // start of this code node
    let tr = view.state.tr;

    // If there's no node before this block, insert a paragraph above
    const $before = tr.doc.resolve(pos);
    if (!$before.nodeBefore) {
      const para = view.state.schema.nodes.paragraph.create();
      tr = tr.insert(pos, para);
    }

    // After potential insert, map the original start
    const mappedStart = tr.mapping.map(pos);

    // Place caret just before this node (into the previous block)
    tr = tr.setSelection(Selection.near(tr.doc.resolve(mappedStart), -1)).scrollIntoView();

    view.dispatch(tr);
    view.focus();
    return true;
  });

  const arrowUpExitExtension = useMemo(
    () =>
      Prec.highest(
        cmKeymap.of([
          {
            key: "ArrowUp",
            run: (cm) => {
              const sel = cm.state.selection.main;
              if (!sel.empty) return false;

              // Must be at the start of the first line
              const line = cm.state.doc.lineAt(sel.head);
              if (sel.head > line.from) return false; // not at start of line
              if (line.from > 0) return false; // not the first line
              if (sel.head !== 0) return false; // not at absolute start

              // Jump to ProseMirror before the code node
              escapeUpToPM();
              return true;
            },
          },
        ]),
      ),
    [escapeUpToPM],
  );

  const arrowDownExitExtension = useMemo(
    () =>
      Prec.highest(
        cmKeymap.of([
          {
            key: "ArrowDown",
            run: (cm) => {
              const sel = cm.state.selection.main;
              // Only when cursor is a caret (not a range)
              if (!sel.empty) return false;

              // Are we at the end of the current line?
              const line = cm.state.doc.lineAt(sel.head);
              if (sel.head < line.to) return false;

              // And is this the last line of the doc?
              if (line.to < cm.state.doc.length) return false;

              // Yes: escape to ProseMirror after this node
              escapeDownToPM();
              return true;
            },
          },
        ]),
      ),
    [escapeDownToPM],
  );

  const ctrlEnterExitExtension = useMemo(
    () =>
      Prec.highest(
        cmKeymap.of([
          {
            key: "Ctrl-Enter",
            run: () => {
              // Respect overall editor "editable" toggle
              if (!editable) return false;

              escapeDownToPM();
              return true; // handled
            },
          },
        ]),
      ),
    [escapeDownToPM, editable],
  );

  const backspaceDeleteExtension = useMemo(
    () =>
      Prec.highest(
        cmKeymap.of([
          {
            key: "Backspace",
            run: (cm) => {
              // Only when the CM doc is truly empty
              if (cm.state.doc.length > 0) return false;
              // Respect overall editor "editable" toggle
              if (!editable) return false;

              deleteNodeFromPM();
              return true; // handled
            },
          },
        ]),
      ),
    [deleteNodeFromPM, editable],
  );

  return (
    <div
      ref={ref}
      {...props}
      contentEditable={false}
      className={`relative rounded-lg overflow-hidden ${showBorder ? "border border-zinc-700/50" : ""}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => !dropdownOpen && setShowOptions(false)}
    >
      {/* Top-right hover options */}
      <div
        className={`absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-200 ${
          showOptions || dropdownOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } z-10 bg-black/10 rounded-lg px-2 py-1 shadow-lg`}
      >
        <DropdownMenu onOpenChange={(open) => setDropdownOpen(open)}>
          <DropdownMenuTrigger asChild>
            <button
              className="bg-zinc-800/60 text-white/80 hover:cursor-pointer rounded px-2 py-0.5 pr-6 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-xs font-mono relative flex items-center"
              style={{ minWidth: "110px" }}
            >
              {language.toLowerCase()}
              <ChevronDown className="absolute right-1.5 text-white/80 w-3 h-3" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-800/95 border-zinc-700">
            {Object.keys(languageExtensions).map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setLanguage(key)}
                className="text-white/80 hover:bg-zinc-700/60 focus:bg-zinc-700/60 text-xs font-mono cursor-pointer"
              >
                {key}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu onOpenChange={(open) => setDropdownOpen(open)}>
          <DropdownMenuTrigger asChild>
            <button
              className="bg-zinc-800/60 text-white/80 hover:cursor-pointer rounded px-2 py-0.5 pr-6 focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-xs font-mono relative flex items-center"
              style={{ minWidth: "120px" }}
            >
              {theme
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())
                .toLowerCase()}
              <ChevronDown className="absolute right-1.5 text-white/80 w-3 h-3" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-zinc-800/95 border-zinc-700">
            {Object.keys(themeExtensions).map((key) => (
              <DropdownMenuItem
                key={key}
                onClick={() => setTheme(key as keyof typeof themeExtensions)}
                className="text-white/80 hover:bg-zinc-700/60 focus:bg-zinc-700/60 text-xs font-mono cursor-pointer"
              >
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          onClick={() => setShowBorder(!showBorder)}
          className="flex items-center outline-none select-none hover:cursor-pointer gap-1 bg-zinc-800/60 text-white/80 rounded px-2 py-0.5 hover:bg-zinc-700/60 transition-colors text-xs font-mono"
          title={showBorder ? "Hide border" : "Show border"}
        >
          {showBorder ? (
            <Square className="w-3 h-3" aria-hidden="true" />
          ) : (
            <SquareDashed className="w-3 h-3" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center outline-none select-none hover:cursor-pointer gap-1 bg-zinc-800/60 text-white/80 rounded px-2 py-0.5 hover:bg-zinc-700/60 transition-colors text-xs font-mono"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <CodeMirror
        ref={(instance) => {
          // @ts-ignore
          codeMirrorRef.current = instance;
          // If this is a new snippet that should focus, focus immediately
          if (shouldFocus && instance?.view && editable) {
            instance.view.focus();
            const doc = instance.view.state.doc;
            instance.view.dispatch({
              selection: { anchor: doc.length },
              scrollIntoView: true,
            });
            setShouldFocus(false);
          }
        }}
        className="text-lg min-h-[40px] max-h-[400px] overflow-y-auto rounded-lg"
        theme={themeExtensions[theme]}
        value={value}
        editable={editable}
        extensions={[
          language in languageExtensions ? [languageExtensions[language]] : [],
          arrowDownExitExtension,
          arrowUpExitExtension,
          ctrlEnterExitExtension,
          backspaceDeleteExtension,
          customStyling,
        ]}
        onChange={onChange}
      />
    </div>
  );
});

export function addCodeSnippetRule(schema: Schema) {
  return new InputRule(/^```$/, (state, match, start, end) => {
    const { tr } = state;
    const codeNodeType = schema.nodes.code_snippet;
    if (!codeNodeType) return null;

    // Check if we're inside a tabs component
    const $pos = tr.selection.$from;
    let insideTabs = false;
    for (let i = $pos.depth; i >= 0; i--) {
      if ($pos.node(i).type.name === "tabs") {
        insideTabs = true;
        break;
      }
    }

    const codeNode = codeNodeType.create({
      language: "javascript",
      showBorder: !insideTabs,
    });

    tr.replaceRangeWith(start, end, codeNode);
    const codePos = tr.selection.$from.pos;
    tr.setSelection(Selection.near(tr.doc.resolve(codePos)));
    return tr;
  });
}

export function insertCodeSnippet(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    language: "javascript",
    title: "",
    theme: "tokyoNight",
    showBorder: true,
  };

  const codeNodeType = state.schema.nodes.code_snippet;
  if (!codeNodeType) {
    throw new Error("code_snippet node type not found in schema");
  }

  // Check if we're inside a tabs component
  const $pos = state.selection.$from;
  let insideTabs = false;
  for (let i = $pos.depth; i >= 0; i--) {
    if ($pos.node(i).type.name === "tabs") {
      insideTabs = true;
      break;
    }
  }

  const codeNode = codeNodeType.create({
    ...attrs,
    showBorder: !insideTabs,
  });

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(codeNode);

  // Position cursor inside the code snippet
  const codePos = tr.selection.from;
  tr = tr.setSelection(Selection.near(tr.doc.resolve(codePos)));

  return tr;
}
