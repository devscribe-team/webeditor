"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_CARD_ICON, resolveInlineIcon } from "../card";

interface IconEditModalProps {
  open: boolean;
  initialIcon?: string | null;
  initialSize?: number | null;
  onCloseAction: () => void;
  onSubmitAction: (values: { icon: string; size?: number }) => void;
  modalTitle?: string;
  iconLabel?: string;
  iconPlaceholder?: string;
  sizeLabel?: string;
  sizePlaceholder?: string;
  showSize?: boolean;
}

export const IconEditModal: React.FC<IconEditModalProps> = ({
  open,
  initialIcon = "",
  initialSize = 20,
  onCloseAction,
  onSubmitAction,
  modalTitle = "Edit Icon",
  iconLabel = "Icon",
  iconPlaceholder = "e.g. FileText, Book, Star",
  sizeLabel = "Size",
  sizePlaceholder = "e.g. 16, 20, 24, 32",
  showSize = false,
}) => {
  const [icon, setIcon] = useState(initialIcon ?? "");
  const [size, setSize] = useState((initialSize ?? 20).toString());
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setIcon(initialIcon ?? "");
      setSize((initialSize ?? 20).toString());
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open, initialIcon, initialSize]);

  if (!isVisible) return null;

  // Show a live preview of the icon
  const iconPreview = resolveInlineIcon(icon || DEFAULT_CARD_ICON, {
    size: parseInt(size) || 20,
    showIcon: true,
    fallbackIcon: DEFAULT_CARD_ICON,
  });

  const isValidIcon = icon && icon.trim().length > 0;
  const isValidSize = !showSize || (size && !isNaN(parseInt(size)) && parseInt(size) >= 8 && parseInt(size) <= 128);
  const canSubmit = isValidIcon && isValidSize;

  function handleSubmit() {
    if (!canSubmit) return;

    const result: { icon: string; size?: number } = { icon: icon.trim() };
    if (showSize) {
      result.size = parseInt(size);
    }
    onSubmitAction(result);
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
          <h2 className="text-lg font-semibold text-foreground">{modalTitle}</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="icon-input" className="text-sm font-medium text-foreground">
              {iconLabel}
            </Label>
            <Input
              id="icon-input"
              value={icon}
              autoFocus
              onChange={(e) => setIcon(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-background border-border focus:border-primary focus:ring-primary/20"
              placeholder={iconPlaceholder}
              spellCheck={false}
              autoComplete="off"
              data-testid="icon-input"
            />
            {!isValidIcon && icon.length > 0 && <p className="text-xs text-destructive">Icon name cannot be empty.</p>}
          </div>

          {showSize && (
            <div className="space-y-2">
              <Label htmlFor="size-input" className="text-sm font-medium text-foreground">
                {sizeLabel}
              </Label>
              <Input
                id="size-input"
                type="number"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-background border-border focus:border-primary focus:ring-primary/20"
                placeholder={sizePlaceholder}
                spellCheck={false}
                autoComplete="off"
                data-testid="size-input"
                min="8"
                max="128"
              />
              {!isValidSize && size.length > 0 && (
                <p className="text-xs text-destructive">Size must be between 8 and 128 pixels.</p>
              )}
            </div>
          )}

          {/* Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Preview</Label>
            <div className="flex items-center gap-3 p-3 bg-accent/30 rounded-md border border-border">
              <div className="flex items-center justify-center">{iconPreview}</div>
              <span className="text-sm text-muted-foreground">
                {icon || "No icon selected"}
                {showSize && ` (${size}px)`}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
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
            disabled={!canSubmit}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
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
};
