/* @refresh reload */
import { DynoteEditor } from '@dynote/editor';

function App() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <DynoteEditor />
    </div>
  );
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@dynote/editor/styles';
import '@dynote/editor/tailwind';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
