import { keymap } from "prosemirror-keymap";
import { TextSelection } from "prosemirror-state";
import type { EditorState, Transaction } from "prosemirror-state";
// import type { EditorView } from "prosemirror-view";

import { enterKeyHandler, tabKeyHandler } from "./markdown/input";
import type { Command } from "prosemirror-state";
import { schema } from "./schema";

// Custom Mod-Enter handler to exit card node
function modEnterHandler(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const { $from } = state.selection;
  const cardType = schema.nodes.card;
  if (!cardType) return false;
  const parent = $from.node(-1);

  if (parent.type === cardType) {
    const cardPos = $from.before($from.depth - 1);
    const afterCard = cardPos + parent.nodeSize;
    if (dispatch) {
      let tr = state.tr;
      // Check if there's already a node after the card
      const nextPos = tr.doc.resolve(afterCard);
      if (!nextPos.nodeAfter || nextPos.nodeAfter.type.name !== "paragraph") {
        tr = tr.insert(afterCard, state.schema.nodes.paragraph.create());
      }
      // Move selection to the new paragraph
      tr = tr.setSelection(TextSelection.create(tr.doc, afterCard + 1));
      dispatch(tr);
    }
    return true;
  }
  return false;
}

// Custom Backspace handler to allow deleting last block in card, then exit card and insert paragraph after
function backspaceToEmptyCardHandler(
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
): boolean {
  const { $from } = state.selection;
  const cardType = schema.nodes.card;
  if (!cardType) return false;

  // Only run if the parent node is a card
  if ($from.depth < 2) return false;
  const maybeCard = $from.node($from.depth - 1);
  if (maybeCard.type !== cardType) return false;

  // Only one child left and cursor at start of it
  if (maybeCard.childCount === 1 && $from.parentOffset === 0) {
    const cardPos = $from.before($from.depth - 1);
    const child = maybeCard.child(0);
    if (dispatch) {
      let tr = state.tr.delete(cardPos + 1, cardPos + 1 + child.nodeSize);
      const afterCard = cardPos + maybeCard.nodeSize;
      if (afterCard <= tr.doc.content.size) {
        // Check if there's already a node after the card
        const nextPos = tr.doc.resolve(afterCard);
        if (!nextPos.nodeAfter || nextPos.nodeAfter.type.name !== "paragraph") {
          tr = tr.insert(afterCard, state.schema.nodes.paragraph.create());
        }
        // Move selection to the new paragraph after the card
        tr = tr.setSelection(TextSelection.create(tr.doc, afterCard + 1));
      } else {
        // Card is at the end of the document
        tr = tr.insert(tr.doc.content.size, state.schema.nodes.paragraph.create());
        const paraStart = tr.doc.content.size - 1;
        tr = tr.setSelection(TextSelection.create(tr.doc, paraStart));
      }
      dispatch(tr);
    }
    return true;
  }
  // Not at start of only child in card: call default Backspace
  return false;
}

export function keymapPlugin(commands: Record<string, Command> = {}) {
  return keymap({
    ...commands,
    Enter: enterKeyHandler,
    Tab: tabKeyHandler,
    "Mod-Enter": modEnterHandler,
    Backspace: backspaceToEmptyCardHandler,
  });
}
