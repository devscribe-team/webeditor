"use client";

import {
  AlertCircle,
  AlignLeft,
  ArrowUpFromDot,
  Code,
  Columns,
  CreditCard,
  FileText,
  Frame,
  Hash,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListCollapse,
  Minus,
  Network,
  Quote,
  Sparkles,
} from "lucide-react";
import { COMPONENT_ATTRIBUTES } from "./attribute-prompts";

// Enhanced command types
export interface SimpleCommand {
  id: string;
  name: string;
  description: string;
  icon: typeof Hash;
  write: string;
}

export interface AttributeCommand {
  id: string;
  name: string;
  description: string;
  icon: typeof Hash;
  componentName: keyof typeof COMPONENT_ATTRIBUTES;
  requiresAttributes: true;
}

export interface ComponentCommand {
  id: string;
  name: string;
  description: string;
  icon: typeof Hash;
  componentName: string;
}

export type Command = SimpleCommand | AttributeCommand | ComponentCommand;

export interface CommandSeparator {
  separator: true;
}

export type CommandItem = Command | CommandSeparator;

// Enhanced command menu setup with attribute-based commands
export const commandMenuSetup: CommandItem[] = [
  { id: "h1", name: "Heading 1", icon: Heading1, description: "Big section heading", write: "# " },
  { id: "h2", name: "Heading 2", icon: Heading2, description: "Medium section heading", write: "## " },
  { id: "h3", name: "Heading 3", icon: Heading3, description: "Small section heading", write: "### " },
  { id: "paragraph", name: "Text", icon: AlignLeft, description: "Just start writing with plain text", write: "" },
  { id: "bullet", name: "Bulleted list", icon: List, description: "Create a simple bulleted list", write: "- " },
  {
    id: "code",
    name: "Code",
    icon: Code,
    description: "Capture a code snippet",
    componentName: "code_snippet",
  },
  {
    id: "mermaid",
    name: "Mermaid",
    icon: Network,
    description: "Create a mermaid diagram",
    componentName: "mermaid",
  },
  { id: "quote", name: "Quote", icon: Quote, description: "Capture a quote", write: "> " },
  { separator: true },

  // Attribute-based components
  {
    id: "card",
    name: "Card",
    icon: CreditCard,
    description: "Create a horizontal or vertical card",
    componentName: "card",
  },
  {
    id: "break",
    name: "Break",
    icon: Minus,
    description: "Add spacing between content",
    componentName: "break",
  },
  {
    id: "callout",
    name: "Callout",
    icon: AlertCircle,
    description: "Add a callout (info, warning, caution, etc.)",
    componentName: "callout",
  },
  {
    id: "step",
    name: "Step",
    icon: ArrowUpFromDot,
    description: "Create a step",
    componentName: "step",
  },
  {
    id: "accordion",
    name: "Accordion",
    icon: ListCollapse,
    description: "Add an accordion section",
    componentName: "accordion",
  },
  {
    id: "columns",
    name: "Columns",
    icon: Columns,
    description: "Create a responsive columns/grid layout",
    componentName: "columns",
  },
  {
    id: "icon",
    name: "Icon",
    icon: Sparkles,
    description: "Insert an icon from Lucide icons",
    componentName: "icon",
  },
  {
    id: "tabs",
    name: "Tabs",
    icon: List,
    description: "Create a tabbed interface",
    componentName: "tabs",
  },
  {
    id: "field",
    name: "Parameter Field",
    icon: FileText,
    description: "Document a parameter with name, type, and description",
    componentName: "field",
  },
  {
    id: "frame",
    name: "Frame",
    icon: Frame,
    description: "Add a frame with padding and optional caption",
    componentName: "frame",
  },
  {
    id: "badge",
    name: "Badge",
    icon: Hash,
    description: "Add a badge with custom text and styling",
    componentName: "badge",
  },
  // Add more components as they're created
];

// There is no more useAttributePrompt or promptForAttributes here.
// Instead, you should manage the dialog state in your main editor component
// and call handleCommand with the attributes when the user submits the dialog.

// The rest of this file (helper functions, types, etc.) remains unchanged.

// Helper function to check if a command requires attributes
export function isAttributeCommand(command: Command): command is AttributeCommand {
  return "requiresAttributes" in command && command.requiresAttributes === true;
}

// Helper function to check if a command is a component command
export function isComponentCommand(command: Command): command is ComponentCommand {
  return "componentName" in command && !("requiresAttributes" in command);
}

// Helper function to get all simple commands
export function getSimpleCommands(): SimpleCommand[] {
  return commandMenuSetup.filter(
    (item): item is SimpleCommand =>
      !("separator" in item) && !("requiresAttributes" in item) && !("componentName" in item),
  );
}

// Helper function to get all attribute commands
export function getAttributeCommands(): AttributeCommand[] {
  return commandMenuSetup.filter(
    (item): item is AttributeCommand => !("separator" in item) && "requiresAttributes" in item,
  );
}

// Helper function to get all component commands
export function getComponentCommands(): ComponentCommand[] {
  return commandMenuSetup.filter(
    (item): item is ComponentCommand =>
      !("separator" in item) && "componentName" in item && !("requiresAttributes" in item),
  );
}

// Helper function to filter commands by search term
export function filterCommands(searchTerm: string): CommandItem[] {
  if (!searchTerm.trim()) {
    return commandMenuSetup;
  }

  const lowerSearch = searchTerm.toLowerCase();

  const filteredCommands = commandMenuSetup.filter((item) => {
    if ("separator" in item) return false;

    const command = item as Command;
    return (
      command.name.toLowerCase().includes(lowerSearch) ||
      command.description.toLowerCase().includes(lowerSearch) ||
      command.id.toLowerCase().includes(lowerSearch)
    );
  });

  return filteredCommands;
}
