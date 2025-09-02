import { marked } from "marked";

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

const renderer = new marked.Renderer();

renderer.code = (code: string, lang?: string) => {
  if (lang?.includes("#")) {
    const [language, title] = lang.split("#");
    return `<pre><code title="${escapeHtml(title)}" language="${escapeHtml(language)}">${code}</code></pre>`;
  }

  if (lang) {
    return `<pre><code language="${escapeHtml(lang)}">${code}</code></pre>`;
  }

  return `<pre><code>${code}</code></pre>`;
};

export function preprocessMarkdownToHTML(markdown: string): string {
  markdown = markdown.trim();

  // Remove gray matter
  markdown = markdown.replace(/^---[\s\S]*?---\n?/m, "");

  return marked.parse(markdown, { renderer }) as string;
}
