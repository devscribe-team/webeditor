/* @refresh reload */
import { WebEditor, useTheme } from '@devscribe/webeditor';

function App() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const getThemeLabel = () => {
    if (theme === 'auto') return `🔄 Auto (${resolvedTheme === 'dark' ? '🌙' : '☀️'})`;
    if (theme === 'dark') return '🌙 Dark';
    return '☀️ Light';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dynote Editor Playground</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Theme:</span>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-1 text-sm transition-colors ${
                  theme === 'light'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1 text-sm transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                🌙 Dark
              </button>
              <button
                onClick={() => setTheme('auto')}
                className={`px-3 py-1 text-sm transition-colors ${
                  theme === 'auto'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                🔄 Auto
              </button>
            </div>
          </div>
        </div>
        <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Theme Detection:</strong> The editor automatically detects your browser's theme preference.
            Current mode: <span className="font-mono">{getThemeLabel()}</span>
            {theme === 'auto' && (
              <span className="block mt-1">
                Try changing your system theme to see it update automatically!
              </span>
            )}
          </p>
        </div>
        <WebEditor />
      </div>
    </div>
  );
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@devscribe/webeditor/styles';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
