import { createRoot } from "react-dom/client";
import "./index.css";
import { DynoteEditor } from "@dynote/editor";

function App() {
  return (
    <div>
      Playground goes here
      <DynoteEditor />
    </div>
  );
}

function start() {
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
