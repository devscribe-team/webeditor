"use client";

import { NodeViewComponentProps } from "@handlewithcare/react-prosemirror";
import { useEditorEditable } from "../editorEditableContext";
import { InputRule } from "prosemirror-inputrules";
import { NodeSpec } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useState, useEffect, type ReactNode } from "react";
import { FileText, RotateCcw } from "lucide-react";
import { TitleDescriptionEditModal } from "./modals/TitleDescriptionEditModal";
import { IconEditModal } from "./modals/IconEditModal";
import { useEditorEventCallback } from "@handlewithcare/react-prosemirror";

// Type for card icon prop - accepts any Lucide icon name
export type CardIconName = string;

// Default icon used when no icon is provided or icon is not found
export const DEFAULT_CARD_ICON = "FileText" as const;

// Cache for loaded icons to avoid re-importing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconCache = new Map<string, React.ComponentType<any>>();

/**
 * Normalizes icon name to match Lucide's PascalCase convention
 */
export function normalizeIconName(iconName: string): string {
  return (
    iconName
      // Convert kebab-case and snake_case to PascalCase
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("")
      // Handle camelCase input
      .replace(/^[a-z]/, (char) => char.toUpperCase())
  );
}

/**
 * Dynamically loads an icon from lucide-react
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadIcon(iconName: string): Promise<React.ComponentType<any> | null> {
  const normalizedName = normalizeIconName(iconName);

  // Check cache first (using normalized name)
  if (iconCache.has(normalizedName)) {
    return iconCache.get(normalizedName)!;
  }

  try {
    const mod = await import("lucide-react");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (mod as any)[normalizedName];

    if (IconComponent) {
      iconCache.set(normalizedName, IconComponent);
      return IconComponent;
    } else {
      console.warn(`Icon "${iconName}" (normalized to "${normalizedName}") not found in Lucide icons.`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to load icon "${iconName}":`, error);
    return null;
  }
}

/**
 * Dynamic Icon Component that loads icons asynchronously
 */
function DynamicIcon({
  iconName,
  size = "w-5 h-5",
  fallbackIcon = DEFAULT_CARD_ICON,
}: {
  iconName: string;
  size?: string;
  fallbackIcon?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [IconComponent, setIconComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadIconComponent() {
      setIsLoading(true);

      const component = await loadIcon(iconName);

      if (!isMounted) return;

      if (component) {
        setIconComponent(() => component);
      } else {
        // Load fallback icon
        const fallbackComponent = await loadIcon(fallbackIcon);
        if (isMounted && fallbackComponent) {
          setIconComponent(() => fallbackComponent);
        }
      }

      setIsLoading(false);
    }

    loadIconComponent();

    return () => {
      isMounted = false;
    };
  }, [iconName, fallbackIcon]);

  // Extract pixel size from className or use default
  const getPixelSize = (sizeClass: string): { width: number; height: number } => {
    const match = sizeClass.match(/w-\[(\d+)px\].*h-\[(\d+)px\]/);
    if (match) {
      return { width: parseInt(match[1]), height: parseInt(match[2]) };
    }
    // Default size mapping for Tailwind classes
    const sizeMap: Record<string, number> = {
      "w-4 h-4": 16,
      "w-5 h-5": 20,
      "w-6 h-6": 24,
      "w-8 h-8": 32,
    };
    return { width: sizeMap[size] || 20, height: sizeMap[size] || 20 };
  };

  const pixelSize = getPixelSize(size);

  if (isLoading) {
    // Show a minimal loading state
    return (
      <span
        className="inline-block animate-pulse bg-muted rounded"
        style={{ width: pixelSize.width, height: pixelSize.height }}
      />
    );
  }

  if (!IconComponent) {
    // Ultimate fallback to statically imported FileText
    return <FileText className="text-muted-foreground" width={pixelSize.width} height={pixelSize.height} />;
  }

  return <IconComponent className="text-muted-foreground" width={pixelSize.width} height={pixelSize.height} />;
}

/**
 * Icon resolution utility
 */
export function resolveIcon(
  icon: ReactNode | CardIconName | undefined,
  options: {
    size?: string;
    showIcon?: boolean;
    fallbackIcon?: string;
  } = {},
): ReactNode {
  const { size = "w-5 h-5", showIcon = true, fallbackIcon = DEFAULT_CARD_ICON } = options;

  if (!showIcon) return null;

  // If icon is a string, use dynamic loading
  if (typeof icon === "string") {
    return <DynamicIcon iconName={icon} size={size} fallbackIcon={fallbackIcon} />;
  }

  // If icon is a ReactNode, use it directly with size wrapper
  if (icon) {
    return <div className={`${size} text-muted-foreground`}>{icon}</div>;
  }

  // Default icon when no icon is provided
  return <FileText className={`${size} text-muted-foreground`} />;
}

/**
 * Inline icon resolution utility for inline components
 */
export function resolveInlineIcon(
  icon: ReactNode | CardIconName | undefined,
  options: {
    size?: string | number;
    showIcon?: boolean;
    fallbackIcon?: string;
  } = {},
): ReactNode {
  const { size = 20, showIcon = true, fallbackIcon = DEFAULT_CARD_ICON } = options;

  if (!showIcon) return null;

  // Convert size to proper format
  const sizeClass = typeof size === "number" ? `w-[${size}px] h-[${size}px]` : size;
  const sizeStyle = typeof size === "number" ? { width: `${size}px`, height: `${size}px` } : {};

  // If icon is a string, use dynamic loading
  if (typeof icon === "string") {
    return <DynamicIcon iconName={icon} size={sizeClass} fallbackIcon={fallbackIcon} />;
  }

  // If icon is a ReactNode, use it directly with span wrapper for inline context
  if (icon) {
    return (
      <span className={`${sizeClass} text-muted-foreground`} style={sizeStyle}>
        {icon}
      </span>
    );
  }

  // Default icon when no icon is provided
  const pixelSize = typeof size === "number" ? size : 20;
  return <FileText className="text-muted-foreground" width={pixelSize} height={pixelSize} />;
}

export const cardNodeSpec: NodeSpec = {
  group: "block",
  content: "block*",
  attrs: {
    title: { default: "Card Title" },
    icon: { default: null },
    showIcon: { default: true },
    horizontal: { default: false },
    href: { default: null },
  },
  selectable: true,

  parseDOM: [
    {
      tag: "card",
      getAttrs: (dom) => ({
        title: dom.getAttribute("title") || "Card Title",
        icon: dom.getAttribute("icon") || null,
        showIcon: dom.getAttribute("show-icon") !== "false",
        horizontal: dom.getAttribute("horizontal") === "true",
        href: dom.getAttribute("href") || null,
      }),
    },
  ],

  toDOM: (node) => [
    "card",
    {
      title: node.attrs.title,
      icon: node.attrs.icon,
      "show-icon": node.attrs.showIcon.toString(),
      horizontal: node.attrs.horizontal.toString(),
      href: node.attrs.href,
    },
    0,
  ],
};

// Sub-component for card content (title, children)
function CardContent({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex-1 min-w-0">
      <h6 contentEditable={false} className="mb-2 text-card-foreground text-lg sm:text-xl font-semibold break-words">
        {title}
      </h6>
      <div className="text-card-foreground [&>*]:mb-4 [&>*:last-child]:mb-0">{children}</div>
    </div>
  );
}

// Horizontal layout renderer
function HorizontalLayout({
  iconElement,
  title,
  children,
}: {
  iconElement: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 sm:p-4">
      {iconElement && <div className="flex-shrink-0 mt-0.5 self-start">{iconElement}</div>}
      <CardContent title={title}>{children}</CardContent>
    </div>
  );
}

// Vertical layout renderer
function VerticalLayout({
  iconElement,
  title,
  children,
}: {
  iconElement: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <>
      {/* Icon section */}
      {iconElement && <div className="p-3 sm:p-4 pb-0">{iconElement}</div>}

      {/* Content section */}
      <div className="p-3 sm:p-4">
        <CardContent title={title}>{children}</CardContent>
      </div>
    </>
  );
}

// Styling utilities
const getCardClasses = (horizontal: boolean, isClickable: boolean) => {
  const baseClasses = `relative flex ${horizontal ? "flex-col sm:flex-row" : "flex-col"} border border-border bg-background shadow-sm rounded-lg w-full text-card-foreground h-fit overflow-hidden mb-2`;

  const hoverClasses = isClickable
    ? "cursor-pointer transition-transform duration-300 ease-out hover:shadow-lg hover:scale-[1.01] hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary"
    : "";

  return `${baseClasses} ${hoverClasses}`;
};

export const CardNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Card(
  { nodeProps, ...props },
  ref,
) {
  const title = nodeProps.node.attrs.title || "Card Title";
  const icon = nodeProps.node.attrs.icon;
  const showIcon = nodeProps.node.attrs.showIcon ?? true;
  const horizontal = nodeProps.node.attrs.horizontal ?? false;
  const href = nodeProps.node.attrs.href;

  const iconElement = resolveIcon(icon, {
    size: horizontal ? "w-5 h-5" : "w-8 h-8",
    showIcon,
  });

  const isClickable = Boolean(href);
  const cardClasses = getCardClasses(horizontal, isClickable);

  // Modal state for editing
  const [modalOpen, setModalOpen] = useState(false);
  const [editField, setEditField] = useState<"title" | "icon" | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  // Get editable state from context
  const editable = useEditorEditable();

  // Separate update callbacks for title and icon
  const updateTitle = useEditorEventCallback(
    (view, newTitle: string) => {
      const { getPos, node } = nodeProps;
      if (typeof getPos !== "function") {
        // eslint-disable-next-line no-console
        console.error("getPos is not a function");
        return;
      }
      const pos = getPos();
      if (typeof pos !== "number") {
        // eslint-disable-next-line no-console
        console.error("getPos did not return a number");
        return;
      }
      const tr = view.state.tr;
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        title: newTitle,
      });
      view.dispatch(tr);
      setModalOpen(false);
      setEditField(null);
    },
    // @ts-expect-error nodeProps is unknown
    [nodeProps],
  );

  // Handler to update icon attribute
  const updateIconInternal = useEditorEventCallback(
    (view, { icon: newIcon }: { icon: string; size?: number }) => {
      const { getPos, node } = nodeProps;
      if (typeof getPos !== "function") {
        // eslint-disable-next-line no-console
        console.error("getPos is not a function");
        return;
      }
      const pos = getPos();
      if (typeof pos !== "number") {
        // eslint-disable-next-line no-console
        console.error("getPos did not return a number");
        return;
      }
      const tr = view.state.tr;
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        icon: newIcon,
      });
      view.dispatch(tr);
      setModalOpen(false);
      setEditField(null);
    },
    // @ts-expect-error nodeProps is unknown
    [nodeProps],
  );

  const updateIcon = ({ icon, size }: { icon: string; size?: number }) => {
    updateIconInternal({ icon, size });
  };

  // Handler to toggle horizontal/vertical layout
  const toggleLayout = useEditorEventCallback(
    (view) => {
      const { getPos, node } = nodeProps;
      if (typeof getPos !== "function") {
        console.error("getPos is not a function");
        return;
      }
      const pos = getPos();
      if (typeof pos !== "number") {
        console.error("getPos did not return a number");
        return;
      }
      const tr = view.state.tr;
      tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        horizontal: !node.attrs.horizontal,
      });
      view.dispatch(tr);
    }
  );

  // Render content based on layout, with separately editable title/icon
  const iconClickable = editable ? (
    <span
      className="cursor-pointer"
      tabIndex={0}
      aria-disabled={false}
      onClick={(e) => {
        e.stopPropagation();
        setModalOpen(true);
        setEditField("icon");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          setModalOpen(true);
          setEditField("icon");
        }
      }}
    >
      {iconElement}
    </span>
  ) : (
    <span>{iconElement}</span>
  );

  const cardContent = horizontal ? (
    <HorizontalLayout
      iconElement={iconClickable}
      // @ts-expect-error title is unknown
      title={
        editable ? (
          <span
            className="cursor-pointer"
            tabIndex={0}
            aria-disabled={false}
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
              setEditField("title");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                setModalOpen(true);
                setEditField("title");
              }
            }}
          >
            {title}
          </span>
        ) : (
          <span>{title}</span>
        )
      }
    >
      <div {...props} ref={ref} />
    </HorizontalLayout>
  ) : (
    <VerticalLayout
      iconElement={iconClickable}
      // @ts-expect-error title is unknown
      title={
        editable ? (
          <span
            className="cursor-pointer"
            tabIndex={0}
            aria-disabled={false}
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
              setEditField("title");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                setModalOpen(true);
                setEditField("title");
              }
            }}
          >
            {title}
          </span>
        ) : (
          <span>{title}</span>
        )
      }
    >
      <div {...props} ref={ref} />
    </VerticalLayout>
  );

  return (
    <div className={cardClasses} onMouseEnter={() => setShowOptions(true)} onMouseLeave={() => setShowOptions(false)}>
      {/* Top-right hover options */}
      {editable && (
        <div
          className={`absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-200 ${
            showOptions ? "opacity-100" : "opacity-0 pointer-events-none"
          } z-20 bg-black/10 rounded-lg px-2 py-1 shadow-lg`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLayout();
            }}
            className="flex items-center outline-none select-none hover:cursor-pointer gap-1 bg-zinc-800/60 text-white/80 rounded px-2 py-0.5 hover:bg-zinc-700/60 transition-colors text-xs font-mono"
            title={horizontal ? "Switch to vertical layout" : "Switch to horizontal layout"}
            contentEditable={false}
          >
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            <span>{horizontal ? "Vertical" : "Horizontal"}</span>
          </button>
        </div>
      )}
      <TitleDescriptionEditModal
        open={editable && modalOpen && editField === "title"}
        initialTitle={title}
        onCloseAction={() => {
          setModalOpen(false);
          setEditField(null);
        }}
        onSubmitAction={({ title }) => updateTitle(title)}
        titleLabel="Title"
        modalTitle="Edit Card Title"
        showDescription={false}
        titlePlaceholder="Card title"
      />

      <IconEditModal
        open={editable && modalOpen && editField === "icon"}
        initialIcon={icon}
        onCloseAction={() => {
          setModalOpen(false);
          setEditField(null);
        }}
        onSubmitAction={updateIcon}
        modalTitle="Edit Card Icon"
        iconLabel="Icon"
        iconPlaceholder="e.g. FileText, Book, Star"
      />
      {isClickable && (
        <a
          href={href}
          className="absolute inset-0 z-10"
          target="_blank"
          rel="noopener noreferrer"
          contentEditable={false}
        >
          <span className="sr-only">Open {title}</span>
        </a>
      )}
      {cardContent}
    </div>
  );
});

export const addCardRule = new InputRule(/^<card(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
  const { tr, schema } = state;

  // Default attributes
  const attrs = {
    title: "Card Title",
    icon: null,
    showIcon: true,
    horizontal: false,
    href: null,
  };

  // Parse attributes if they exist
  if (match[1]) {
    const attrString = match[1];

    // Parse title="..." attribute
    const titleMatch = attrString.match(/title="([^"]*)"/);
    if (titleMatch) attrs.title = titleMatch[1];

    // Parse icon="..." attribute
    const iconMatch = attrString.match(/icon="([^"]*)"/);
    // @ts-expect-error attrs.icon is unknown
    if (iconMatch) attrs.icon = iconMatch[1];

    // Parse href="..." attribute
    const hrefMatch = attrString.match(/href="([^"]*)"/);
    // @ts-expect-error attrs.href is unknown
    if (hrefMatch) attrs.href = hrefMatch[1];

    // Parse boolean attributes
    attrs.horizontal = /horizontal(?:=true|\s|$)/.test(attrString);
    attrs.showIcon = !/showIcon=false/.test(attrString); // Default true unless explicitly false
  }

  const card = schema.nodes.card.create(attrs, schema.nodes.paragraph.create());

  tr.replaceRangeWith(start, end, card);

  const newPos = start + 1;
  tr.setSelection(Selection.near(tr.doc.resolve(newPos)));

  return tr;
});

export function insertCard(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    title: "Card Title",
    icon: null,
    showIcon: true,
    horizontal: false,
    href: null,
  };

  const card = state.schema.nodes.card.create(attrs, state.schema.nodes.paragraph.create());

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(card);

  // Position cursor inside the card content
  const insertPos = tr.selection.from;
  const innerPos = insertPos + 1;
  tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));

  return tr;
}
