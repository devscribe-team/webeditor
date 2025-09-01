import React, { createContext, useContext } from "react";

/**
 * Context to provide the editor's editable state to all child components.
 * Defaults to true (editable) if not provided.
 */
const EditorEditableContext = createContext<boolean>(true);

/**
 * Hook to access the editor's editable state.
 */
export const useEditorEditable = () => useContext(EditorEditableContext);

/**
 * Provider component to wrap editor content and propagate the editable state.
 */
export const EditorEditableProvider: React.FC<{
  editable: boolean;
  children: React.ReactNode;
}> = ({ editable, children }) => (
  <EditorEditableContext.Provider value={editable}>{children}</EditorEditableContext.Provider>
);
