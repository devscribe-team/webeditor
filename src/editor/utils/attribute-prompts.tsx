import React from "react";

// Types for different attribute input types
export type AttributeFieldType = "text" | "number" | "boolean" | "url";

export interface AttributeField {
  name: string;
  label: string;
  type: AttributeFieldType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  placeholder?: string;
  required?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validation?: (value: any) => string | null;
}

export interface AttributePromptConfig {
  title: string;
  description?: string;
  fields: AttributeField[];
}

export interface AttributePromptResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// Modal component
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// The stable, top-level dialog component
export function AttributePromptDialog({
  isOpen,
  config,
  values,
  errors,
  onChange,
  onSubmit,
  onClose,
}: {
  isOpen: boolean;
  config: AttributePromptConfig | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: Record<string, any>;
  errors: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (fieldName: string, value: any) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  if (!isOpen || !config) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
    // Only submit on Enter if not in a textarea and not composing
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement) && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form
        className="flex flex-col gap-0"
        onKeyDown={handleKeyDown}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-2 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{config.title}</h2>
          {config.description && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{config.description}</p>}
        </div>
        {/* Content */}
        <div className="px-6 py-4 flex flex-col gap-4 attribute-prompt-modal">
          {config.fields.map((field, index) => (
            <AttributeFieldInput
              key={field.name}
              field={field}
              value={values[field.name]}
              error={errors[field.name]}
              onChange={(value) => onChange(field.name, value)}
              autoFocus={index === 0}
            />
          ))}
        </div>
        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-700">
          <button
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition cursor-pointer"
            type="submit"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Field input renderer
function AttributeFieldInput({
  field,
  value,
  error,
  onChange,
  autoFocus,
}: {
  field: AttributeField;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
  autoFocus?: boolean;
}) {
  let input = null;
  const baseInput =
    "block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition";
  switch (field.type) {
    case "text":
    case "url":
      input = (
        <input
          id={field.name}
          type={field.type === "url" ? "url" : "text"}
          value={value || ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInput} ${error ? "border-red-500" : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"}`}
          autoFocus={autoFocus}
          onKeyDown={(e) => e.stopPropagation()}
        />
      );
      break;
    case "number":
      input = (
        <input
          id={field.name}
          type="number"
          value={value || ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : "")}
          className={`${baseInput} ${error ? "border-red-500" : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"}`}
          autoFocus={autoFocus}
          onKeyDown={(e) => e.stopPropagation()}
        />
      );
      break;
    case "boolean":
      input = (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            id={field.name}
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="rounded border-zinc-300 dark:border-zinc-700 text-primary focus:ring-primary/40"
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-200">{field.label}</span>
        </label>
      );
      break;
    default:
      input = (
        <input
          id={field.name}
          value={value || ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseInput} ${error ? "border-red-500" : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"}`}
          autoFocus={autoFocus}
          onKeyDown={(e) => e.stopPropagation()}
        />
      );
  }
  return (
    <div className="flex flex-col gap-1">
      {field.type !== "boolean" && (
        <label htmlFor={field.name} className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {input}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// Helper for formatting attributes for insertion
export function formatAttributesForInsertion(
  componentName: string,
  attributes: AttributePromptResult,
  selfClosing: boolean = true,
): string {
  const formattedAttrs = Object.entries(attributes)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, value]) => {
      if (typeof value === "boolean") return true;
      return value !== "" && value !== null && value !== undefined;
    })
    .map(([key, value]) => {
      if (typeof value === "boolean") {
        return value ? key : "";
      }
      if (typeof value === "string") {
        return `${key}="${value}"`;
      }
      return `${key}={${JSON.stringify(value)}}`;
    })
    .filter((attr) => attr !== "")
    .join(" ");

  const tag = `${componentName}${formattedAttrs ? ` ${formattedAttrs}` : ""}`;
  return selfClosing ? `<${tag} />` : `<${tag}></${componentName}>`;
}

// Example config object (reuse your existing one)
export const COMPONENT_ATTRIBUTES = {
  card: {
    title: "Create Card",
    description: "Configure your card component",
    fields: [
      {
        name: "title",
        label: "Title",
        type: "text" as AttributeFieldType,
        defaultValue: "Card Title",
        placeholder: "Enter card title",
        required: true,
        validation: (value: string) => {
          if (value.length > 100) return "Title must be less than 100 characters";
          return null;
        },
      },
      {
        name: "description",
        label: "Description",
        type: "text" as AttributeFieldType,
        defaultValue: "Card description",
        placeholder: "Enter card description",
        required: true,
        validation: (value: string) => {
          if (value.length > 300) return "Description must be less than 300 characters";
          return null;
        },
      },
      {
        name: "icon",
        label: "Icon",
        type: "text" as AttributeFieldType,
        placeholder: "e.g., Settings, User, FileText",
      },
      {
        name: "horizontal",
        label: "Horizontal layout",
        type: "boolean" as AttributeFieldType,
        defaultValue: false,
      },
      {
        name: "showIcon",
        label: "Show icon",
        type: "boolean" as AttributeFieldType,
        defaultValue: true,
      },
      {
        name: "href",
        label: "Link URL",
        type: "url" as AttributeFieldType,
        placeholder: "https://example.com",
        validation: (value: string) => {
          if (!value) return null;
          try {
            new URL(value);
            return null;
          } catch {
            return "Please enter a valid URL";
          }
        },
      },
    ] satisfies AttributeField[],
  } satisfies AttributePromptConfig,
  break: {
    title: "Create Break",
    description: "Configure your break spacing",
    fields: [
      {
        name: "size",
        label: "Size (pixels)",
        type: "number" as AttributeFieldType,
        defaultValue: 24,
        placeholder: "24",
        required: true,
        validation: (value: number) => {
          if (value < 1) return "Size must be at least 1px";
          if (value > 200) return "Size must be less than 200px";
          return null;
        },
      },
    ] satisfies AttributeField[],
  } satisfies AttributePromptConfig,
  callout: {
    title: "Create Callout",
    description: "Choose the type of callout",
    fields: [
      {
        name: "type",
        label: "Type",
        type: "text" as AttributeFieldType,
        defaultValue: "info",
        placeholder: "info, warning, caution, important, tip",
        required: true,
        validation: (value: string) => {
          const allowed = ["info", "warning", "caution", "important", "tip"];
          if (!allowed.includes(value)) return "Must be one of: info, warning, caution, important, tip";
          return null;
        },
      },
    ] satisfies AttributeField[],
  } satisfies AttributePromptConfig,
  tooltip: {
    title: "Create Tooltip",
    description: "Add a tooltip to inline text",
    fields: [
      {
        name: "tip",
        label: "Tooltip Text",
        type: "text" as AttributeFieldType,
        defaultValue: "Tooltip text",
        placeholder: "Enter tooltip text",
        required: true,
        validation: (value: string) => (value.length === 0 ? "Tooltip text is required" : null),
      },
      {
        name: "text",
        label: "Inline Text",
        type: "text" as AttributeFieldType,
        defaultValue: "Inline text",
        placeholder: "Text to show in the editor",
        required: true,
        validation: (value: string) => (value.length === 0 ? "Inline text is required" : null),
      },
    ],
  } satisfies AttributePromptConfig,

  step: {
    title: "Create Step",
    description: "Add a step to your steps container",
    fields: [
      {
        name: "title",
        label: "Step Title",
        type: "text" as AttributeFieldType,
        defaultValue: "Step title",
        placeholder: "Step title",
        required: false,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validation: (value: string) => null,
      },
    ],
  } satisfies AttributePromptConfig,
  accordion: {
    title: "Create Accordion",
    description: "Add an accordion section",
    fields: [
      {
        name: "title",
        label: "Title",
        type: "text" as AttributeFieldType,
        defaultValue: "Accordion Title",
        required: true,
        validation: (value: string) => (value.length === 0 ? "Title is required" : null),
      },
      {
        name: "description",
        label: "Description",
        type: "text" as AttributeFieldType,
        defaultValue: "Accordion description",
        placeholder: "Accordion description",
        required: false,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validation: (value: string) => null,
      },
      {
        name: "icon",
        label: "Icon",
        type: "text" as AttributeFieldType,
        defaultValue: "ChevronDown",
        placeholder: "Icon name (optional)",
        required: false,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validation: (value: string) => null,
      },
      {
        name: "showIcon",
        label: "Show Icon",
        type: "boolean" as AttributeFieldType,
        defaultValue: true,
        required: false,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validation: (value: boolean) => null,
      },
      {
        name: "defaultOpen",
        label: "Open by Default",
        type: "boolean" as AttributeFieldType,
        defaultValue: false,
        required: false,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validation: (value: boolean) => null,
      },
    ],
  } satisfies AttributePromptConfig,
  columns: {
    title: "Create Columns",
    description: "Create a responsive columns/grid layout",
    fields: [
      {
        name: "cols",
        label: "Number of Columns",
        type: "number" as AttributeFieldType,
        defaultValue: 2,
        placeholder: "1-4",
        required: true,
        validation: (value: number) => {
          if (value < 1 || value > 4) return "Must be between 1 and 4";
          return null;
        },
      },
      {
        name: "gap",
        label: "Gap Size",
        type: "text" as AttributeFieldType,
        defaultValue: "md",
        placeholder: "sm, md, or lg",
        required: true,
        validation: (value: string) => {
          if (!["sm", "md", "lg"].includes(value)) return "Must be sm, md, or lg";
          return null;
        },
      },
    ],
  } satisfies AttributePromptConfig,
  icon: {
    title: "Create Icon",
    description: "Insert an icon from Lucide icons",
    fields: [
      {
        name: "name",
        label: "Icon Name",
        type: "text" as AttributeFieldType,
        defaultValue: "FileText",
        placeholder: "e.g. FileText, Book, Star, Heart",
        required: true,
        validation: (value: string) => (value.length === 0 ? "Icon name is required" : null),
      },
      {
        name: "size",
        label: "Size (pixels)",
        type: "number" as AttributeFieldType,
        defaultValue: 20,
        placeholder: "e.g. 16, 20, 24, 32",
        required: true,
        validation: (value: number) => {
          if (value < 0 || value > 128) return "Size must be between 0 and 128 pixels";
          return null;
        },
      },
    ],
  } satisfies AttributePromptConfig,
  field: {
    title: "Create Parameter Field",
    description: "Document a parameter with name, type, and description",
    fields: [
      {
        name: "name",
        label: "Parameter Name",
        type: "text" as AttributeFieldType,
        defaultValue: "",
        placeholder: "e.g. userId, callback, options",
        required: true,
        validation: (value: string) => (value.length === 0 ? "Parameter name is required" : null),
      },
      {
        name: "type",
        label: "Type",
        type: "text" as AttributeFieldType,
        defaultValue: "string",
        placeholder: "e.g. string, number, boolean, object",
        required: true,
        validation: (value: string) => (value.length === 0 ? "Type is required" : null),
      },
      {
        name: "required",
        label: "Required parameter",
        type: "boolean" as AttributeFieldType,
        defaultValue: false,
      },
    ],
  } satisfies AttributePromptConfig,
  frame: {
    title: "Create Frame",
    description: "Add a frame with padding and optional caption",
    fields: [
      {
        name: "caption",
        label: "Caption (optional)",
        type: "text" as AttributeFieldType,
        defaultValue: "",
        placeholder: "Add a caption for this frame",
        required: false,
      },
      {
        name: "padding",
        label: "Padding Size",
        type: "text" as AttributeFieldType,
        defaultValue: "md",
        placeholder: "sm, md, lg, xl",
        required: true,
        validation: (value: string) => {
          if (!["sm", "md", "lg", "xl"].includes(value)) return "Must be sm, md, lg, or xl";
          return null;
        },
      },
    ],
  } satisfies AttributePromptConfig,
  // ...other component configs...
};
