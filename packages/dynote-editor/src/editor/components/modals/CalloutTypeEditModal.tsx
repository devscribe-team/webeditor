import { Info, Lightbulb, MessageSquareWarning, OctagonAlert, TriangleAlert } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

export type CalloutType = "info" | "warning" | "caution" | "important" | "tip";

const calloutTypes: Record<
  CalloutType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
    iconColor: string;
  }
> = {
  info: {
    icon: Info,
    label: "Note",
    description: "General information and notes",
    iconColor: "text-blue-600",
  },
  warning: {
    icon: TriangleAlert,
    label: "Warning",
    description: "Important warnings and alerts",
    iconColor: "text-yellow-600",
  },
  caution: {
    icon: OctagonAlert,
    label: "Caution",
    description: "Critical safety information",
    iconColor: "text-red-600",
  },
  important: {
    icon: MessageSquareWarning,
    label: "Important",
    description: "Essential information to remember",
    iconColor: "text-violet-600",
  },
  tip: {
    icon: Lightbulb,
    label: "Tip",
    description: "Helpful tips and suggestions",
    iconColor: "text-green-600",
  },
};

interface CalloutTypeEditModalProps {
  open: boolean;
  initialType: CalloutType;
  onCloseAction: () => void;
  onSubmitAction: (type: CalloutType) => void;
  modalTitle?: string;
}

export function CalloutTypeEditModal({
  open,
  initialType,
  onCloseAction,
  onSubmitAction,
  modalTitle = "Change Callout Type",
}: CalloutTypeEditModalProps) {
  const [selectedType, setSelectedType] = useState<CalloutType>(initialType);

  useEffect(() => {
    if (open) {
      setSelectedType(initialType);
    }
  }, [initialType, open]);

  const calloutTypeEntries = Object.entries(calloutTypes) as [CalloutType, typeof calloutTypes[CalloutType]][];

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    const currentIndex = calloutTypeEntries.findIndex(([type]) => type === selectedType);

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % calloutTypeEntries.length;
      setSelectedType(calloutTypeEntries[nextIndex][0]);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = currentIndex === 0 ? calloutTypeEntries.length - 1 : currentIndex - 1;
      setSelectedType(calloutTypeEntries[prevIndex][0]);
    }
  };

  if (!open) return null;

  function handleSubmit() {
    onSubmitAction(selectedType);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onCloseAction();
    } else {
      handleKeyNavigation(e);
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onCloseAction();
    }
  }

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-card rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="px-6 py-4 border-b border-border">
          <h2 id="modal-title" className="text-lg font-semibold text-card-foreground">
            {modalTitle}
          </h2>
        </div>

        <div className="px-6 py-4">
          <label id="callout-type-label" className="block text-sm font-medium text-muted-foreground mb-3">
            Select callout type:
          </label>
          <div className="space-y-2" role="radiogroup" aria-labelledby="callout-type-label">
            {calloutTypeEntries.map(([type, config]) => {
              const IconComponent = config.icon;
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type as CalloutType)}
                  role="radio"
                  aria-checked={isSelected}
                  className={`w-full flex items-center p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    isSelected
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border hover:border-muted-foreground hover:bg-accent text-card-foreground"
                  }`}
                >
                  <div className="flex-shrink-0 mr-3">
                    <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-sm text-muted-foreground">{config.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCloseAction}
            className="px-4 py-2 text-sm font-medium text-secondary-foreground bg-secondary border border-border rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
          >
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
