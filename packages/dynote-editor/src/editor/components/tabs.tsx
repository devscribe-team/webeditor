import { type NodeViewComponentProps, useEditorEventCallback } from "@handlewithcare/react-prosemirror";
import { Plus, X } from "lucide-react";
import { InputRule } from "prosemirror-inputrules";
import { Fragment, type NodeSpec } from "prosemirror-model";
import { Selection, EditorState, Transaction } from "prosemirror-state";
import React, { useState } from "react";
import { useEditorEditable } from "../editorEditableContext";
import { TitleDescriptionEditModal } from "./modals/TitleDescriptionEditModal";

export const tabsNodeSpec: NodeSpec = {
  group: "block",
  content: "block+",

  attrs: {
    tabNames: { default: ["Tab 1"] },
    activeTab: { default: 0 },
    tabContents: { default: {} as Record<number, unknown> },
  },

  defining: true,
  selectable: true,

  parseDOM: [
    {
      tag: "tabs",
      getAttrs: (dom) => {
        const el = dom as HTMLElement;

        // Try to get attributes from element attributes first
        let tabNames = JSON.parse(el.getAttribute("tabNames") || "[]");
        let activeTab = parseInt(el.getAttribute("activeTab") || "0");
        let tabContents = JSON.parse(el.getAttribute("tabContents") || "{}");

        // If no explicit tabNames provided, try to import from child <code-snippet> or <pre><code> nodes
        if (tabNames.length === 0) {
          const elementsToProcess = Array.from(el.querySelectorAll("pre > code"));

          if (elementsToProcess.length > 0) {
            const newTabNames: string[] = [];
            const newTabContents: Record<number, any> = {};

            for (let i = 0; i < elementsToProcess.length; i++) {
              const cs = elementsToProcess[i] as HTMLElement;
              const language = cs.getAttribute("data-language") || cs.getAttribute("language") || "javascript";
              let title = cs.getAttribute("title");
              const content = cs.getAttribute("content") || cs.textContent || "";

              // For pre/code structures, also check the parent pre element for title
              if (!title && cs.tagName.toLowerCase() === "code") {
                const preElement = cs.parentElement;
                if (preElement && preElement.tagName.toLowerCase() === "pre") {
                  title = preElement.getAttribute("title");
                }
              }

              // Create tab name from title or language
              const tabName = title || language.charAt(0).toUpperCase() + language.slice(1);
              newTabNames.push(tabName);

              // Create tab content as a code snippet node for this specific tab
              const tabContent = [
                {
                  type: "code_snippet",
                  attrs: {
                    language: language,
                    title: title || "",
                  },
                  content: content
                    ? [
                        {
                          type: "text",
                          text: content,
                        },
                      ]
                    : [],
                },
              ];

              newTabContents[i] = tabContent;
            }

            tabNames = newTabNames;
            tabContents = newTabContents;
            activeTab = 0;
          }
        }

        // Fallback to default if still empty
        if (tabNames.length === 0) {
          tabNames = ["Tab 1"];
          tabContents = {};
        }

        return {
          tabNames,
          activeTab,
          tabContents,
        };
      },
      getContent: (dom, schema) => {
        const el = dom as HTMLElement;

        // Check if we're importing from pre/code elements
        const elementsToProcess = Array.from(el.querySelectorAll("pre > code"));

        if (elementsToProcess.length > 0) {
          // If we're importing, return content for the first tab only
          const firstElement = elementsToProcess[0] as HTMLElement;
          const language =
            firstElement.getAttribute("data-language") || firstElement.getAttribute("language") || "javascript";
          let title = firstElement.getAttribute("title");
          const content = firstElement.getAttribute("content") || firstElement.textContent || "";

          // For pre/code structures, also check the parent pre element for title
          if (!title && firstElement.tagName.toLowerCase() === "code") {
            const preElement = firstElement.parentElement;
            if (preElement && preElement.tagName.toLowerCase() === "pre") {
              title = preElement.getAttribute("title");
            }
          }

          // Create a code snippet for the first tab
          return Fragment.fromJSON(schema, [
            {
              type: "code_snippet",
              attrs: {
                language: language,
                title: title || "",
              },
              content: content
                ? [
                    {
                      type: "text",
                      text: content,
                    },
                  ]
                : [],
            },
          ]);
        }

        // For normal tabs, return empty paragraph
        return Fragment.fromJSON(schema, [
          {
            type: "paragraph",
          },
        ]);
      },
    },
  ],

  toDOM: (node) => [
    "tabs",
    {
      tabNames: JSON.stringify(node.attrs.tabNames),
      activeTab: JSON.stringify(node.attrs.activeTab),
      tabContents: JSON.stringify(node.attrs.tabContents),
    },
    0,
  ],
};

export const TabsNodeView = React.forwardRef<HTMLDivElement, NodeViewComponentProps>(function Tabs(
  { nodeProps, ...props },
  ref,
) {
  const tabNames: string[] = nodeProps.node.attrs.tabNames ?? ["Tab 1"];
  const activeTab: number = nodeProps.node.attrs.activeTab ?? 0;
  const tabContents: Record<number, unknown> = nodeProps.node.attrs.tabContents ?? {};

  const { node } = nodeProps;
  const editable = useEditorEditable();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);

  const switchTab = useEditorEventCallback((view, newIdx: number) => {
    if (activeTab === newIdx) return;

    const currentContent = node.content.toJSON();
    const updatedTabContents = {
      ...tabContents,
      [activeTab]: currentContent,
    };

    const newTabContent = updatedTabContents[newIdx];

    const tr = view.state.tr;
    tr.setNodeMarkup(nodeProps.getPos(), null, {
      ...node.attrs,
      activeTab: newIdx,
      tabContents: updatedTabContents,
    });

    if (newTabContent) {
      const newFragment = Fragment.fromJSON(node.type.schema, newTabContent);

      tr.replaceWith(nodeProps.getPos() + 1, nodeProps.getPos() + 1 + node.content.size, newFragment);
    } else {
      // Create empty paragraph for new tab
      tr.replaceWith(
        nodeProps.getPos() + 1,
        nodeProps.getPos() + 1 + node.content.size,
        node.type.schema.nodes.paragraph.create(),
      );
    }

    view.dispatch(tr);
  });

  const updateTabName = useEditorEventCallback((view, tabIndex: number, newName: string) => {
    const updatedTabNames = [...tabNames];
    updatedTabNames[tabIndex] = newName;

    const tr = view.state.tr;
    tr.setNodeMarkup(nodeProps.getPos(), null, {
      ...node.attrs,
      tabNames: updatedTabNames,
    });

    view.dispatch(tr);
  });

  const addNewTab = useEditorEventCallback((view) => {
    const newTabIndex = tabNames.length;
    const newTabName = `Tab ${newTabIndex + 1}`;
    const updatedTabNames = [...tabNames, newTabName];

    // Save current tab content before switching
    const currentContent = node.content.toJSON();
    const updatedTabContents = {
      ...tabContents,
      [activeTab]: currentContent,
    };

    const tr = view.state.tr;
    tr.setNodeMarkup(nodeProps.getPos(), null, {
      ...node.attrs,
      tabNames: updatedTabNames,
      activeTab: newTabIndex,
      tabContents: updatedTabContents,
    });

    // Create empty paragraph for the new tab
    tr.replaceWith(
      nodeProps.getPos() + 1,
      nodeProps.getPos() + 1 + node.content.size,
      node.type.schema.nodes.paragraph.create(),
    );

    view.dispatch(tr);
  });

  const deleteTab = useEditorEventCallback((view, tabIndex: number) => {
    // Don't delete if it's the last tab
    if (tabNames.length <= 1) return;

    const updatedTabNames = tabNames.filter((_, index) => index !== tabIndex);
    const updatedTabContents = { ...tabContents };
    delete updatedTabContents[tabIndex];

    // Adjust active tab if needed
    let newActiveTab = activeTab;
    if (tabIndex === activeTab) {
      // If we're deleting the active tab, switch to the previous tab (or first tab)
      newActiveTab = tabIndex > 0 ? tabIndex - 1 : 0;
    } else if (tabIndex < activeTab) {
      // If we're deleting a tab before the active tab, adjust the active tab index
      newActiveTab = activeTab - 1;
    }

    // Reindex tab contents
    const reindexedTabContents: Record<number, unknown> = {};
    Object.entries(updatedTabContents).forEach(([key, value]) => {
      const oldIndex = parseInt(key);
      if (oldIndex < tabIndex) {
        reindexedTabContents[oldIndex] = value;
      } else if (oldIndex > tabIndex) {
        reindexedTabContents[oldIndex - 1] = value;
      }
    });

    const tr = view.state.tr;
    tr.setNodeMarkup(nodeProps.getPos(), null, {
      ...node.attrs,
      tabNames: updatedTabNames,
      activeTab: newActiveTab,
      tabContents: reindexedTabContents,
    });

    // Load content for the new active tab
    const newActiveTabContent = reindexedTabContents[newActiveTab];
    if (newActiveTabContent) {
      const newFragment = Fragment.fromJSON(node.type.schema, newActiveTabContent);
      tr.replaceWith(nodeProps.getPos() + 1, nodeProps.getPos() + 1 + node.content.size, newFragment);
    } else {
      // Create empty paragraph for the new active tab
      tr.replaceWith(
        nodeProps.getPos() + 1,
        nodeProps.getPos() + 1 + node.content.size,
        node.type.schema.nodes.paragraph.create(),
      );
    }

    view.dispatch(tr);
  });

  return (
    <div className="border border-border bg-card shadow-sm rounded-lg mb-2">
      <TitleDescriptionEditModal
        open={modalOpen && editingTabIndex !== null}
        initialTitle={editingTabIndex !== null ? tabNames[editingTabIndex] || "" : ""}
        onCloseAction={() => {
          setModalOpen(false);
          setEditingTabIndex(null);
        }}
        onSubmitAction={({ title }) => {
          if (editingTabIndex !== null) {
            updateTabName(editingTabIndex, title);
          }
          setModalOpen(false);
          setEditingTabIndex(null);
        }}
        titleLabel="Tab Name"
        modalTitle="Edit Tab Name"
        showDescription={false}
        titlePlaceholder="Enter tab name"
      />

      <div className="flex flex-row rounded-t-lg border-b border-border">
        {tabNames.map((tab, i) => {
          const isFirst = i === 0;
          const isActive = i === activeTab;

          return (
            <div
              key={tab}
              className={`
                ${isFirst ? "rounded-tl-lg" : ""}
                ${isActive ? "bg-secondary/60 text-secondary-foreground" : "text-muted-foreground"}
                hover:bg-secondary/60 hover:text-secondary-foreground
                px-4 py-2 border-b-2 border-transparent hover:border-border
                transition-colors duration-100 hover:cursor-pointer
                min-w-0 flex-1
                flex items-center justify-between
              `}
              onClick={() => switchTab(i)}
            >
              <span
                contentEditable={false}
                className={`
                  ${isActive ? "text-white/90" : "text-white/70"}
                  ${editable ? "cursor-pointer hover:cursor-pointer hover:underline" : ""}
                  inline-block font-mono text-sm
                `}
                onClick={(e) => {
                  if (!editable) return;
                  e.stopPropagation();
                  setEditingTabIndex(i);
                  setModalOpen(true);
                }}
                onDoubleClick={(e) => {
                  if (!editable) return;
                  e.stopPropagation();
                  setEditingTabIndex(i);
                  setModalOpen(true);
                }}
              >
                {tab || `Tab ${i + 1}`}
              </span>

              {/* Delete button - only show if there's more than one tab */}
              {tabNames.length > 1 && editable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTab(i);
                  }}
                  className="ml-2 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors duration-100 hover:cursor-pointer"
                  title="Delete tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add new tab button */}
        <button
          type="button"
          onClick={() => addNewTab()}
          className="px-3 py-2 border-b-2 border-transparent text-muted-foreground hover:text-secondary-foreground hover:bg-secondary/60 transition-colors duration-100 hover:cursor-pointer rounded-tr-lg flex items-center justify-center"
          title="Add new tab"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div {...props} className="pt-1 px-4 pb-4 prose prose-sm max-w-none text-card-foreground" ref={ref} />
    </div>
  );
});

export const addTabsRule = new InputRule(/^<tabs\s*\/>/, (state, match, start, end) => {
  const { tr, schema } = state;
  const tabs = schema.nodes.tabs.create({ tabNames: ["Tab 1"] }, schema.nodes.paragraph.create());

  tr.replaceRangeWith(start, end, tabs);

  const newPos = start + 1;
  tr.setSelection(Selection.near(tr.doc.resolve(newPos)));

  return tr;
});

export function insertTabs(state: EditorState): Transaction {
  const { from, to } = state.selection;

  const attrs = {
    tabNames: ["Tab 1"],
    activeTab: 0,
    tabContents: {},
  };

  const tabs = state.schema.nodes.tabs.create(attrs, state.schema.nodes.paragraph.create());

  let tr = state.tr;
  if (from !== to) {
    tr = tr.delete(from, to);
  }
  tr = tr.replaceSelectionWith(tabs);

  // Position cursor inside the tabs content
  const insertPos = tr.selection.from;
  const innerPos = insertPos + 1;
  tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));

  return tr;
}
