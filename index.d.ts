import * as react_jsx_runtime0 from "react/jsx-runtime";

//#region src/editor/index.d.ts
declare function WebEditor(props: {
  value?: string;
  editable?: boolean;
  onChange?: (doc: string) => void;
}): react_jsx_runtime0.JSX.Element;
//#endregion
//#region src/hooks/use-theme.d.ts
type Theme = 'light' | 'dark' | 'auto';
declare function useTheme(): {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};
//#endregion
export { type Theme, WebEditor, useTheme };