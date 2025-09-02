import { Info, Lightbulb, MessageSquareWarning, OctagonAlert, TriangleAlert } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import "../../callout.css";

export type CalloutType = "info" | "warning" | "caution" | "important" | "tip";

const calloutTypes: Record<
  CalloutType,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    description: string;
  }
> = {
  info: {
    icon: Info,
    label: "Note",
    description: "General information and notes",
  },
  warning: {
    icon: TriangleAlert,
    label: "Warning",
    description: "Important warnings and alerts",
  },
  caution: {
    icon: OctagonAlert,
    label: "Caution",
    description: "Critical safety information",
  },
  important: {
    icon: MessageSquareWarning,
    label: "Important",
    description: "Essential information to remember",
  },
  tip: {
    icon: Lightbulb,
    label: "Tip",
    description: "Helpful tips and suggestions",
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
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onCloseAction();
    }
  }

  return ReactDOM.createPortal(
    <div className="callout-modal-overlay" onClick={handleBackdropClick} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="callout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="callout-modal-header">{modalTitle}</div>

        <div className="callout-modal-content">
          <label className="callout-modal-label">Select callout type:</label>
          <div className="callout-type-options">
            {Object.entries(calloutTypes).map(([type, config]) => {
              const IconComponent = config.icon;
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type as CalloutType)}
                  className={`callout-type-option ${isSelected ? "selected" : ""}`}
                >
                  <div className="callout-type-option-icon">
                    <IconComponent />
                  </div>
                  <div className="callout-type-option-content">
                    <div className="callout-type-option-name">{config.label}</div>
                    <div className="callout-type-option-description">{config.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="callout-modal-footer">
          <button type="button" onClick={onCloseAction} className="callout-modal-button cancel">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="callout-modal-button primary">
            Apply
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
