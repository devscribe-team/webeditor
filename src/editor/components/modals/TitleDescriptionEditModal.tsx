"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Props for TitleDescriptionEditModal
 */
interface TitleDescriptionEditModalProps {
  open: boolean;
  initialTitle: string;
  initialDescription?: string;
  onCloseAction: () => void;
  onSubmitAction: (values: { title: string; description?: string }) => void;
  titleLabel?: string;
  descriptionLabel?: string;
  modalTitle?: string;
  showDescription?: boolean;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
}

export function TitleDescriptionEditModal({
  open,
  initialTitle,
  initialDescription,
  onCloseAction,
  onSubmitAction,
  titleLabel = "Title",
  descriptionLabel = "Description",
  modalTitle = "Edit",
  showDescription = false,
  titlePlaceholder = "Title",
  descriptionPlaceholder = "Description",
}: TitleDescriptionEditModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle, open]);

  useEffect(() => {
    setDescription(initialDescription ?? "");
  }, [initialDescription, open]);

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
    onSubmitAction({ title: title.trim(), description: description.trim() });
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
            <Label htmlFor="edit-title-input" className="text-sm font-medium text-foreground">
              {titleLabel}
            </Label>
            <Input
              id="edit-title-input"
              value={title}
              autoFocus
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-background border-border focus:border-primary focus:ring-primary/20"
              placeholder={titlePlaceholder}
              spellCheck={false}
            />
          </div>

          {showDescription && (
            <div className="space-y-2">
              <Label htmlFor="edit-description-input" className="text-sm font-medium text-foreground">
                {descriptionLabel}
              </Label>
              <Input
                id="edit-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-background border-border focus:border-primary focus:ring-primary/20"
                placeholder={descriptionPlaceholder}
                spellCheck={false}
              />
            </div>
          )}
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
            disabled={!title.trim()}
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
}
