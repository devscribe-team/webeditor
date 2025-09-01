"use client";

import { Bold, Italic, Strikethrough, Info, Code } from "lucide-react";
import { EditorState, Transaction } from "prosemirror-state";

// Enhanced mark command types
export interface SimpleMarkCommand {
  id: string;
  name: string;
  description: string;
  icon: typeof Bold;
  execute: (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean;
}

export interface TooltipMarkCommand {
  id: string;
  name: string;
  description: string;
  icon: typeof Info;
  type: "tooltip";
  requiresAttributes: true;
}

export type MarkCommand = SimpleMarkCommand | TooltipMarkCommand;

export interface MarkCommandSeparator {
  separator: true;
}

export type MarkCommandItem = MarkCommand | MarkCommandSeparator;

// Marks command menu setup
export const marksMenuSetup: MarkCommandItem[] = [
  {
    id: "bold",
    name: "Bold",
    description: "Make text bold",
    icon: Bold,
    execute: (state, dispatch) => {
      const { from, to } = state.selection;
      if (from === to) return false;

      if (dispatch) {
        const mark = state.schema.marks.strong.create();
        const tr = state.tr.addMark(from, to, mark).removeStoredMark(mark);
        dispatch(tr);
      }
      return true;
    },
  },
  {
    id: "italic",
    name: "Italic",
    description: "Make text italic",
    icon: Italic,
    execute: (state, dispatch) => {
      const { from, to } = state.selection;
      if (from === to) return false;

      if (dispatch) {
        const mark = state.schema.marks.em.create();
        const tr = state.tr.addMark(from, to, mark).removeStoredMark(mark);
        dispatch(tr);
      }
      return true;
    },
  },
  {
    id: "strikethrough",
    name: "Strikethrough",
    description: "Strike through text",
    icon: Strikethrough,
    execute: (state, dispatch) => {
      const { from, to } = state.selection;
      if (from === to) return false;

      if (dispatch) {
        const mark = state.schema.marks.strikethrough.create();
        const tr = state.tr.addMark(from, to, mark).removeStoredMark(mark);
        dispatch(tr);
      }
      return true;
    },
  },
  {
    id: "code",
    name: "Inline Code",
    description: "Format as inline code",
    icon: Code,
    execute: (state, dispatch) => {
      const { from, to } = state.selection;
      if (from === to) return false;

      if (dispatch) {
        const mark = state.schema.marks.code.create();
        const tr = state.tr.addMark(from, to, mark).removeStoredMark(mark);
        dispatch(tr);
      }
      return true;
    },
  },
  { separator: true },
  {
    id: "tooltip",
    name: "Tooltip",
    description: "Add a tooltip to the selected text",
    icon: Info,
    type: "tooltip",
    requiresAttributes: true,
  },
];

// Helper function to check if a mark command requires attributes
export function isTooltipMarkCommand(command: MarkCommand): command is TooltipMarkCommand {
  return "requiresAttributes" in command && command.requiresAttributes === true;
}

// Helper function to check if a mark command is a simple toggle
export function isSimpleMarkCommand(command: MarkCommand): command is SimpleMarkCommand {
  return "execute" in command;
}

// Helper function to get all simple mark commands
export function getSimpleMarkCommands(): SimpleMarkCommand[] {
  return marksMenuSetup.filter(
    (item): item is SimpleMarkCommand => !("separator" in item) && !("requiresAttributes" in item),
  );
}

// Helper function to get all tooltip mark commands
export function getTooltipMarkCommands(): TooltipMarkCommand[] {
  return marksMenuSetup.filter(
    (item): item is TooltipMarkCommand => !("separator" in item) && "requiresAttributes" in item,
  );
}

// Helper function to filter mark commands by search term
export function filterMarkCommands(searchTerm: string): MarkCommandItem[] {
  if (!searchTerm.trim()) {
    return marksMenuSetup;
  }

  const lowerSearch = searchTerm.toLowerCase();

  const filteredCommands = marksMenuSetup.filter((item) => {
    if ("separator" in item) return false;

    const command = item as MarkCommand;
    return (
      command.name.toLowerCase().includes(lowerSearch) ||
      command.description.toLowerCase().includes(lowerSearch) ||
      command.id.toLowerCase().includes(lowerSearch)
    );
  });

  return filteredCommands;
}

// Helper function to check if any text is selected
export function hasTextSelection(state: EditorState): boolean {
  return !state.selection.empty;
}

// Helper function to execute a tooltip mark command
export function executeTooltipMark(
  state: EditorState,
  dispatch: (tr: Transaction) => void,
  tooltipText: string,
): boolean {
  const { from, to } = state.selection;

  if (from === to) return false; // No selection

  const mark = state.schema.marks.tooltip_mark.create({ tooltip: tooltipText });
  const tr = state.tr.addMark(from, to, mark).removeStoredMark(mark);
  dispatch(tr);
  return true;
}
