import { createRoot } from "react-dom/client";
import "./index.css";

function App() {
  return (
    <div>
      Playground goes here
      <button>
        Button
      </button>
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
