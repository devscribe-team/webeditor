/**
 * Markdown input rules for the ProseMirror editor.
 */

import { baseKeymap } from "prosemirror-commands";
import { InputRule, inputRules, textblockTypeInputRule, wrappingInputRule } from "prosemirror-inputrules";
import { liftListItem, sinkListItem, splitListItem } from "prosemirror-schema-list";
import { type Command } from "prosemirror-state";
import { schema } from "../schema";
import { addCalloutRule } from "../components/callout";
import { addCardRule } from "../components/card";
import { addTabsRule } from "../components/tabs";
import { addBadgeRule } from "../components/badge";
import { addCodeSnippetRule } from "../components/code-snippet";
import { addBreakRule } from "../components/break";
import { addStepRule } from "../components/steps";
import { addAccordionRule } from "../components/accordion";
import { addColumnsRule } from "../components/columns";
import { addFooRule } from "../components/foo";
import { addIconRule } from "../components/icon";
import { addMermaidRule } from "../components/mermaid";
import { addFieldRule } from "../components/field";
import { addFrameRule } from "../components/frame";

export const addHeadersRule = textblockTypeInputRule(/^(#{1,4})\s$/, schema.nodes.heading, (match) => ({
  level: match[1].length,
}));

export const addUnorderedListRule = wrappingInputRule(/^\s*[-*+]\s$/, schema.nodes.bullet_list);

export const addOrderedListRule = wrappingInputRule(/^\s*\d+\.\s$/, schema.nodes.ordered_list);

export const addQuoteRule = wrappingInputRule(/^\s*>\s/, schema.nodes.blockquote);

// export const addCodeBlockRule = textblockTypeInputRule(/^```$/, schema.nodes.code_block);

export const addStrongRule = new InputRule(/\*\*([^*]+)\*\*/, (state, match, start, end) => {
  const tr = state.tr;

  if (match) {
    const textContent = match[1];

    // Replace the entire match with just the text content
    tr.replaceWith(start, end, state.schema.text(textContent, [state.schema.marks.strong.create()]));

    // Don't continue with the mark
    tr.removeStoredMark(schema.marks.strong);
  }

  return tr;
});

export const addEmRule = new InputRule(/_([^_]+)_/, (state, match, start, end) => {
  const tr = state.tr;

  if (match) {
    const textContent = match[1];

    // Replace the entire match with just the text content
    tr.replaceWith(start, end, state.schema.text(textContent, [state.schema.marks.em.create()]));

    // Don't continue with the mark
    tr.removeStoredMark(schema.marks.em);
  }

  return tr;
});

export const addStrikethroughRule = new InputRule(/~~([^~]+)~~/, (state, match, start, end) => {
  const tr = state.tr;

  if (match) {
    const textContent = match[1];

    // Replace the entire match with just the text content
    tr.replaceWith(start, end, state.schema.text(textContent, [state.schema.marks.strikethrough.create()]));

    // Don't continue with the mark
    tr.removeStoredMark(schema.marks.strikethrough);
  }

  return tr;
});

export const enterKeyHandler: Command = (state, dispatch, view) => {
  const $from = state.selection.$from;

  const parent = $from.node($from.depth);
  const grandParent = $from.node($from.depth - 1);

  if (grandParent?.type?.name === "list_item") {
    // If list item empty, delete and exit list.
    if (parent.content.size === 0) {
      return liftListItem(schema.nodes.list_item)(state, dispatch, view);
    }

    // If not empty, add another list item.
    return splitListItem(schema.nodes.list_item)(state, dispatch, view);
  }

  return false;
};

export const tabKeyHandler: Command = (state, dispatch, view) => {
  const $from = state.selection.$from;
  const grandParent = $from.node($from.depth - 1);

  if (grandParent.type.name === "list_item") {
    return sinkListItem(schema.nodes.list_item)(state, dispatch, view);
  }

  return false;
};

export function inputPlugin() {
  return inputRules({
    rules: [
      addHeadersRule,
      addUnorderedListRule,
      addOrderedListRule,
      addQuoteRule,
      // addCodeBlockRule,
      addStrongRule,
      addEmRule,
      addStrikethroughRule,
      addCardRule,
      addTabsRule,
      addCalloutRule,
      addBadgeRule,
      addCodeSnippetRule(schema),
      addBreakRule(schema),
      addStepRule,
      addAccordionRule,
      addColumnsRule,
      addFooRule(schema),
      addIconRule,
      addMermaidRule,
      addFieldRule,
      addFrameRule,
    ],
  });
}
