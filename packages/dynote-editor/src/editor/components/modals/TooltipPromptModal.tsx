"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Props for TooltipPromptModal
 */
interface TooltipPromptModalProps {
  open: boolean;
  initialTooltip?: string;
  onCloseAction: () => void;
  onSubmitAction: (tooltipText: string) => void;
  onRemoveAction?: () => void;
  isEditing?: boolean;
}

export function TooltipPromptModal({
  open,
  initialTooltip = "",
  onCloseAction,
  onSubmitAction,
  onRemoveAction,
  isEditing = false,
}: TooltipPromptModalProps) {
  const [tooltipText, setTooltipText] = useState(initialTooltip);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTooltipText(initialTooltip);
  }, [initialTooltip, open]);

  useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isVisible) return null;

  function handleSubmit() {
    const trimmed = tooltipText.trim();
    if (trimmed) {
      onSubmitAction(trimmed);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCloseAction();
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onCloseAction();
    }
  }

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
          <h2 className="text-lg font-semibold text-foreground">{isEditing ? "Edit Tooltip" : "Add Tooltip"}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tooltip-text-input" className="text-sm font-medium text-foreground">
              Tooltip Text
            </Label>
            <Input
              id="tooltip-text-input"
              value={tooltipText}
              autoFocus
              onChange={(e) => setTooltipText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-background border-border focus:border-primary focus:ring-primary/20"
              placeholder="Enter tooltip text..."
              spellCheck={false}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            This will add a tooltip to the selected text. Hover over the text to see the tooltip.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-between">
          <div>
            {isEditing && onRemoveAction && (
              <button
                type="button"
                onClick={onRemoveAction}
                className="px-4 py-2 text-sm font-medium text-destructive bg-transparent border border-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20"
              >
                Remove Tooltip
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCloseAction}
              className="px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!tooltipText.trim()}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? "Update Tooltip" : "Apply Tooltip"}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onCloseAction}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
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
