# @devscribe-team/webeditor [![npm](https://img.shields.io/npm/v/%40devscribe-team%2Fwebeditor)](https://www.npmjs.com/package/@devscribe-team/webeditor) [![mit license](https://img.shields.io/github/license/devscribe-team/webeditor)](https://opensource.org/licenses/MIT) [![Deploy Playground](https://img.shields.io/website?url=https%3A%2F%2Fdevscribe-team.github.io%2Fwebeditor%2F&label=Playground)](https://devscribe-team.github.io/webeditor/)

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
import { WebEditor } from "@devscribe-team/webeditor";
import "@devscribe-team/webeditor/styles";

function App() {
	return <WebEditor />;
}
```

### Theme Management

The editor automatically detects and applies your browser's preferred theme. You can also manually control the theme:

```tsx
import { WebEditor, useTheme } from "@devscribe-team/webeditor";
import "@devscribe-team/webeditor/styles";

function App() {
	const { theme, resolvedTheme, setTheme } = useTheme();

	return (
		<div>
			<div className="theme-controls">
				<button onClick={() => setTheme("light")}>Light</button>
				<button onClick={() => setTheme("dark")}>Dark</button>
				<button onClick={() => setTheme("auto")}>Auto</button>
				<span>
					Current: {theme} (resolved: {resolvedTheme})
				</span>
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

## Contributors

The work on the project started from [Devscribe](https://www.devscribeai.com/) and was thankfully able to be open sourced thanks to their support.

Here are the contributors who may not have proper attributions due to git history rewrites:

- Darryl James Cruz ([@darryljamescruz](https://github.com/darryljamescruz))
- Sam Solano ([@samsolano](https://github.com/samsolano))

Thank you!
