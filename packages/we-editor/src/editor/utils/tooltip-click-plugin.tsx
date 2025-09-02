import { Plugin, PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export interface TooltipClickHandler {
  onTooltipClick: (tooltipText: string, from: number, to: number) => void;
}

const tooltipClickPluginKey = new PluginKey("tooltipClick");

export function createTooltipClickPlugin(handler: TooltipClickHandler): Plugin {
  return new Plugin({
    key: tooltipClickPluginKey,
    props: {
      handleClickOn(view: EditorView, pos: number, node, nodePos: number, event: MouseEvent) {
        // Get the position and check if there's a tooltip mark at this position
        const $pos = view.state.doc.resolve(pos);
        const marks = $pos.marks();

        // Find tooltip mark
        const tooltipMark = marks.find((mark) => mark.type.name === "tooltip_mark");
        if (!tooltipMark) return false;

        // Find the range of the tooltip mark
        let from = pos;
        let to = pos;

        // Find the start of the mark
        while (from > 0) {
          const beforePos = view.state.doc.resolve(from - 1);
          const beforeMarks = beforePos.marks();
          const hasTooltipMark = beforeMarks.some(
            (mark) => mark.type.name === "tooltip_mark" && mark.attrs.tooltip === tooltipMark.attrs.tooltip,
          );
          if (!hasTooltipMark) break;
          from--;
        }

        // Find the end of the mark
        while (to < view.state.doc.content.size) {
          const afterPos = view.state.doc.resolve(to);
          const afterMarks = afterPos.marks();
          const hasTooltipMark = afterMarks.some(
            (mark) => mark.type.name === "tooltip_mark" && mark.attrs.tooltip === tooltipMark.attrs.tooltip,
          );
          if (!hasTooltipMark) break;
          to++;
        }

        // Call the handler with the tooltip text and range
        handler.onTooltipClick(tooltipMark.attrs.tooltip, from, to);

        // Prevent default click behavior
        event.preventDefault();
        return true;
      },
    },
  });
}

// Helper function to remove tooltip mark from a range
export function removeTooltipMark(view: EditorView, from: number, to: number): void {
  const { state, dispatch } = view;
  const tooltipMarkType = state.schema.marks.tooltip_mark;

  const tr = state.tr.removeMark(from, to, tooltipMarkType);
  dispatch(tr);
}

// Helper function to update tooltip mark text
export function updateTooltipMark(view: EditorView, from: number, to: number, newTooltipText: string): void {
  const { state, dispatch } = view;
  const tooltipMarkType = state.schema.marks.tooltip_mark;

  // Remove old mark and add new one
  let tr = state.tr.removeMark(from, to, tooltipMarkType);
  const newMark = tooltipMarkType.create({ tooltip: newTooltipText });
  tr = tr.addMark(from, to, newMark);

  dispatch(tr);
}
