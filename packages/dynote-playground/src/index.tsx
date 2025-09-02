/* @refresh reload */
import { DynoteEditor } from '@dynote/editor';

function App() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="p-8 max-w-4xl mx-auto">
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
