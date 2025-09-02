/* @refresh reload */
import { DynoteEditor, useTheme } from '@dynote/editor';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dynote Editor Playground</h1>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'} Mode
          </button>
        </div>
        <DynoteEditor />
      </div>
    </div>
  );
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@dynote/editor/styles';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
