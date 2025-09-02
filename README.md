# @devscribe/webeditor

A completely dynamic, JSX-based rich text editor powered by [ProseMirror](https://prosemirror.net/).

The alternative to BlockNote and TipTap you've been waiting for.

## Features

- Write Markdown and JSX seamlessly.
- Add custom nestable components.
- Add components with a commands (/) menu.
- Apply marks to text with a marks (/) menu.
- Automatic theme detection with light/dark mode support.

## Usage

### Basic Editor

```tsx
import { WebEditor } from '@devscribe/webeditor';
import '@devscribe/webeditor/styles';

function App() {
  return <WebEditor />;
}
```

### Theme Management

The editor automatically detects and applies your browser's preferred theme. You can also manually control the theme:

```tsx
import { DynoteEditor, useTheme } from '@dynote/editor';
import '@dynote/editor/styles';

function App() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div>
      <div className="theme-controls">
        <button onClick={() => setTheme('light')}>Light</button>
        <button onClick={() => setTheme('dark')}>Dark</button>
        <button onClick={() => setTheme('auto')}>Auto</button>
        <span>Current: {theme} (resolved: {resolvedTheme})</span>
      </div>
      <WebEditor />
    </div>
  );
}
```

The theme system:
- **Auto mode**: Automatically follows your system's dark/light preference
- **Light/Dark mode**: Forces a specific theme
- **Persistent**: Your theme choice is saved to localStorage
- **Reactive**: Automatically updates when system preference changes (in auto mode)
