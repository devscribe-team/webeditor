/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Common icon names from Lucide React for use with Card component
 * These are string identifiers that map to Lucide React icons
 */

import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";

// Type for card icon prop - accepts any Lucide icon name
export type CardIconName = string;

// Default icon used when no icon is provided or icon is not found
export const DEFAULT_CARD_ICON = "FileText" as const;

// Cache for loaded icons to avoid re-importing
const iconCache = new Map<string, React.ComponentType<any>>();

/**
 * Normalizes icon name to match Lucide's PascalCase convention
 */
function normalizeIconName(iconName: string): string {
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
async function loadIcon(iconName: string): Promise<React.ComponentType<any> | null> {
  const normalizedName = normalizeIconName(iconName);

  // Check cache first (using normalized name)
  if (iconCache.has(normalizedName)) {
    return iconCache.get(normalizedName)!;
  }

  try {
    const mod = await import("lucide-react");
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

  if (isLoading) {
    // Show a minimal loading state
    return <div className={`${size} animate-pulse bg-muted rounded`} />;
  }

  if (!IconComponent) {
    // Ultimate fallback to statically imported FileText
    return <FileText className={`${size} text-muted-foreground`} />;
  }

  return <IconComponent className={`${size} text-muted-foreground`} />;
}

/**
 * Shared icon resolution utility used by Card, Accordion, and other components
 * Handles string-based icon names, ReactNode icons, fallbacks, and error handling
 */
export function resolveIcon(
  icon: ReactNode | CardIconName | undefined,
  options: {
    size?: string; // CSS class for icon size (e.g., "w-8 h-8")
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
 * Usage examples:
 *
 * // Using predefined icon names (loaded dynamically)
 * <Card title="Settings" description="Configure your app" icon="Settings" />
 * <Card title="Profile" description="User information" icon="User" />
 *
 * // Using custom ReactNode icon
 * <Card title="Custom" description="With custom icon" icon={<MyCustomIcon />} />
 *
 * // Hide icon completely
 * <Card title="No Icon" description="Card without icon" showIcon={false} />
 *
 * // Icon will fallback to default (FileText) if string not found
 * <Card title="Fallback" description="Unknown icon name" icon="NonExistentIcon" />
 */
