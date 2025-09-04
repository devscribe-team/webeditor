import { ProseMirror, ProseMirrorDoc, reactKeys, useEditorEffect, useEditorEventCallback, useStopEvent } from "@handlewithcare/react-prosemirror";
import { baseKeymap } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";
import { DOMParser, DOMSerializer, Fragment, Schema } from "prosemirror-model";
import { EditorState, Plugin, PluginKey, Selection, TextSelection } from "prosemirror-state";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { InputRule, inputRules, textblockTypeInputRule, wrappingInputRule } from "prosemirror-inputrules";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { AlertCircle, AlignLeft, ArrowUpFromDot, Bold, Check, ChevronDown, Code, Columns, Copy, CreditCard, Edit, FileText, Frame, Hash, Heading1, Heading2, Heading3, Info, Italic, Lightbulb, List, ListCollapse, MessageSquareWarning, Minus, Network, OctagonAlert, Plus, Quote, RotateCcw, Sparkles, Square, SquareDashed, Strikethrough, TriangleAlert, X } from "lucide-react";
import ReactDOM from "react-dom";
import { clsx } from "clsx";
import "ms";
import { twMerge } from "tailwind-merge";
import * as LabelPrimitive from "@radix-ui/react-label";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { tokyoNight } from "@uiw/codemirror-theme-tokyo-night";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import CodeMirror, { Prec } from "@uiw/react-codemirror";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { EditorView, keymap as keymap$1 } from "@codemirror/view";
import mermaid from "mermaid";
import { liftListItem, sinkListItem, splitListItem } from "prosemirror-schema-list";
import { schema } from "prosemirror-markdown";
import { marked } from "marked";

//#region src/hooks/use-theme.ts
function useTheme() {
	const [theme, setThemeState] = useState(() => {
		if (typeof window === "undefined") return "auto";
		const savedTheme = localStorage.getItem("webeditor-theme");
		if (savedTheme && (savedTheme === "light" || savedTheme === "dark" || savedTheme === "auto")) return savedTheme;
		return "auto";
	});
	const [resolvedTheme, setResolvedTheme] = useState(() => {
		if (typeof window === "undefined") return "light";
		if (theme === "auto") return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		return theme === "dark" ? "dark" : "light";
	});
	const setTheme = (newTheme) => {
		setThemeState(newTheme);
		if (typeof window !== "undefined") localStorage.setItem("webeditor-theme", newTheme);
	};
	const toggleTheme = () => {
		if (theme === "auto") setTheme("light");
		else if (theme === "light") setTheme("dark");
		else setTheme("auto");
	};
	useEffect(() => {
		if (typeof window === "undefined") return;
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = (e) => {
			if (theme === "auto") setResolvedTheme(e.matches ? "dark" : "light");
		};
		if (theme === "auto") setResolvedTheme(mediaQuery.matches ? "dark" : "light");
		else setResolvedTheme(theme === "dark" ? "dark" : "light");
		if (mediaQuery.addEventListener) mediaQuery.addEventListener("change", handleChange);
		else mediaQuery.addListener(handleChange);
		return () => {
			if (mediaQuery.removeEventListener) mediaQuery.removeEventListener("change", handleChange);
			else mediaQuery.removeListener(handleChange);
		};
	}, [theme]);
	useEffect(() => {
		if (typeof document !== "undefined") {
			const root = document.documentElement;
			root.classList.remove("dark", "light");
			root.classList.add(resolvedTheme);
		}
	}, [resolvedTheme]);
	return {
		theme,
		resolvedTheme,
		setTheme,
		toggleTheme
	};
}

//#endregion
//#region src/editor/editorEditableContext.tsx
/**
* Context to provide the editor's editable state to all child components.
* Defaults to true (editable) if not provided.
*/
const EditorEditableContext = createContext(true);
/**
* Hook to access the editor's editable state.
*/
const useEditorEditable = () => useContext(EditorEditableContext);
/**
* Provider component to wrap editor content and propagate the editable state.
*/
const EditorEditableProvider = ({ editable, children }) => /* @__PURE__ */ jsx(EditorEditableContext.Provider, {
	value: editable,
	children
});

//#endregion
//#region src/components/tags/icons.tsx
const DEFAULT_CARD_ICON$1 = "FileText";
const iconCache$1 = /* @__PURE__ */ new Map();
/**
* Normalizes icon name to match Lucide's PascalCase convention
*/
function normalizeIconName$1(iconName) {
	return iconName.split(/[-_]/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("").replace(/^[a-z]/, (char) => char.toUpperCase());
}
/**
* Dynamically loads an icon from lucide-react
*/
async function loadIcon$1(iconName) {
	const normalizedName = normalizeIconName$1(iconName);
	if (iconCache$1.has(normalizedName)) return iconCache$1.get(normalizedName);
	try {
		const mod = await import("lucide-react");
		const IconComponent = mod[normalizedName];
		if (IconComponent) {
			iconCache$1.set(normalizedName, IconComponent);
			return IconComponent;
		} else {
			console.warn(`Icon "${iconName}" (normalized to "${normalizedName}") not found in Lucide icons.`);
			return null;
		}
	} catch (error) {
		console.error(`Failed to load icon "${iconName}":`, error);
		return null;
	}
}
/**
* Dynamic Icon Component that loads icons asynchronously
*/
function DynamicIcon$1({ iconName, size = "w-5 h-5", fallbackIcon = DEFAULT_CARD_ICON$1 }) {
	const [IconComponent, setIconComponent] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		let isMounted = true;
		async function loadIconComponent() {
			setIsLoading(true);
			const component = await loadIcon$1(iconName);
			if (!isMounted) return;
			if (component) setIconComponent(() => component);
			else {
				const fallbackComponent = await loadIcon$1(fallbackIcon);
				if (isMounted && fallbackComponent) setIconComponent(() => fallbackComponent);
			}
			setIsLoading(false);
		}
		loadIconComponent();
		return () => {
			isMounted = false;
		};
	}, [iconName, fallbackIcon]);
	if (isLoading) return /* @__PURE__ */ jsx("div", { className: `${size} animate-pulse bg-muted rounded` });
	if (!IconComponent) return /* @__PURE__ */ jsx(FileText, { className: `${size} text-muted-foreground` });
	return /* @__PURE__ */ jsx(IconComponent, { className: `${size} text-muted-foreground` });
}
/**
* Shared icon resolution utility used by Card, Accordion, and other components
* Handles string-based icon names, ReactNode icons, fallbacks, and error handling
*/
function resolveIcon$1(icon, options = {}) {
	const { size = "w-5 h-5", showIcon = true, fallbackIcon = DEFAULT_CARD_ICON$1 } = options;
	if (!showIcon) return null;
	if (typeof icon === "string") return /* @__PURE__ */ jsx(DynamicIcon$1, {
		iconName: icon,
		size,
		fallbackIcon
	});
	if (icon) return /* @__PURE__ */ jsx("div", {
		className: `${size} text-muted-foreground`,
		children: icon
	});
	return /* @__PURE__ */ jsx(FileText, { className: `${size} text-muted-foreground` });
}
/**
* Usage examples:
*
* // Using predefined icon names (loaded dynamically)
* <Card title="Settings" description="Configure your app" icon="Settings" />
* <Card title="Profile" description="User information" icon="User" />
*
* // Using custom ReactNode icon
* <Card title="Custom" description="With custom icon" icon={<MyCustomIcon />} />
*
* // Hide icon completely
* <Card title="No Icon" description="Card without icon" showIcon={false} />
*
* // Icon will fallback to default (FileText) if string not found
* <Card title="Fallback" description="Unknown icon name" icon="NonExistentIcon" />
*/

//#endregion
//#region src/lib/utils.ts
function cn(...inputs) {
	return twMerge(clsx(inputs));
}

//#endregion
//#region src/components/ui/input.tsx
function Input({ className, type,...props }) {
	return /* @__PURE__ */ jsx("input", {
		type,
		"data-slot": "input",
		className: cn("file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]", "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", className),
		...props
	});
}

//#endregion
//#region src/components/ui/label.tsx
function Label({ className,...props }) {
	return /* @__PURE__ */ jsx(LabelPrimitive.Root, {
		"data-slot": "label",
		className: cn("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50", className),
		...props
	});
}

//#endregion
//#region src/editor/components/modals/TitleDescriptionEditModal.tsx
function TitleDescriptionEditModal({ open, initialTitle, initialDescription, onCloseAction, onSubmitAction, titleLabel = "Title", descriptionLabel = "Description", modalTitle = "Edit", showDescription = false, titlePlaceholder = "Title", descriptionPlaceholder = "Description" }) {
	const [title, setTitle] = useState(initialTitle);
	const [description, setDescription] = useState(initialDescription ?? "");
	const [isVisible, setIsVisible] = useState(false);
	useEffect(() => {
		setTitle(initialTitle);
	}, [initialTitle, open]);
	useEffect(() => {
		setDescription(initialDescription ?? "");
	}, [initialDescription, open]);
	useEffect(() => {
		if (open) setIsVisible(true);
		else {
			const timer = setTimeout(() => setIsVisible(false), 200);
			return () => clearTimeout(timer);
		}
	}, [open]);
	if (!isVisible) return null;
	function handleSubmit() {
		onSubmitAction({
			title: title.trim(),
			description: description.trim()
		});
	}
	function handleKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCloseAction();
		}
	}
	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) onCloseAction();
	}
	return ReactDOM.createPortal(/* @__PURE__ */ jsx("div", {
		className: `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`,
		onClick: handleBackdropClick,
		onKeyDown: handleKeyDown,
		tabIndex: -1,
		children: /* @__PURE__ */ jsxs("div", {
			className: `relative bg-background border border-border shadow-2xl rounded-lg min-w-[400px] max-w-[90vw] w-full mx-4 transform transition-all duration-200 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "px-6 py-4 border-b border-border",
					children: /* @__PURE__ */ jsx("h2", {
						className: "text-lg font-semibold text-foreground",
						children: modalTitle
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "px-6 py-4 space-y-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "edit-title-input",
							className: "text-sm font-medium text-foreground",
							children: titleLabel
						}), /* @__PURE__ */ jsx(Input, {
							id: "edit-title-input",
							value: title,
							autoFocus: true,
							onChange: (e) => setTitle(e.target.value),
							onKeyDown: handleKeyDown,
							className: "w-full bg-background border-border focus:border-primary focus:ring-primary/20",
							placeholder: titlePlaceholder,
							spellCheck: false
						})]
					}), showDescription && /* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "edit-description-input",
							className: "text-sm font-medium text-foreground",
							children: descriptionLabel
						}), /* @__PURE__ */ jsx(Input, {
							id: "edit-description-input",
							value: description,
							onChange: (e) => setDescription(e.target.value),
							onKeyDown: handleKeyDown,
							className: "w-full bg-background border-border focus:border-primary focus:ring-primary/20",
							placeholder: descriptionPlaceholder,
							spellCheck: false
						})]
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "px-6 py-4 border-t border-border flex justify-end gap-3",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: onCloseAction,
						className: "px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
						children: "Cancel"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: handleSubmit,
						disabled: !title.trim(),
						className: "px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed",
						children: "Save"
					})]
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: onCloseAction,
					className: "absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded",
					"aria-label": "Close modal",
					children: /* @__PURE__ */ jsx("svg", {
						className: "w-4 h-4",
						fill: "none",
						stroke: "currentColor",
						viewBox: "0 0 24 24",
						children: /* @__PURE__ */ jsx("path", {
							strokeLinecap: "round",
							strokeLinejoin: "round",
							strokeWidth: 2,
							d: "M6 18L18 6M6 6l12 12"
						})
					})
				})
			]
		})
	}), document.body);
}

//#endregion
//#region src/editor/components/accordion.tsx
const accordionNodeSpec = {
	group: "block",
	content: "block+",
	attrs: {
		title: { default: "" },
		description: { default: "" },
		icon: { default: null },
		showIcon: { default: true },
		defaultOpen: { default: false }
	},
	selectable: true,
	parseDOM: [{
		tag: "accordion",
		getAttrs: (dom) => ({
			title: dom.getAttribute("title") || "",
			description: dom.getAttribute("description") || "",
			icon: dom.getAttribute("icon") || null,
			showIcon: dom.getAttribute("show-icon") !== "false",
			defaultOpen: dom.getAttribute("default-open") === "true"
		})
	}],
	toDOM: (node) => [
		"accordion",
		{
			title: node.attrs.title,
			description: node.attrs.description,
			icon: node.attrs.icon,
			"show-icon": node.attrs.showIcon?.toString(),
			"default-open": node.attrs.defaultOpen?.toString()
		},
		0
	]
};
const AccordionNodeView = React.forwardRef(function Accordion({ nodeProps,...props }, ref) {
	const [isOpen, setIsOpen] = useState(nodeProps.node.attrs.defaultOpen ?? false);
	const [modalOpen, setModalOpen] = useState(false);
	const [editField, setEditField] = useState(null);
	const title = nodeProps.node.attrs.title || "";
	const description = nodeProps.node.attrs.description || "";
	const icon = nodeProps.node.attrs.icon;
	const showIcon = nodeProps.node.attrs.showIcon ?? true;
	const iconElement = resolveIcon$1?.(icon, {
		size: "w-5 h-5",
		showIcon
	});
	const editable = useEditorEditable();
	const updateTitle = useEditorEventCallback((view, newTitle) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			title: newTitle
		});
		view.dispatch(tr);
		setModalOpen(false);
		setEditField(null);
	}, [nodeProps]);
	const updateDescription = useEditorEventCallback((view, newDescription) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			description: newDescription
		});
		view.dispatch(tr);
		setModalOpen(false);
		setEditField(null);
	}, [nodeProps]);
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: "border border-border bg-card shadow-sm rounded-lg mb-2",
		children: [
			/* @__PURE__ */ jsx(TitleDescriptionEditModal, {
				open: modalOpen && editField === "title",
				initialTitle: title,
				onCloseAction: () => {
					setModalOpen(false);
					setEditField(null);
				},
				onSubmitAction: ({ title: title$1 }) => updateTitle(title$1),
				titleLabel: "Title",
				modalTitle: "Edit Accordion Title",
				showDescription: false,
				titlePlaceholder: "Accordion title"
			}),
			/* @__PURE__ */ jsx(TitleDescriptionEditModal, {
				open: modalOpen && editField === "description",
				initialTitle: description,
				onCloseAction: () => {
					setModalOpen(false);
					setEditField(null);
				},
				onSubmitAction: ({ title: title$1 }) => updateDescription(title$1),
				titleLabel: "Description",
				modalTitle: "Edit Accordion Description",
				showDescription: false,
				titlePlaceholder: "Accordion description"
			}),
			/* @__PURE__ */ jsxs("button", {
				onClick: () => setIsOpen((open) => !open),
				className: `w-full px-4 py-4 text-left flex items-center justify-between hover:bg-accent transition-colors hover:cursor-pointer ${isOpen ? "rounded-t-lg" : "rounded-lg"}`,
				"aria-expanded": isOpen,
				"aria-controls": `accordion-content-${title.replace(/\s+/g, "-").toLowerCase()}`,
				type: "button",
				tabIndex: 0,
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-3",
					children: [iconElement && /* @__PURE__ */ jsx("div", {
						className: "flex-shrink-0",
						children: iconElement
					}), /* @__PURE__ */ jsx("div", {
						className: "flex-1",
						children: /* @__PURE__ */ jsx("h3", {
							contentEditable: false,
							className: `text-lg font-semibold text-foreground ${editable ? "cursor-pointer hover:cursor-pointer" : ""}`,
							onClick: (e) => {
								if (!editable) return;
								e.stopPropagation();
								setModalOpen(true);
								setEditField("title");
							},
							tabIndex: editable ? 0 : -1,
							onKeyDown: (e) => {
								if (!editable) return;
								if (e.key === "Enter" || e.key === " ") {
									e.stopPropagation();
									setModalOpen(true);
									setEditField("title");
								}
							},
							"aria-disabled": !editable,
							children: title
						})
					})]
				}), /* @__PURE__ */ jsx(ChevronDown, { className: `w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}` })]
			}),
			isOpen && /* @__PURE__ */ jsxs("div", {
				id: `accordion-content-${title.replace(/\s+/g, "-").toLowerCase()}`,
				className: "px-4 pb-4 border-t border-border",
				children: [description && /* @__PURE__ */ jsx("p", {
					contentEditable: false,
					className: `text-sm text-muted-foreground pt-4 pb-2 ${editable ? "cursor-pointer hover:cursor-pointer underline decoration-dotted underline-offset-2" : ""}`,
					tabIndex: editable ? 0 : -1,
					onClick: (e) => {
						if (!editable) return;
						e.stopPropagation();
						setModalOpen(true);
						setEditField("description");
					},
					onKeyDown: (e) => {
						if (!editable) return;
						if (e.key === "Enter" || e.key === " ") {
							e.stopPropagation();
							setModalOpen(true);
							setEditField("description");
						}
					},
					"aria-disabled": !editable,
					children: description
				}), /* @__PURE__ */ jsx("div", {
					className: "pt-2 prose prose-sm max-w-none text-foreground",
					children: /* @__PURE__ */ jsx("div", { ...props })
				})]
			})
		]
	});
});
const addAccordionRule = new InputRule(/^<accordion(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	const attrs = {
		title: "",
		description: "",
		icon: null,
		showIcon: true,
		defaultOpen: false
	};
	if (match[1]) {
		const titleMatch = match[1].match(/title="([^"]*)"/);
		if (titleMatch) attrs.title = titleMatch[1];
		const descMatch = match[1].match(/description="([^"]*)"/);
		if (descMatch) attrs.description = descMatch[1];
		const iconMatch = match[1].match(/icon="([^"]*)"/);
		if (iconMatch) attrs.icon = iconMatch[1];
		attrs.showIcon = !/showIcon=false/.test(match[1]);
		attrs.defaultOpen = /defaultOpen(?:=true|\s|$)/.test(match[1]);
	}
	const accordion = schema$2.nodes.accordion.create(attrs, schema$2.nodes.paragraph.create());
	tr.replaceRangeWith(start, end, accordion);
	const newPos = start + 1;
	tr.setSelection(tr.selection.constructor.near(tr.doc.resolve(newPos)));
	return tr;
});
function insertAccordion(state) {
	const { from, to } = state.selection;
	const attrs = {
		title: "Accordion Title",
		description: "",
		icon: null,
		showIcon: true,
		defaultOpen: false
	};
	const accordion = state.schema.nodes.accordion.create(attrs, state.schema.nodes.paragraph.create());
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(accordion);
	const insertPos = tr.selection.from;
	const innerPos = insertPos + 1;
	tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
	return tr;
}

//#endregion
//#region src/editor/components/badge.tsx
const badgeNodeSpec = {
	group: "inline",
	inline: true,
	atom: true,
	selectable: true,
	attrs: {
		variant: { default: "default" },
		label: { default: "" }
	},
	parseDOM: [{
		tag: "badge",
		getAttrs: (dom) => ({
			variant: dom.getAttribute("variant") || "default",
			label: dom.textContent || ""
		})
	}],
	toDOM: (node) => [
		"badge",
		{
			variant: node.attrs.variant,
			class: badgeClassName(node.attrs.variant)
		},
		node.attrs.label
	]
};
function BadgeEditModal({ open, initialLabel, initialVariant, onCloseAction, onSubmitAction, modalTitle = "Edit Badge" }) {
	const [label, setLabel] = useState(initialLabel);
	const [variant, setVariant] = useState(initialVariant);
	const [isVisible, setIsVisible] = useState(false);
	useEffect(() => {
		if (open) {
			setLabel(initialLabel);
			setVariant(initialVariant);
			setIsVisible(true);
		} else {
			const timer = setTimeout(() => setIsVisible(false), 200);
			return () => clearTimeout(timer);
		}
	}, [
		open,
		initialLabel,
		initialVariant
	]);
	if (!isVisible) return null;
	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmitAction({
			label: label.trim(),
			variant
		});
	};
	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCloseAction();
		}
	};
	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) onCloseAction();
	};
	const variantOptions = [
		{
			value: "default",
			label: "Default (Primary)",
			color: "bg-primary text-primary-foreground"
		},
		{
			value: "secondary",
			label: "Secondary",
			color: "bg-secondary text-secondary-foreground"
		},
		{
			value: "destructive",
			label: "Destructive",
			color: "bg-destructive text-white"
		},
		{
			value: "outline",
			label: "Outline",
			color: "border text-foreground bg-background"
		}
	];
	return ReactDOM.createPortal(/* @__PURE__ */ jsx("div", {
		className: `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`,
		onClick: handleBackdropClick,
		onKeyDown: handleKeyDown,
		tabIndex: -1,
		children: /* @__PURE__ */ jsxs("div", {
			className: `relative bg-background border border-border shadow-2xl rounded-lg min-w-[400px] max-w-[90vw] w-full mx-4 transform transition-all duration-200 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "px-6 py-4 border-b border-border",
					children: /* @__PURE__ */ jsx("h2", {
						className: "text-lg font-semibold text-foreground",
						children: modalTitle
					})
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: handleSubmit,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "px-6 py-4 space-y-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "badge-label",
								className: "text-sm font-medium text-foreground",
								children: "Badge Text"
							}), /* @__PURE__ */ jsx(Input, {
								id: "badge-label",
								value: label,
								onChange: (e) => setLabel(e.target.value),
								onKeyDown: handleKeyDown,
								className: "w-full bg-background border-border focus:border-primary focus:ring-primary/20",
								placeholder: "Enter badge text",
								autoFocus: true,
								spellCheck: false
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "badge-variant",
								className: "text-sm font-medium text-foreground",
								children: "Badge Style"
							}), /* @__PURE__ */ jsx("div", {
								className: "space-y-2",
								children: variantOptions.map((option) => /* @__PURE__ */ jsxs("label", {
									className: "flex items-center gap-3 p-2 rounded-md border border-border hover:bg-accent hover:cursor-pointer transition-colors",
									children: [/* @__PURE__ */ jsx("input", {
										type: "radio",
										name: "variant",
										value: option.value,
										checked: variant === option.value,
										onChange: (e) => setVariant(e.target.value),
										className: "text-primary focus:ring-primary hover:cursor-pointer"
									}), /* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-2 flex-1",
										children: [/* @__PURE__ */ jsx("span", {
											className: `inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium ${option.color} ${option.value === "outline" ? "border" : "border border-transparent"}`,
											children: label || "Preview"
										}), /* @__PURE__ */ jsx("span", {
											className: "text-sm text-muted-foreground",
											children: option.label
										})]
									})]
								}, option.value))
							})]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "px-6 py-4 border-t border-border flex justify-end gap-3",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: onCloseAction,
							className: "px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer",
							children: "Cancel"
						}), /* @__PURE__ */ jsx("button", {
							type: "submit",
							className: "px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer",
							children: "Save"
						})]
					})]
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: onCloseAction,
					className: "absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded hover:cursor-pointer",
					"aria-label": "Close modal",
					children: /* @__PURE__ */ jsx("svg", {
						className: "w-4 h-4",
						fill: "none",
						stroke: "currentColor",
						viewBox: "0 0 24 24",
						children: /* @__PURE__ */ jsx("path", {
							strokeLinecap: "round",
							strokeLinejoin: "round",
							strokeWidth: 2,
							d: "M6 18L18 6M6 6l12 12"
						})
					})
				})
			]
		})
	}), document.body);
}
function badgeClassName(variant) {
	switch (variant) {
		case "secondary": return "inline-flex items-center justify-center rounded-md border border-transparent bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden";
		case "destructive": return "inline-flex items-center justify-center rounded-md border border-transparent bg-destructive text-white px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden";
		case "outline": return "inline-flex items-center justify-center rounded-md border text-foreground px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden";
		case "default":
		default: return "inline-flex items-center justify-center rounded-md border border-transparent bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 transition-[color,box-shadow] overflow-hidden";
	}
}
const BadgeNodeView = React.forwardRef(function Badge({ nodeProps }, ref) {
	const [modalOpen, setModalOpen] = useState(false);
	const variant = nodeProps.node.attrs.variant || "default";
	const label = nodeProps.node.attrs.label || "";
	const editable = useEditorEditable();
	const updateBadge = useEditorEventCallback((view, { label: newLabel, variant: newVariant }) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			label: newLabel,
			variant: newVariant
		});
		view.dispatch(tr);
		setModalOpen(false);
	});
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(BadgeEditModal, {
		open: modalOpen,
		initialLabel: label,
		initialVariant: variant,
		onCloseAction: () => setModalOpen(false),
		onSubmitAction: updateBadge
	}), /* @__PURE__ */ jsx("span", {
		"data-badge": "",
		"data-variant": variant,
		className: `${badgeClassName(variant)} ${editable ? "cursor-pointer hover:cursor-pointer hover:opacity-80 transition-opacity" : ""}`,
		ref,
		contentEditable: false,
		suppressContentEditableWarning: true,
		onClick: (e) => {
			if (!editable) return;
			e.stopPropagation();
			setModalOpen(true);
		},
		onKeyDown: (e) => {
			if (!editable) return;
			if (e.key === "Enter" || e.key === " ") {
				e.stopPropagation();
				setModalOpen(true);
			}
		},
		tabIndex: editable ? 0 : -1,
		"aria-disabled": !editable,
		"aria-label": editable ? `Edit badge (currently "${label}")` : void 0,
		title: editable ? `Click to edit badge` : void 0,
		children: label || "Badge"
	})] });
});
const addBadgeRule = new InputRule(/^<badge(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	const attrs = {
		variant: "default",
		label: ""
	};
	if (match[1]) {
		const variantMatch = match[1].match(/variant="([^"]*)"/);
		if (variantMatch) attrs.variant = variantMatch[1];
		const labelMatch = match[1].match(/label="([^"]*)"/);
		if (labelMatch) attrs.label = labelMatch[1];
	}
	if (!schema$2.nodes.badge) return null;
	const badgeNode = schema$2.nodes.badge.create(attrs);
	tr.replaceRangeWith(start, end, badgeNode);
	tr.setSelection(Selection.near(tr.doc.resolve(start + badgeNode.nodeSize)));
	return tr;
});
function insertBadge(state) {
	const { from, to } = state.selection;
	const attrs = {
		variant: "default",
		label: "New Badge"
	};
	const badgeNode = state.schema.nodes.badge.create(attrs);
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(badgeNode);
	tr = tr.setSelection(Selection.near(tr.doc.resolve(tr.selection.from + badgeNode.nodeSize)));
	return tr;
}

//#endregion
//#region src/editor/components/break.tsx
const breakNodeSpec = {
	group: "block",
	content: "",
	attrs: { size: { default: 24 } },
	selectable: true,
	atom: true,
	defining: true,
	parseDOM: [{
		tag: "break",
		getAttrs: (dom) => ({ size: parseInt(dom.getAttribute("size") || "24") })
	}],
	toDOM: (node) => ["break", {
		size: node.attrs.size.toString(),
		style: `height: ${node.attrs.size}px; display: block;`
	}]
};
const BreakNodeView = React.forwardRef(function Break({ nodeProps,...props }, ref) {
	const size = nodeProps.node.attrs.size ?? 24;
	const editable = useEditorEditable();
	const [modalOpen, setModalOpen] = useState(false);
	const [inputSize, setInputSize] = useState(size.toString());
	const [isCaretNear, setIsCaretNear] = useState(false);
	const viewRef = useRef(null);
	const checkCaretProximity = useCallback((view) => {
		const { getPos } = nodeProps;
		if (typeof getPos !== "function") return;
		const pos = getPos();
		if (typeof pos !== "number") return;
		const { selection } = view.state;
		const { from, to } = selection;
		const breakStart = pos;
		const breakEnd = pos + nodeProps.node.nodeSize;
		const proximityRange = 10;
		const isDirectlyAdjacent = from === breakStart || from === breakEnd || to === breakStart || to === breakEnd || from >= breakStart - proximityRange && from <= breakEnd + proximityRange || to >= breakStart - proximityRange && to <= breakEnd + proximityRange;
		setIsCaretNear(isDirectlyAdjacent);
	}, [nodeProps]);
	useEditorEffect((view) => {
		viewRef.current = view;
		checkCaretProximity(view);
		return () => {
			viewRef.current = null;
		};
	}, [checkCaretProximity]);
	const updateSize = useEditorEventCallback((view, newSize) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			size: newSize
		});
		view.dispatch(tr);
		setModalOpen(false);
		setTimeout(() => {
			if (viewRef.current) checkCaretProximity(viewRef.current);
		}, 0);
	});
	const handleSubmit = (e) => {
		e.preventDefault();
		const newSize = parseInt(inputSize);
		if (!isNaN(newSize) && newSize > 0 && newSize <= 200) updateSize(newSize);
	};
	const handleClick = () => {
		if (editable) {
			setInputSize(size.toString());
			setModalOpen(true);
		}
	};
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsx(ViewCapture, { checkCaretProximity }),
		/* @__PURE__ */ jsxs("div", {
			ref,
			className: `w-full relative group select-none ${editable ? "cursor-pointer" : ""}`,
			style: {
				height: `${size}px`,
				minHeight: `${size}px`
			},
			contentEditable: false,
			onClick: handleClick,
			...props,
			children: [editable ? /* @__PURE__ */ jsx("div", { className: `absolute top-1/2 left-0 right-0 border-t-2 border-dashed transform -translate-y-1/2 transition-colors ${isCaretNear ? "border-muted-foreground/30" : "border-transparent group-hover:border-muted-foreground/30"}` }) : /* @__PURE__ */ jsx("div", { className: "w-full h-full" }), editable && /* @__PURE__ */ jsxs("div", {
				className: `absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-muted-foreground transition-opacity bg-background px-2 py-1 rounded border shadow-sm whitespace-nowrap ${isCaretNear ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`,
				children: [
					"Break (",
					size,
					"px) - Click to edit"
				]
			})]
		}),
		modalOpen && /* @__PURE__ */ jsx(Fragment$1, { children: ReactDOM.createPortal(/* @__PURE__ */ jsx("div", {
			className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200",
			onClick: () => setModalOpen(false),
			onKeyDown: (e) => {
				if (e.key === "Escape") setModalOpen(false);
			},
			tabIndex: -1,
			children: /* @__PURE__ */ jsxs("div", {
				className: "relative bg-background border border-border shadow-2xl rounded-lg min-w-[400px] max-w-[90vw] w-full mx-4 transform transition-all duration-200",
				onClick: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "px-6 py-4 border-b border-border",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "text-lg font-semibold text-foreground",
							children: "Edit Break Size"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground mt-1",
							children: "Adjust the spacing size in pixels (1-200px)."
						})]
					}),
					/* @__PURE__ */ jsxs("form", {
						onSubmit: handleSubmit,
						children: [/* @__PURE__ */ jsx("div", {
							className: "px-6 py-4 space-y-4",
							children: /* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "size",
									className: "text-sm font-medium text-foreground",
									children: "Size (px)"
								}), /* @__PURE__ */ jsx(Input, {
									id: "size",
									type: "number",
									min: "1",
									max: "200",
									value: inputSize,
									onChange: (e) => setInputSize(e.target.value),
									className: "w-full bg-background border-border focus:border-primary focus:ring-primary/20",
									placeholder: "24",
									autoFocus: true
								})]
							})
						}), /* @__PURE__ */ jsxs("div", {
							className: "px-6 py-4 border-t border-border flex justify-end gap-3",
							children: [/* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => setModalOpen(false),
								className: "px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer",
								children: "Cancel"
							}), /* @__PURE__ */ jsx("button", {
								type: "submit",
								className: "px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer",
								children: "Save"
							})]
						})]
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => setModalOpen(false),
						className: "absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded hover:cursor-pointer",
						"aria-label": "Close modal",
						children: /* @__PURE__ */ jsx("svg", {
							className: "w-4 h-4",
							fill: "none",
							stroke: "currentColor",
							viewBox: "0 0 24 24",
							children: /* @__PURE__ */ jsx("path", {
								strokeLinecap: "round",
								strokeLinejoin: "round",
								strokeWidth: 2,
								d: "M6 18L18 6M6 6l12 12"
							})
						})
					})
				]
			})
		}), document.body) })
	] });
});
function addBreakRule(schema$2) {
	return new InputRule(/^<break(?:\s+size=(\d+))?\s*\/?>$/, (state, match, start, end) => {
		const size = match[1] ? parseInt(match[1]) : 24;
		const tr = state.tr;
		const breakNode = schema$2.nodes.break.create({ size });
		tr.replaceRangeWith(start, end, breakNode);
		const breakEnd = start + breakNode.nodeSize;
		const $pos = tr.doc.resolve(breakEnd);
		if (!$pos.nodeAfter) {
			const paragraph = schema$2.nodes.paragraph.create();
			tr.insert(breakEnd, paragraph);
		}
		const newPos = breakEnd + ($pos.nodeAfter ? 0 : 1);
		tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
		return tr;
	});
}
function ViewCapture({ checkCaretProximity }) {
	useEditorEffect((view) => {
		const originalDispatch = view.dispatch;
		view.dispatch = (tr) => {
			originalDispatch.call(view, tr);
			if (tr.selectionSet || tr.docChanged) setTimeout(() => checkCaretProximity(view), 0);
		};
		return () => {
			view.dispatch = originalDispatch;
		};
	}, [checkCaretProximity]);
	return null;
}
function insertBreak(state) {
	const { from, to } = state.selection;
	const attrs = { size: 24 };
	const breakNode = state.schema.nodes.break.create(attrs);
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(breakNode);
	const insertPos = tr.selection.from;
	const afterPos = insertPos + breakNode.nodeSize;
	const $pos = tr.doc.resolve(afterPos);
	if (!$pos.nodeAfter) {
		const paragraph = state.schema.nodes.paragraph.create();
		tr = tr.insert(afterPos, paragraph);
	}
	const newPos = afterPos + ($pos.nodeAfter ? 0 : 1);
	tr = tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
	return tr;
}

//#endregion
//#region src/editor/components/modals/CalloutTypeEditModal.tsx
const calloutTypes = {
	info: {
		icon: Info,
		label: "Note",
		description: "General information and notes",
		iconColor: "text-blue-600"
	},
	warning: {
		icon: TriangleAlert,
		label: "Warning",
		description: "Important warnings and alerts",
		iconColor: "text-yellow-600"
	},
	caution: {
		icon: OctagonAlert,
		label: "Caution",
		description: "Critical safety information",
		iconColor: "text-red-600"
	},
	important: {
		icon: MessageSquareWarning,
		label: "Important",
		description: "Essential information to remember",
		iconColor: "text-violet-600"
	},
	tip: {
		icon: Lightbulb,
		label: "Tip",
		description: "Helpful tips and suggestions",
		iconColor: "text-green-600"
	}
};
function CalloutTypeEditModal({ open, initialType, onCloseAction, onSubmitAction, modalTitle = "Change Callout Type" }) {
	const [selectedType, setSelectedType] = useState(initialType);
	useEffect(() => {
		if (open) setSelectedType(initialType);
	}, [initialType, open]);
	const calloutTypeEntries = Object.entries(calloutTypes);
	const handleKeyNavigation = (e) => {
		const currentIndex = calloutTypeEntries.findIndex(([type]) => type === selectedType);
		if (e.key === "ArrowDown" || e.key === "ArrowRight") {
			e.preventDefault();
			const nextIndex = (currentIndex + 1) % calloutTypeEntries.length;
			setSelectedType(calloutTypeEntries[nextIndex][0]);
		} else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
			e.preventDefault();
			const prevIndex = currentIndex === 0 ? calloutTypeEntries.length - 1 : currentIndex - 1;
			setSelectedType(calloutTypeEntries[prevIndex][0]);
		}
	};
	if (!open) return null;
	function handleSubmit() {
		onSubmitAction(selectedType);
	}
	function handleKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCloseAction();
		} else handleKeyNavigation(e);
	}
	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) onCloseAction();
	}
	return ReactDOM.createPortal(/* @__PURE__ */ jsx("div", {
		className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
		onClick: handleBackdropClick,
		onKeyDown: handleKeyDown,
		tabIndex: -1,
		children: /* @__PURE__ */ jsxs("div", {
			className: "bg-card rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-hidden",
			onClick: (e) => e.stopPropagation(),
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "modal-title",
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "px-6 py-4 border-b border-border",
					children: /* @__PURE__ */ jsx("h2", {
						id: "modal-title",
						className: "text-lg font-semibold text-card-foreground",
						children: modalTitle
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "px-6 py-4",
					children: [/* @__PURE__ */ jsx("label", {
						id: "callout-type-label",
						className: "block text-sm font-medium text-muted-foreground mb-3",
						children: "Select callout type:"
					}), /* @__PURE__ */ jsx("div", {
						className: "space-y-2",
						role: "radiogroup",
						"aria-labelledby": "callout-type-label",
						children: calloutTypeEntries.map(([type, config]) => {
							const IconComponent = config.icon;
							const isSelected = selectedType === type;
							return /* @__PURE__ */ jsxs("button", {
								type: "button",
								onClick: () => setSelectedType(type),
								role: "radio",
								"aria-checked": isSelected,
								className: `w-full flex items-center p-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${isSelected ? "border-primary bg-accent text-accent-foreground" : "border-border hover:border-muted-foreground hover:bg-accent text-card-foreground"}`,
								children: [/* @__PURE__ */ jsx("div", {
									className: "flex-shrink-0 mr-3",
									children: /* @__PURE__ */ jsx(IconComponent, { className: `w-5 h-5 ${config.iconColor}` })
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex-1 text-left",
									children: [/* @__PURE__ */ jsx("div", {
										className: "font-medium",
										children: config.label
									}), /* @__PURE__ */ jsx("div", {
										className: "text-sm text-muted-foreground",
										children: config.description
									})]
								})]
							}, type);
						})
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "px-6 py-4 border-t border-border flex justify-end space-x-3",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: onCloseAction,
						className: "px-4 py-2 text-sm font-medium text-secondary-foreground bg-secondary border border-border rounded-md hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring",
						children: "Cancel"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: handleSubmit,
						className: "px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring",
						children: "Apply"
					})]
				})
			]
		})
	}), document.body);
}

//#endregion
//#region src/editor/components/callout.tsx
const calloutNodeSpec = {
	group: "block",
	content: "block+",
	attrs: { type: { default: "info" } },
	selectable: true,
	parseDOM: [
		{
			tag: "callout",
			getAttrs: (dom) => ({ type: dom.getAttribute("type") || "info" })
		},
		{
			tag: "info",
			getAttrs: () => ({ type: "info" })
		},
		{
			tag: "important",
			getAttrs: () => ({ type: "important" })
		},
		{
			tag: "warning",
			getAttrs: () => ({ type: "warning" })
		},
		{
			tag: "caution",
			getAttrs: () => ({ type: "caution" })
		},
		{
			tag: "tip",
			getAttrs: () => ({ type: "tip" })
		}
	],
	toDOM: (node) => [
		"callout",
		{ type: node.attrs.type || "info" },
		0
	]
};
const CalloutNodeView = React.forwardRef(function Callout({ nodeProps,...props }, ref) {
	const [modalOpen, setModalOpen] = useState(false);
	const type = nodeProps.node.attrs.type || "info";
	const editable = useEditorEditable();
	const typeInformation = {
		info: {
			icon: Info,
			headerText: "Note",
			iconColor: "text-blue-600",
			backgroundColor: "bg-blue-500/10",
			borderColor: "border-blue-500/20"
		},
		warning: {
			icon: TriangleAlert,
			headerText: "Warning",
			iconColor: "text-yellow-600",
			backgroundColor: "bg-yellow-500/10",
			borderColor: "border-yellow-500/20"
		},
		caution: {
			icon: OctagonAlert,
			headerText: "Caution",
			iconColor: "text-red-600",
			backgroundColor: "bg-red-500/10",
			borderColor: "border-red-500/20"
		},
		important: {
			icon: MessageSquareWarning,
			headerText: "Important",
			iconColor: "text-violet-600",
			backgroundColor: "bg-violet-500/10",
			borderColor: "border-violet-500/20"
		},
		tip: {
			icon: Lightbulb,
			headerText: "Tip",
			iconColor: "text-green-600",
			backgroundColor: "bg-green-500/10",
			borderColor: "border-green-500/20"
		}
	}[type];
	const updateType = useEditorEventCallback((view, newType) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			type: newType
		});
		view.dispatch(tr);
		setModalOpen(false);
	});
	const handleTypeClick = (e) => {
		if (!editable) return;
		e.stopPropagation();
		setModalOpen(true);
	};
	const handleKeyDown = (e) => {
		if (!editable) return;
		if (e.key === "Enter" || e.key === " ") {
			e.stopPropagation();
			setModalOpen(true);
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		className: `w-full border rounded-lg overflow-hidden py-2 ${typeInformation.borderColor} ${typeInformation.backgroundColor}`,
		children: [/* @__PURE__ */ jsx(CalloutTypeEditModal, {
			open: modalOpen,
			initialType: type,
			onCloseAction: () => setModalOpen(false),
			onSubmitAction: updateType
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-row w-full items-start",
			children: [/* @__PURE__ */ jsx("div", {
				contentEditable: false,
				className: `flex px-4 py-1 ${editable ? "cursor-pointer hover:cursor-pointer hover:opacity-80 transition-opacity" : ""}`,
				onClick: handleTypeClick,
				onKeyDown: handleKeyDown,
				tabIndex: editable ? 0 : -1,
				"aria-disabled": !editable,
				role: editable ? "button" : void 0,
				"aria-label": editable ? `Change callout type (currently ${typeInformation.headerText})` : void 0,
				title: typeInformation.headerText,
				children: /* @__PURE__ */ jsx(typeInformation.icon, { className: `size-7 ${typeInformation.iconColor}` })
			}), /* @__PURE__ */ jsx("div", {
				className: "flex-1 px-4 pl-0 prose prose-sm max-w-none",
				...props,
				ref
			})]
		})]
	});
});
const addCalloutRule = new InputRule(/^<callout(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	let type = "info";
	if (match[1]) {
		const typeMatch = match[1].match(/type="([^"]*)"/);
		if (typeMatch) type = typeMatch[1];
	}
	const callout = schema$2.nodes.callout.create({ type }, schema$2.nodes.paragraph.create());
	tr.replaceRangeWith(start, end, callout);
	const newPos = start + 1;
	tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
	return tr;
});
function insertCallout(state) {
	const { from, to } = state.selection;
	const attrs = { type: "info" };
	const callout = state.schema.nodes.callout.create(attrs, state.schema.nodes.paragraph.create());
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(callout);
	const insertPos = tr.selection.from;
	const innerPos = insertPos + 1;
	tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
	return tr;
}

//#endregion
//#region src/editor/components/modals/IconEditModal.tsx
const IconEditModal = ({ open, initialIcon = "", initialSize = 20, onCloseAction, onSubmitAction, modalTitle = "Edit Icon", iconLabel = "Icon", iconPlaceholder = "e.g. FileText, Book, Star", sizeLabel = "Size", sizePlaceholder = "e.g. 16, 20, 24, 32", showSize = false }) => {
	const [icon, setIcon] = useState(initialIcon ?? "");
	const [size, setSize] = useState((initialSize ?? 20).toString());
	const [isVisible, setIsVisible] = useState(false);
	useEffect(() => {
		if (open) {
			setIcon(initialIcon ?? "");
			setSize((initialSize ?? 20).toString());
			setIsVisible(true);
		} else {
			const timer = setTimeout(() => setIsVisible(false), 200);
			return () => clearTimeout(timer);
		}
	}, [
		open,
		initialIcon,
		initialSize
	]);
	if (!isVisible) return null;
	const iconPreview = resolveInlineIcon(icon || DEFAULT_CARD_ICON, {
		size: parseInt(size) || 20,
		showIcon: true,
		fallbackIcon: DEFAULT_CARD_ICON
	});
	const isValidIcon = icon && icon.trim().length > 0;
	const isValidSize = !showSize || size && !isNaN(parseInt(size)) && parseInt(size) >= 8 && parseInt(size) <= 128;
	const canSubmit = isValidIcon && isValidSize;
	function handleSubmit() {
		if (!canSubmit) return;
		const result = { icon: icon.trim() };
		if (showSize) result.size = parseInt(size);
		onSubmitAction(result);
	}
	function handleKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCloseAction();
		}
	}
	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) onCloseAction();
	}
	return ReactDOM.createPortal(/* @__PURE__ */ jsx("div", {
		className: `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`,
		onClick: handleBackdropClick,
		onKeyDown: handleKeyDown,
		tabIndex: -1,
		children: /* @__PURE__ */ jsxs("div", {
			className: `relative bg-background border border-border shadow-2xl rounded-lg min-w-[400px] max-w-[90vw] w-full mx-4 transform transition-all duration-200 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "px-6 py-4 border-b border-border",
					children: /* @__PURE__ */ jsx("h2", {
						className: "text-lg font-semibold text-foreground",
						children: modalTitle
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "px-6 py-4 space-y-4",
					children: [
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ jsx(Label, {
									htmlFor: "icon-input",
									className: "text-sm font-medium text-foreground",
									children: iconLabel
								}),
								/* @__PURE__ */ jsx(Input, {
									id: "icon-input",
									value: icon,
									autoFocus: true,
									onChange: (e) => setIcon(e.target.value),
									onKeyDown: handleKeyDown,
									className: "w-full bg-background border-border focus:border-primary focus:ring-primary/20",
									placeholder: iconPlaceholder,
									spellCheck: false,
									autoComplete: "off",
									"data-testid": "icon-input"
								}),
								!isValidIcon && icon.length > 0 && /* @__PURE__ */ jsx("p", {
									className: "text-xs text-destructive",
									children: "Icon name cannot be empty."
								})
							]
						}),
						showSize && /* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ jsx(Label, {
									htmlFor: "size-input",
									className: "text-sm font-medium text-foreground",
									children: sizeLabel
								}),
								/* @__PURE__ */ jsx(Input, {
									id: "size-input",
									type: "number",
									value: size,
									onChange: (e) => setSize(e.target.value),
									onKeyDown: handleKeyDown,
									className: "w-full bg-background border-border focus:border-primary focus:ring-primary/20",
									placeholder: sizePlaceholder,
									spellCheck: false,
									autoComplete: "off",
									"data-testid": "size-input",
									min: "8",
									max: "128"
								}),
								!isValidSize && size.length > 0 && /* @__PURE__ */ jsx("p", {
									className: "text-xs text-destructive",
									children: "Size must be between 8 and 128 pixels."
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, {
								className: "text-sm font-medium text-foreground",
								children: "Preview"
							}), /* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-3 p-3 bg-accent/30 rounded-md border border-border",
								children: [/* @__PURE__ */ jsx("div", {
									className: "flex items-center justify-center",
									children: iconPreview
								}), /* @__PURE__ */ jsxs("span", {
									className: "text-sm text-muted-foreground",
									children: [icon || "No icon selected", showSize && ` (${size}px)`]
								})]
							})]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "px-6 py-4 border-t border-border flex justify-end gap-3",
					children: [/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: onCloseAction,
						className: "px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
						children: "Cancel"
					}), /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: handleSubmit,
						disabled: !canSubmit,
						className: "px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed",
						children: "Save"
					})]
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: onCloseAction,
					className: "absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded",
					"aria-label": "Close modal",
					children: /* @__PURE__ */ jsx("svg", {
						className: "w-4 h-4",
						fill: "none",
						stroke: "currentColor",
						viewBox: "0 0 24 24",
						children: /* @__PURE__ */ jsx("path", {
							strokeLinecap: "round",
							strokeLinejoin: "round",
							strokeWidth: 2,
							d: "M6 18L18 6M6 6l12 12"
						})
					})
				})
			]
		})
	}), document.body);
};

//#endregion
//#region src/editor/components/card.tsx
const DEFAULT_CARD_ICON = "FileText";
const iconCache = /* @__PURE__ */ new Map();
/**
* Normalizes icon name to match Lucide's PascalCase convention
*/
function normalizeIconName(iconName) {
	return iconName.split(/[-_]/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("").replace(/^[a-z]/, (char) => char.toUpperCase());
}
/**
* Dynamically loads an icon from lucide-react
*/
async function loadIcon(iconName) {
	const normalizedName = normalizeIconName(iconName);
	if (iconCache.has(normalizedName)) return iconCache.get(normalizedName);
	try {
		const mod = await import("lucide-react");
		const IconComponent = mod[normalizedName];
		if (IconComponent) {
			iconCache.set(normalizedName, IconComponent);
			return IconComponent;
		} else {
			console.warn(`Icon "${iconName}" (normalized to "${normalizedName}") not found in Lucide icons.`);
			return null;
		}
	} catch (error) {
		console.error(`Failed to load icon "${iconName}":`, error);
		return null;
	}
}
/**
* Dynamic Icon Component that loads icons asynchronously
*/
function DynamicIcon({ iconName, size = "w-5 h-5", fallbackIcon = DEFAULT_CARD_ICON }) {
	const [IconComponent, setIconComponent] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	useEffect(() => {
		let isMounted = true;
		async function loadIconComponent() {
			setIsLoading(true);
			const component = await loadIcon(iconName);
			if (!isMounted) return;
			if (component) setIconComponent(() => component);
			else {
				const fallbackComponent = await loadIcon(fallbackIcon);
				if (isMounted && fallbackComponent) setIconComponent(() => fallbackComponent);
			}
			setIsLoading(false);
		}
		loadIconComponent();
		return () => {
			isMounted = false;
		};
	}, [iconName, fallbackIcon]);
	const getPixelSize = (sizeClass) => {
		const match = sizeClass.match(/w-\[(\d+)px\].*h-\[(\d+)px\]/);
		if (match) return {
			width: parseInt(match[1]),
			height: parseInt(match[2])
		};
		const sizeMap = {
			"w-4 h-4": 16,
			"w-5 h-5": 20,
			"w-6 h-6": 24,
			"w-8 h-8": 32
		};
		return {
			width: sizeMap[size] || 20,
			height: sizeMap[size] || 20
		};
	};
	const pixelSize = getPixelSize(size);
	if (isLoading) return /* @__PURE__ */ jsx("span", {
		className: "inline-block animate-pulse bg-muted rounded",
		style: {
			width: pixelSize.width,
			height: pixelSize.height
		}
	});
	if (!IconComponent) return /* @__PURE__ */ jsx(FileText, {
		className: "text-muted-foreground",
		width: pixelSize.width,
		height: pixelSize.height
	});
	return /* @__PURE__ */ jsx(IconComponent, {
		className: "text-muted-foreground",
		width: pixelSize.width,
		height: pixelSize.height
	});
}
/**
* Icon resolution utility
*/
function resolveIcon(icon, options = {}) {
	const { size = "w-5 h-5", showIcon = true, fallbackIcon = DEFAULT_CARD_ICON } = options;
	if (!showIcon) return null;
	if (typeof icon === "string") return /* @__PURE__ */ jsx(DynamicIcon, {
		iconName: icon,
		size,
		fallbackIcon
	});
	if (icon) return /* @__PURE__ */ jsx("div", {
		className: `${size} text-muted-foreground`,
		children: icon
	});
	return /* @__PURE__ */ jsx(FileText, { className: `${size} text-muted-foreground` });
}
/**
* Inline icon resolution utility for inline components
*/
function resolveInlineIcon(icon, options = {}) {
	const { size = 20, showIcon = true, fallbackIcon = DEFAULT_CARD_ICON } = options;
	if (!showIcon) return null;
	const sizeClass = typeof size === "number" ? `w-[${size}px] h-[${size}px]` : size;
	const sizeStyle = typeof size === "number" ? {
		width: `${size}px`,
		height: `${size}px`
	} : {};
	if (typeof icon === "string") return /* @__PURE__ */ jsx(DynamicIcon, {
		iconName: icon,
		size: sizeClass,
		fallbackIcon
	});
	if (icon) return /* @__PURE__ */ jsx("span", {
		className: `${sizeClass} text-muted-foreground`,
		style: sizeStyle,
		children: icon
	});
	const pixelSize = typeof size === "number" ? size : 20;
	return /* @__PURE__ */ jsx(FileText, {
		className: "text-muted-foreground",
		width: pixelSize,
		height: pixelSize
	});
}
const cardNodeSpec = {
	group: "block",
	content: "block*",
	attrs: {
		title: { default: "Card Title" },
		icon: { default: null },
		showIcon: { default: true },
		horizontal: { default: false },
		href: { default: null }
	},
	selectable: true,
	parseDOM: [{
		tag: "card",
		getAttrs: (dom) => ({
			title: dom.getAttribute("title") || "Card Title",
			icon: dom.getAttribute("icon") || null,
			showIcon: dom.getAttribute("show-icon") !== "false",
			horizontal: dom.getAttribute("horizontal") === "true",
			href: dom.getAttribute("href") || null
		})
	}],
	toDOM: (node) => [
		"card",
		{
			title: node.attrs.title,
			icon: node.attrs.icon,
			"show-icon": node.attrs.showIcon.toString(),
			horizontal: node.attrs.horizontal.toString(),
			href: node.attrs.href
		},
		0
	]
};
function CardContent({ title, children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex-1 min-w-0",
		children: [/* @__PURE__ */ jsx("h6", {
			contentEditable: false,
			className: "mb-2 text-card-foreground text-lg sm:text-xl font-semibold break-words",
			children: title
		}), /* @__PURE__ */ jsx("div", {
			className: "text-card-foreground [&>*]:mb-4 [&>*:last-child]:mb-0",
			children
		})]
	});
}
function HorizontalLayout({ iconElement, title, children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col sm:flex-row gap-3 p-3 sm:p-4",
		children: [iconElement && /* @__PURE__ */ jsx("div", {
			className: "flex-shrink-0 mt-0.5 self-start",
			children: iconElement
		}), /* @__PURE__ */ jsx(CardContent, {
			title,
			children
		})]
	});
}
function VerticalLayout({ iconElement, title, children }) {
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [iconElement && /* @__PURE__ */ jsx("div", {
		className: "p-3 sm:p-4 pb-0",
		children: iconElement
	}), /* @__PURE__ */ jsx("div", {
		className: "p-3 sm:p-4",
		children: /* @__PURE__ */ jsx(CardContent, {
			title,
			children
		})
	})] });
}
const getCardClasses = (horizontal, isClickable) => {
	const baseClasses = `relative flex ${horizontal ? "flex-col sm:flex-row" : "flex-col"} border border-border bg-card shadow-sm rounded-lg w-full text-card-foreground h-fit overflow-hidden mb-2`;
	const hoverClasses = isClickable ? "cursor-pointer transition-transform duration-300 ease-out hover:shadow-lg hover:scale-[1.01] hover:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary" : "";
	return `${baseClasses} ${hoverClasses}`;
};
const CardNodeView = React.forwardRef(function Card({ nodeProps,...props }, ref) {
	const title = nodeProps.node.attrs.title || "Card Title";
	const icon = nodeProps.node.attrs.icon;
	const showIcon = nodeProps.node.attrs.showIcon ?? true;
	const horizontal = nodeProps.node.attrs.horizontal ?? false;
	const href = nodeProps.node.attrs.href;
	const iconElement = resolveIcon(icon, {
		size: horizontal ? "w-5 h-5" : "w-8 h-8",
		showIcon
	});
	const isClickable = Boolean(href);
	const cardClasses = getCardClasses(horizontal, isClickable);
	const [modalOpen, setModalOpen] = useState(false);
	const [editField, setEditField] = useState(null);
	const [showOptions, setShowOptions] = useState(false);
	const editable = useEditorEditable();
	const updateTitle = useEditorEventCallback((view, newTitle) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			title: newTitle
		});
		view.dispatch(tr);
		setModalOpen(false);
		setEditField(null);
	}, [nodeProps]);
	const updateIconInternal = useEditorEventCallback((view, { icon: newIcon }) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			icon: newIcon
		});
		view.dispatch(tr);
		setModalOpen(false);
		setEditField(null);
	}, [nodeProps]);
	const updateIcon = ({ icon: icon$1, size }) => {
		updateIconInternal({
			icon: icon$1,
			size
		});
	};
	const toggleLayout = useEditorEventCallback((view) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			horizontal: !node.attrs.horizontal
		});
		view.dispatch(tr);
	});
	const iconClickable = editable ? /* @__PURE__ */ jsx("span", {
		className: "cursor-pointer",
		tabIndex: 0,
		"aria-disabled": false,
		onClick: (e) => {
			e.stopPropagation();
			setModalOpen(true);
			setEditField("icon");
		},
		onKeyDown: (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.stopPropagation();
				setModalOpen(true);
				setEditField("icon");
			}
		},
		children: iconElement
	}) : /* @__PURE__ */ jsx("span", { children: iconElement });
	const cardContent = horizontal ? /* @__PURE__ */ jsx(HorizontalLayout, {
		iconElement: iconClickable,
		title: editable ? /* @__PURE__ */ jsx("span", {
			className: "cursor-pointer",
			tabIndex: 0,
			"aria-disabled": false,
			onClick: (e) => {
				e.stopPropagation();
				setModalOpen(true);
				setEditField("title");
			},
			onKeyDown: (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.stopPropagation();
					setModalOpen(true);
					setEditField("title");
				}
			},
			children: title
		}) : /* @__PURE__ */ jsx("span", { children: title }),
		children: /* @__PURE__ */ jsx("div", {
			...props,
			ref
		})
	}) : /* @__PURE__ */ jsx(VerticalLayout, {
		iconElement: iconClickable,
		title: editable ? /* @__PURE__ */ jsx("span", {
			className: "cursor-pointer",
			tabIndex: 0,
			"aria-disabled": false,
			onClick: (e) => {
				e.stopPropagation();
				setModalOpen(true);
				setEditField("title");
			},
			onKeyDown: (e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.stopPropagation();
					setModalOpen(true);
					setEditField("title");
				}
			},
			children: title
		}) : /* @__PURE__ */ jsx("span", { children: title }),
		children: /* @__PURE__ */ jsx("div", {
			...props,
			ref
		})
	});
	return /* @__PURE__ */ jsxs("div", {
		className: cardClasses,
		onMouseEnter: () => setShowOptions(true),
		onMouseLeave: () => setShowOptions(false),
		children: [
			editable && /* @__PURE__ */ jsx("div", {
				className: `absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-200 ${showOptions ? "opacity-100" : "opacity-0 pointer-events-none"} z-20 bg-black/10 rounded-lg px-2 py-1 shadow-lg`,
				children: /* @__PURE__ */ jsxs("button", {
					onClick: (e) => {
						e.stopPropagation();
						toggleLayout();
					},
					className: "flex items-center outline-none select-none hover:cursor-pointer gap-1 bg-secondary/60 text-secondary-foreground rounded px-2 py-0.5 hover:bg-secondary/80 transition-colors text-xs font-mono",
					title: horizontal ? "Switch to vertical layout" : "Switch to horizontal layout",
					contentEditable: false,
					children: [/* @__PURE__ */ jsx(RotateCcw, {
						className: "w-3 h-3",
						"aria-hidden": "true"
					}), /* @__PURE__ */ jsx("span", { children: horizontal ? "Vertical" : "Horizontal" })]
				})
			}),
			/* @__PURE__ */ jsx(TitleDescriptionEditModal, {
				open: editable && modalOpen && editField === "title",
				initialTitle: title,
				onCloseAction: () => {
					setModalOpen(false);
					setEditField(null);
				},
				onSubmitAction: ({ title: title$1 }) => updateTitle(title$1),
				titleLabel: "Title",
				modalTitle: "Edit Card Title",
				showDescription: false,
				titlePlaceholder: "Card title"
			}),
			/* @__PURE__ */ jsx(IconEditModal, {
				open: editable && modalOpen && editField === "icon",
				initialIcon: icon,
				onCloseAction: () => {
					setModalOpen(false);
					setEditField(null);
				},
				onSubmitAction: updateIcon,
				modalTitle: "Edit Card Icon",
				iconLabel: "Icon",
				iconPlaceholder: "e.g. FileText, Book, Star"
			}),
			isClickable && /* @__PURE__ */ jsx("a", {
				href,
				className: "absolute inset-0 z-10",
				target: "_blank",
				rel: "noopener noreferrer",
				contentEditable: false,
				children: /* @__PURE__ */ jsxs("span", {
					className: "sr-only",
					children: ["Open ", title]
				})
			}),
			cardContent
		]
	});
});
const addCardRule = new InputRule(/^<card(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	const attrs = {
		title: "Card Title",
		icon: null,
		showIcon: true,
		horizontal: false,
		href: null
	};
	if (match[1]) {
		const attrString = match[1];
		const titleMatch = attrString.match(/title="([^"]*)"/);
		if (titleMatch) attrs.title = titleMatch[1];
		const iconMatch = attrString.match(/icon="([^"]*)"/);
		if (iconMatch) attrs.icon = iconMatch[1];
		const hrefMatch = attrString.match(/href="([^"]*)"/);
		if (hrefMatch) attrs.href = hrefMatch[1];
		attrs.horizontal = /horizontal(?:=true|\s|$)/.test(attrString);
		attrs.showIcon = !/showIcon=false/.test(attrString);
	}
	const card = schema$2.nodes.card.create(attrs, schema$2.nodes.paragraph.create());
	tr.replaceRangeWith(start, end, card);
	const newPos = start + 1;
	tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
	return tr;
});
function insertCard(state) {
	const { from, to } = state.selection;
	const attrs = {
		title: "Card Title",
		icon: null,
		showIcon: true,
		horizontal: false,
		href: null
	};
	const card = state.schema.nodes.card.create(attrs, state.schema.nodes.paragraph.create());
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(card);
	const insertPos = tr.selection.from;
	const innerPos = insertPos + 1;
	tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
	return tr;
}

//#endregion
//#region src/components/ui/dropdown-menu.tsx
function DropdownMenu({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Root, {
		"data-slot": "dropdown-menu",
		...props
	});
}
function DropdownMenuTrigger({ ...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Trigger, {
		"data-slot": "dropdown-menu-trigger",
		...props
	});
}
function DropdownMenuContent({ className, sideOffset = 4,...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx(DropdownMenuPrimitive.Content, {
		"data-slot": "dropdown-menu-content",
		sideOffset,
		className: cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border border-border p-1 shadow-md", className),
		...props
	}) });
}
function DropdownMenuItem({ className, inset, variant = "default",...props }) {
	return /* @__PURE__ */ jsx(DropdownMenuPrimitive.Item, {
		"data-slot": "dropdown-menu-item",
		"data-inset": inset,
		"data-variant": variant,
		className: cn("focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4", className),
		...props
	});
}

//#endregion
//#region src/editor/components/code-snippet.tsx
const codeSnippetNodeSpec = {
	group: "block",
	content: "text*",
	marks: "",
	code: true,
	attrs: {
		language: { default: "javascript" },
		title: { default: "" },
		theme: { default: "tokyoNight" },
		showBorder: { default: true }
	},
	parseDOM: [{
		tag: "pre code",
		priority: 60,
		preserveWhitespace: "full",
		getAttrs: (dom) => {
			const el = dom;
			return {
				language: el.getAttribute("language") || "javascript",
				title: el.getAttribute("title") || "",
				theme: el.getAttribute("theme") || "tokyoNight",
				showBorder: el.getAttribute("show-border") !== "false"
			};
		}
	}],
	toDOM: (node) => [
		"pre",
		{
			language: node.attrs["language"],
			title: node.attrs["title"],
			theme: node.attrs["theme"],
			"show-border": node.attrs["showBorder"]?.toString()
		},
		["code", 0]
	]
};
const languageExtensions = {
	javascript: javascript({ jsx: true }),
	typescript: javascript({
		typescript: true,
		jsx: true
	}),
	html: html(),
	css: css(),
	python: python(),
	rust: rust(),
	sql: sql()
};
const themeExtensions = {
	tokyoNight,
	githubDark,
	githubLight,
	vscodeDark,
	vscodeLight
};
const customStyling = EditorView.theme({
	"&": {
		borderRadius: "0.5rem",
		overflow: "hidden",
		backgroundColor: "transparent !important"
	},
	".cm-editor": {
		borderRadius: "0.5rem",
		backgroundColor: "transparent !important"
	},
	".cm-editor.cm-focused": { backgroundColor: "transparent !important" },
	".cm-scroller": {
		padding: "0.5rem",
		backgroundColor: "transparent !important"
	},
	".cm-content": {
		padding: "0",
		backgroundColor: "transparent !important"
	},
	".cm-gutters": {
		backgroundColor: "transparent !important",
		border: "none"
	},
	".cm-gutter": { backgroundColor: "transparent !important" },
	".cm-lineNumbers": { backgroundColor: "transparent !important" },
	".cm-activeLine": { backgroundColor: "transparent !important" },
	".cm-activeLineGutter": { backgroundColor: "transparent !important" },
	".cm-focused": { outline: "none" }
});
const CodeSnippetNodeView = React.forwardRef(function CodeSnippet({ nodeProps,...props }, ref) {
	const [value, setValue] = useState(nodeProps.node.textContent ?? "let x = 2;");
	const [language, setLanguage] = useState(nodeProps.node.attrs["language"]);
	const [theme, setTheme] = useState(nodeProps.node.attrs["theme"] || "tokyoNight");
	const [showBorder, setShowBorder] = useState(nodeProps.node.attrs["showBorder"] ?? true);
	const [showOptions, setShowOptions] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const codeMirrorRef = useRef(null);
	const [shouldFocus, setShouldFocus] = useState(false);
	const updateAttributes = useEditorEventCallback((view, newContent, newLanguage, newTheme, newShowBorder) => {
		const { tr } = view.state;
		const pos = nodeProps.getPos();
		const node = tr.doc.nodeAt(pos);
		if (node) {
			if (newLanguage && newLanguage !== nodeProps.node.attrs["language"] || newTheme && newTheme !== nodeProps.node.attrs["theme"] || newShowBorder !== void 0 && newShowBorder !== nodeProps.node.attrs["showBorder"]) tr.setNodeMarkup(pos, void 0, {
				...nodeProps.node.attrs,
				...newLanguage && { ["language"]: newLanguage },
				...newTheme && { ["theme"]: newTheme },
				...newShowBorder !== void 0 && { ["showBorder"]: newShowBorder }
			});
			if (newContent.length !== 0) {
				const textNode = view.state.schema.text(newContent);
				tr.replaceWith(pos + 1, pos + 1 + node.content.size, textNode);
			}
		}
		view.dispatch(tr);
	});
	useEffect(() => {
		const handler = setTimeout(() => {
			updateAttributes(value, language, theme, showBorder);
		}, 100);
		return () => {
			clearTimeout(handler);
		};
	}, [
		value,
		language,
		theme,
		showBorder,
		updateAttributes
	]);
	const editable = useEditorEditable();
	useEffect(() => {
		const isNewSnippet = nodeProps.node.textContent === "" || nodeProps.node.textContent === "let x = 2;";
		if (isNewSnippet && editable) {
			setShouldFocus(true);
			if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur?.();
		}
	}, [nodeProps.node.textContent, editable]);
	useEffect(() => {
		if (shouldFocus && codeMirrorRef.current && editable) {
			const focusEditor = () => {
				const view = codeMirrorRef.current?.view;
				if (view) {
					view.dom.focus();
					view.focus();
					const doc = view.state.doc;
					view.dispatch({
						selection: { anchor: doc.length },
						scrollIntoView: true
					});
				}
				setShouldFocus(false);
			};
			Promise.resolve().then(focusEditor);
		}
	}, [shouldFocus, editable]);
	const onChange = useCallback((v) => {
		setValue(v);
	}, []);
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			setTimeout(() => setCopied(false), 2e3);
		} catch (err) {
			console.error("Failed to copy text: ", err);
		}
	};
	useStopEvent((view, event) => {
		if (event instanceof InputEvent) return true;
		return false;
	});
	const deleteNodeFromPM = useEditorEventCallback((view) => {
		const pos = nodeProps.getPos();
		const start = pos;
		const end = pos + nodeProps.node.nodeSize;
		let tr = view.state.tr.delete(start, end);
		if (tr.doc.childCount === 0) {
			const para = view.state.schema.nodes.paragraph.create();
			tr = tr.insert(0, para);
		}
		const targetPos = Math.min(start, tr.doc.content.size);
		tr = tr.setSelection(Selection.near(tr.doc.resolve(targetPos), -1)).scrollIntoView();
		view.dispatch(tr);
		view.focus();
		return true;
	});
	const escapeDownToPM = useEditorEventCallback((view) => {
		const pos = nodeProps.getPos();
		const after = pos + nodeProps.node.nodeSize;
		let tr = view.state.tr;
		const $after = tr.doc.resolve(after);
		if (!$after.nodeAfter) {
			const para = view.state.schema.nodes.paragraph.create();
			tr = tr.insert(after, para);
		}
		tr = tr.setSelection(Selection.near(tr.doc.resolve(after + 1), 1)).scrollIntoView();
		view.dispatch(tr);
		view.focus();
		return true;
	});
	const escapeUpToPM = useEditorEventCallback((view) => {
		const pos = nodeProps.getPos();
		let tr = view.state.tr;
		const $before = tr.doc.resolve(pos);
		if (!$before.nodeBefore) {
			const para = view.state.schema.nodes.paragraph.create();
			tr = tr.insert(pos, para);
		}
		const mappedStart = tr.mapping.map(pos);
		tr = tr.setSelection(Selection.near(tr.doc.resolve(mappedStart), -1)).scrollIntoView();
		view.dispatch(tr);
		view.focus();
		return true;
	});
	const arrowUpExitExtension = useMemo(() => Prec.highest(keymap$1.of([{
		key: "ArrowUp",
		run: (cm) => {
			const sel = cm.state.selection.main;
			if (!sel.empty) return false;
			const line = cm.state.doc.lineAt(sel.head);
			if (sel.head > line.from) return false;
			if (line.from > 0) return false;
			if (sel.head !== 0) return false;
			escapeUpToPM();
			return true;
		}
	}])), [escapeUpToPM]);
	const arrowDownExitExtension = useMemo(() => Prec.highest(keymap$1.of([{
		key: "ArrowDown",
		run: (cm) => {
			const sel = cm.state.selection.main;
			if (!sel.empty) return false;
			const line = cm.state.doc.lineAt(sel.head);
			if (sel.head < line.to) return false;
			if (line.to < cm.state.doc.length) return false;
			escapeDownToPM();
			return true;
		}
	}])), [escapeDownToPM]);
	const ctrlEnterExitExtension = useMemo(() => Prec.highest(keymap$1.of([{
		key: "Ctrl-Enter",
		run: () => {
			if (!editable) return false;
			escapeDownToPM();
			return true;
		}
	}])), [escapeDownToPM, editable]);
	const backspaceDeleteExtension = useMemo(() => Prec.highest(keymap$1.of([{
		key: "Backspace",
		run: (cm) => {
			if (cm.state.doc.length > 0) return false;
			if (!editable) return false;
			deleteNodeFromPM();
			return true;
		}
	}])), [deleteNodeFromPM, editable]);
	return /* @__PURE__ */ jsxs("div", {
		ref,
		...props,
		contentEditable: false,
		className: `relative rounded-lg overflow-hidden ${showBorder ? "border border-border" : ""}`,
		onMouseEnter: () => setShowOptions(true),
		onMouseLeave: () => !dropdownOpen && setShowOptions(false),
		children: [/* @__PURE__ */ jsxs("div", {
			className: `absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-200 ${showOptions || dropdownOpen ? "opacity-100" : "opacity-0 pointer-events-none"} z-10 bg-black/10 rounded-lg px-2 py-1 shadow-lg`,
			children: [
				/* @__PURE__ */ jsxs(DropdownMenu, {
					onOpenChange: (open) => setDropdownOpen(open),
					children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
						asChild: true,
						children: /* @__PURE__ */ jsxs("button", {
							className: "bg-secondary/60 text-secondary-foreground hover:cursor-pointer rounded px-2 py-0.5 pr-6 focus:outline-none focus:ring-1 focus:ring-ring text-xs font-mono relative flex items-center",
							style: { minWidth: "110px" },
							children: [language.toLowerCase(), /* @__PURE__ */ jsx(ChevronDown, {
								className: "absolute right-1.5 text-secondary-foreground w-3 h-3",
								"aria-hidden": "true"
							})]
						})
					}), /* @__PURE__ */ jsx(DropdownMenuContent, {
						className: "bg-popover border-border",
						children: Object.keys(languageExtensions).map((key) => /* @__PURE__ */ jsx(DropdownMenuItem, {
							onClick: () => setLanguage(key),
							className: "text-popover-foreground hover:bg-accent focus:bg-accent text-xs font-mono cursor-pointer",
							children: key
						}, key))
					})]
				}),
				/* @__PURE__ */ jsxs(DropdownMenu, {
					onOpenChange: (open) => setDropdownOpen(open),
					children: [/* @__PURE__ */ jsx(DropdownMenuTrigger, {
						asChild: true,
						children: /* @__PURE__ */ jsxs("button", {
							className: "bg-secondary/60 text-secondary-foreground hover:cursor-pointer rounded px-2 py-0.5 pr-6 focus:outline-none focus:ring-1 focus:ring-ring text-xs font-mono relative flex items-center",
							style: { minWidth: "120px" },
							children: [theme.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()).toLowerCase(), /* @__PURE__ */ jsx(ChevronDown, {
								className: "absolute right-1.5 text-secondary-foreground w-3 h-3",
								"aria-hidden": "true"
							})]
						})
					}), /* @__PURE__ */ jsx(DropdownMenuContent, {
						className: "bg-popover border-border",
						children: Object.keys(themeExtensions).map((key) => /* @__PURE__ */ jsx(DropdownMenuItem, {
							onClick: () => setTheme(key),
							className: "text-popover-foreground hover:bg-accent focus:bg-accent text-xs font-mono cursor-pointer",
							children: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
						}, key))
					})]
				}),
				/* @__PURE__ */ jsx("button", {
					onClick: () => setShowBorder(!showBorder),
					className: "flex items-center outline-none select-none hover:cursor-pointer gap-1 bg-secondary/60 text-secondary-foreground rounded px-2 py-0.5 hover:bg-secondary/80 transition-colors text-xs font-mono",
					title: showBorder ? "Hide border" : "Show border",
					children: showBorder ? /* @__PURE__ */ jsx(Square, {
						className: "w-3 h-3",
						"aria-hidden": "true"
					}) : /* @__PURE__ */ jsx(SquareDashed, {
						className: "w-3 h-3",
						"aria-hidden": "true"
					})
				}),
				/* @__PURE__ */ jsxs("button", {
					onClick: handleCopy,
					className: "flex items-center outline-none select-none hover:cursor-pointer gap-1 bg-secondary/60 text-secondary-foreground rounded px-2 py-0.5 hover:bg-secondary/80 transition-colors text-xs font-mono",
					title: "Copy code",
					children: [copied ? /* @__PURE__ */ jsx(Check, {
						className: "w-3 h-3",
						"aria-hidden": "true"
					}) : /* @__PURE__ */ jsx(Copy, {
						className: "w-3 h-3",
						"aria-hidden": "true"
					}), /* @__PURE__ */ jsx("span", { children: copied ? "Copied!" : "Copy" })]
				})
			]
		}), /* @__PURE__ */ jsx(CodeMirror, {
			ref: (instance) => {
				codeMirrorRef.current = instance;
				if (shouldFocus && instance?.view && editable) {
					instance.view.focus();
					const doc = instance.view.state.doc;
					instance.view.dispatch({
						selection: { anchor: doc.length },
						scrollIntoView: true
					});
					setShouldFocus(false);
				}
			},
			className: "text-lg min-h-[40px] max-h-[400px] overflow-y-auto rounded-lg",
			theme: themeExtensions[theme],
			value,
			editable,
			extensions: [
				language in languageExtensions ? [languageExtensions[language]] : [],
				arrowDownExitExtension,
				arrowUpExitExtension,
				ctrlEnterExitExtension,
				backspaceDeleteExtension,
				customStyling
			],
			onChange
		})]
	});
});
function addCodeSnippetRule(schema$2) {
	return new InputRule(/^```$/, (state, match, start, end) => {
		const { tr } = state;
		const codeNodeType = schema$2.nodes.code_snippet;
		if (!codeNodeType) return null;
		const $pos = tr.selection.$from;
		let insideTabs = false;
		for (let i = $pos.depth; i >= 0; i--) if ($pos.node(i).type.name === "tabs") {
			insideTabs = true;
			break;
		}
		const codeNode = codeNodeType.create({
			language: "javascript",
			showBorder: !insideTabs
		});
		tr.replaceRangeWith(start, end, codeNode);
		const codePos = tr.selection.$from.pos;
		tr.setSelection(Selection.near(tr.doc.resolve(codePos)));
		return tr;
	});
}
function insertCodeSnippet(state) {
	const { from, to } = state.selection;
	const attrs = {
		language: "javascript",
		title: "",
		theme: "tokyoNight",
		showBorder: true
	};
	const codeNodeType = state.schema.nodes.code_snippet;
	if (!codeNodeType) throw new Error("code_snippet node type not found in schema");
	const $pos = state.selection.$from;
	let insideTabs = false;
	for (let i = $pos.depth; i >= 0; i--) if ($pos.node(i).type.name === "tabs") {
		insideTabs = true;
		break;
	}
	const codeNode = codeNodeType.create({
		...attrs,
		showBorder: !insideTabs
	});
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(codeNode);
	const codePos = tr.selection.from;
	tr = tr.setSelection(Selection.near(tr.doc.resolve(codePos)));
	return tr;
}

//#endregion
//#region src/editor/components/columns.tsx
const columnsNodeSpec = {
	group: "block",
	content: "column+",
	attrs: {
		cols: { default: 2 },
		gap: { default: "md" }
	},
	selectable: true,
	parseDOM: [{
		tag: "columns",
		getAttrs: (dom) => ({
			cols: parseInt(dom.getAttribute("cols") || "2", 10),
			gap: dom.getAttribute("gap") || "md"
		})
	}],
	toDOM: (node) => [
		"columns",
		{
			cols: node.attrs.cols,
			gap: node.attrs.gap
		},
		0
	]
};
const columnNodeSpec = {
	content: "block+",
	defining: true,
	isolating: true,
	parseDOM: [{ tag: "column" }],
	toDOM: () => ["column", 0]
};
const ColumnNodeView = React.forwardRef(function Column({ nodeProps, children,...props }, ref) {
	return /* @__PURE__ */ jsx("div", {
		ref,
		...props,
		children
	});
});
const ColumnsNodeView = React.forwardRef(function Columns$1({ nodeProps, children,...props }, ref) {
	const cols = parseInt(nodeProps.node.attrs.cols ?? 2, 10);
	const gap = nodeProps.node.attrs.gap ?? "md";
	const editable = useEditorEditable();
	const [showOptions, setShowOptions] = useState(false);
	const gapClasses = {
		sm: "gap-4",
		md: "gap-6",
		lg: "gap-8"
	};
	const colClasses = {
		1: "grid-cols-1",
		2: "grid-cols-1 md:grid-cols-2",
		3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
	};
	const updateColumns = useEditorEventCallback((view, newCols) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		let tr = view.state.tr;
		node.attrs.cols;
		const existingColumns = [];
		for (let i = 0; i < node.childCount; i++) existingColumns.push(node.child(i));
		const newColumns = [];
		for (let i = 0; i < newCols; i++) if (i < existingColumns.length) newColumns.push(existingColumns[i]);
		else newColumns.push(view.state.schema.nodes.column.create({}, view.state.schema.nodes.paragraph.create()));
		const newColumnsNode = view.state.schema.nodes.columns.create({
			...node.attrs,
			cols: newCols
		}, newColumns);
		tr = tr.replaceWith(pos, pos + node.nodeSize, newColumnsNode);
		view.dispatch(tr);
	});
	const handleDecreaseCols = () => {
		if (cols > 1) updateColumns(cols - 1);
	};
	const handleIncreaseCols = () => {
		if (cols < 4) updateColumns(cols + 1);
	};
	return /* @__PURE__ */ jsxs("div", {
		ref,
		"data-columns": "",
		className: `relative grid ${colClasses[cols] || colClasses[2]} ${gapClasses[gap]} w-full my-6 ${editable ? "border-dotted border border-border rounded-lg p-4" : ""}`,
		onMouseEnter: () => editable && setShowOptions(true),
		onMouseLeave: () => setShowOptions(false),
		...props,
		children: [
			editable && /* @__PURE__ */ jsxs("div", {
				className: `absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-200 ${showOptions ? "opacity-100" : "opacity-0 pointer-events-none"} z-10 bg-black/10 rounded-lg px-2 py-1 shadow-lg`,
				children: [
					/* @__PURE__ */ jsx("button", {
						onClick: handleDecreaseCols,
						disabled: cols <= 1,
						className: "flex items-center outline-none select-none hover:cursor-pointer bg-secondary/60 text-secondary-foreground rounded px-2 py-0.5 hover:bg-secondary/80 transition-colors text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-secondary/60",
						title: "Remove column",
						children: /* @__PURE__ */ jsx(Minus, { className: "w-3 h-3" })
					}),
					/* @__PURE__ */ jsx("span", {
						className: "bg-secondary/60 text-secondary-foreground text-xs font-mono px-2 py-0.5 rounded min-w-[1.5rem] text-center",
						children: cols
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: handleIncreaseCols,
						disabled: cols >= 4,
						className: "flex items-center outline-none select-none hover:cursor-pointer bg-secondary/60 text-secondary-foreground rounded px-2 py-0.5 hover:bg-secondary/80 transition-colors text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-secondary/60",
						title: "Add column",
						children: /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" })
					})
				]
			}),
			editable && /* @__PURE__ */ jsx("div", {
				className: "absolute inset-0 pointer-events-none",
				children: Array.from({ length: cols }, (_, i) => /* @__PURE__ */ jsx("div", {
					className: "absolute border border-dashed border-border/30 rounded",
					style: {
						left: `${100 / cols * i}%`,
						width: `${100 / cols}%`,
						top: 0,
						height: "100%",
						marginRight: i < cols - 1 ? "0.75rem" : "0"
					}
				}, i))
			}),
			children
		]
	});
});
const addColumnsRule = new InputRule(/^<columns(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	let cols = 2;
	let gap = "md";
	if (match[1]) {
		const colsMatch = match[1].match(/cols="?(\d)"?/);
		if (colsMatch) cols = parseInt(colsMatch[1], 10);
		const gapMatch = match[1].match(/gap="(sm|md|lg)"/);
		if (gapMatch) gap = gapMatch[1];
	}
	const columnNodes = Array.from({ length: cols }, () => schema$2.nodes.column.create({}, schema$2.nodes.paragraph.create()));
	const columns = schema$2.nodes.columns.create({
		cols,
		gap
	}, columnNodes);
	const emptyParagraph = schema$2.nodes.paragraph.create();
	const fragment = Fragment.from([columns, emptyParagraph]);
	tr.replaceWith(start, end, fragment);
	const newPos = start + 2;
	tr.setSelection(tr.selection.constructor.near(tr.doc.resolve(newPos)));
	return tr;
});
function insertColumns(state) {
	const { from, to } = state.selection;
	const attrs = {
		cols: 2,
		gap: "md"
	};
	const columnNodes = Array.from({ length: attrs.cols }, () => state.schema.nodes.column.create({}, state.schema.nodes.paragraph.create()));
	const columns = state.schema.nodes.columns.create(attrs, columnNodes);
	const emptyParagraph = state.schema.nodes.paragraph.create();
	let tr = state.tr;
	const insertPos = from;
	const endPos = to;
	const fragment = Fragment.from([columns, emptyParagraph]);
	tr = tr.replaceWith(insertPos, endPos, fragment);
	const innerPos = insertPos + 2;
	tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
	return tr;
}

//#endregion
//#region src/editor/components/field.tsx
const fieldNodeSpec = {
	group: "block",
	content: "block+",
	attrs: {
		name: { default: "" },
		type: { default: "string" },
		required: { default: false }
	},
	selectable: true,
	parseDOM: [{
		tag: "field",
		getAttrs: (dom) => ({
			name: dom.getAttribute("name") || "",
			type: dom.getAttribute("type") || "string",
			required: dom.getAttribute("required") === "true"
		})
	}],
	toDOM: (node) => [
		"field",
		{
			name: node.attrs.name,
			type: node.attrs.type,
			required: node.attrs.required.toString()
		},
		0
	]
};
function FieldEditModal({ open, initialName, initialType, initialRequired, onCloseAction, onSubmitAction, modalTitle = "Edit Parameter Field" }) {
	const [name, setName] = useState(initialName);
	const [type, setType] = useState(initialType);
	const [required, setRequired] = useState(initialRequired);
	const [isVisible, setIsVisible] = useState(false);
	React.useEffect(() => {
		if (open) {
			setName(initialName);
			setType(initialType);
			setRequired(initialRequired);
			setIsVisible(true);
		} else {
			const timer = setTimeout(() => setIsVisible(false), 200);
			return () => clearTimeout(timer);
		}
	}, [
		open,
		initialName,
		initialType,
		initialRequired
	]);
	if (!isVisible) return null;
	const handleSubmit = (e) => {
		e.preventDefault();
		if (name.trim()) onSubmitAction({
			name: name.trim(),
			type: type.trim() || "string",
			required
		});
	};
	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCloseAction();
		}
	};
	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) onCloseAction();
	};
	return ReactDOM.createPortal(/* @__PURE__ */ jsx("div", {
		className: `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`,
		onClick: handleBackdropClick,
		onKeyDown: handleKeyDown,
		tabIndex: -1,
		children: /* @__PURE__ */ jsxs("div", {
			className: `relative bg-background border border-border shadow-2xl rounded-lg min-w-[400px] max-w-[90vw] w-full mx-4 transform transition-all duration-200 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "px-6 py-4 border-b border-border",
					children: /* @__PURE__ */ jsx("h2", {
						className: "text-lg font-semibold text-foreground",
						children: modalTitle
					})
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: handleSubmit,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "px-6 py-4 space-y-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "field-name",
									className: "text-sm font-medium text-foreground",
									children: "Parameter Name"
								}), /* @__PURE__ */ jsx(Input, {
									id: "field-name",
									value: name,
									onChange: (e) => setName(e.target.value),
									onKeyDown: handleKeyDown,
									className: "w-full bg-background border-border focus:border-primary focus:ring-primary/20",
									placeholder: "e.g., userId, callback, options",
									autoFocus: true,
									spellCheck: false
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "field-type",
									className: "text-sm font-medium text-foreground",
									children: "Type"
								}), /* @__PURE__ */ jsx(Input, {
									id: "field-type",
									value: type,
									onChange: (e) => setType(e.target.value),
									onKeyDown: handleKeyDown,
									className: "w-full bg-background border-border focus:border-primary focus:ring-primary/20",
									placeholder: "e.g., string, number, boolean, object, array",
									spellCheck: false
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex items-center space-x-2",
								children: [/* @__PURE__ */ jsx("input", {
									type: "checkbox",
									id: "field-required",
									checked: required,
									onChange: (e) => setRequired(e.target.checked),
									className: "w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/40 focus:ring-2 hover:cursor-pointer"
								}), /* @__PURE__ */ jsx(Label, {
									htmlFor: "field-required",
									className: "text-sm font-medium text-foreground hover:cursor-pointer",
									children: "Required parameter"
								})]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "px-6 py-4 border-t border-border flex justify-end gap-3",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: onCloseAction,
							className: "px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer",
							children: "Cancel"
						}), /* @__PURE__ */ jsx("button", {
							type: "submit",
							disabled: !name.trim(),
							className: "px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer",
							children: "Save"
						})]
					})]
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: onCloseAction,
					className: "absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded hover:cursor-pointer",
					"aria-label": "Close modal",
					children: /* @__PURE__ */ jsx("svg", {
						className: "w-4 h-4",
						fill: "none",
						stroke: "currentColor",
						viewBox: "0 0 24 24",
						children: /* @__PURE__ */ jsx("path", {
							strokeLinecap: "round",
							strokeLinejoin: "round",
							strokeWidth: 2,
							d: "M6 18L18 6M6 6l12 12"
						})
					})
				})
			]
		})
	}), document.body);
}
const FieldNodeView = React.forwardRef(function Field({ nodeProps,...props }, ref) {
	const [modalOpen, setModalOpen] = useState(false);
	const [editField, setEditField] = useState(null);
	const name = nodeProps.node.attrs.name || "";
	const type = nodeProps.node.attrs.type || "string";
	const required = nodeProps.node.attrs.required ?? false;
	const editable = useEditorEditable();
	const updateField = useEditorEventCallback((view, { name: newName, type: newType, required: newRequired }) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			name: newName,
			type: newType,
			required: newRequired
		});
		view.dispatch(tr);
		setModalOpen(false);
		setEditField(null);
	});
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: "border border-border bg-card rounded-lg p-4 mb-4",
		children: [/* @__PURE__ */ jsx(FieldEditModal, {
			open: modalOpen,
			initialName: name,
			initialType: type,
			initialRequired: required,
			onCloseAction: () => {
				setModalOpen(false);
				setEditField(null);
			},
			onSubmitAction: updateField
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-col gap-3",
			children: [/* @__PURE__ */ jsx("div", {
				className: "flex items-center gap-3 flex-wrap",
				children: /* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ jsx("code", {
							contentEditable: false,
							className: `text-lg font-semibold text-foreground font-mono ${editable ? "cursor-pointer hover:text-primary transition-colors hover:cursor-pointer" : ""}`,
							onClick: (e) => {
								if (!editable) return;
								e.stopPropagation();
								setModalOpen(true);
								setEditField("name");
							},
							onKeyDown: (e) => {
								if (!editable) return;
								if (e.key === "Enter" || e.key === " ") {
									e.stopPropagation();
									setModalOpen(true);
									setEditField("name");
								}
							},
							tabIndex: editable ? 0 : -1,
							"aria-disabled": !editable,
							children: name || "parameterName"
						}),
						/* @__PURE__ */ jsx("span", {
							contentEditable: false,
							className: `inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 font-mono ${editable ? "cursor-pointer hover:bg-primary/20 transition-colors hover:cursor-pointer" : ""}`,
							onClick: (e) => {
								if (!editable) return;
								e.stopPropagation();
								setModalOpen(true);
								setEditField("type");
							},
							onKeyDown: (e) => {
								if (!editable) return;
								if (e.key === "Enter" || e.key === " ") {
									e.stopPropagation();
									setModalOpen(true);
									setEditField("type");
								}
							},
							tabIndex: editable ? 0 : -1,
							"aria-disabled": !editable,
							children: type
						}),
						/* @__PURE__ */ jsx("span", {
							contentEditable: false,
							className: `inline-flex items-center px-2 py-1 rounded text-xs font-medium ${required ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-muted text-muted-foreground border border-border"} ${editable ? "cursor-pointer hover:opacity-80 transition-opacity hover:cursor-pointer" : ""}`,
							onClick: (e) => {
								if (!editable) return;
								e.stopPropagation();
								setModalOpen(true);
							},
							onKeyDown: (e) => {
								if (!editable) return;
								if (e.key === "Enter" || e.key === " ") {
									e.stopPropagation();
									setModalOpen(true);
								}
							},
							tabIndex: editable ? 0 : -1,
							"aria-disabled": !editable,
							children: required ? "required" : "optional"
						})
					]
				})
			}), /* @__PURE__ */ jsx("div", {
				className: "prose prose-sm max-w-none text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
				children: /* @__PURE__ */ jsx("div", { ...props })
			})]
		})]
	});
});
const addFieldRule = new InputRule(/^<field(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	const attrs = {
		name: "",
		type: "string",
		required: false
	};
	if (match[1]) {
		const nameMatch = match[1].match(/name="([^"]*)"/);
		if (nameMatch) attrs.name = nameMatch[1];
		const typeMatch = match[1].match(/type="([^"]*)"/);
		if (typeMatch) attrs.type = typeMatch[1];
		attrs.required = /required(?:=true|\s|$)/.test(match[1]);
	}
	const field = schema$2.nodes.field.create(attrs, schema$2.nodes.paragraph.create());
	tr.replaceRangeWith(start, end, field);
	const newPos = start + 1;
	tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
	return tr;
});
function insertField(state) {
	const { from, to } = state.selection;
	const attrs = {
		name: "parameterName",
		type: "string",
		required: false
	};
	const field = state.schema.nodes.field.create(attrs, state.schema.nodes.paragraph.create());
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(field);
	const insertPos = tr.selection.from;
	const innerPos = insertPos + 1;
	tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
	return tr;
}

//#endregion
//#region src/editor/components/foo.tsx
const fooNodeSpec = {
	group: "block",
	content: "block+",
	attrs: { dummy: { default: "fosso" } },
	selectable: true,
	isolating: true,
	parseDOM: [{
		tag: "foo",
		getAttrs: (dom) => ({ foo: dom.getAttribute("foo") || "another default in case it wasnt provided" })
	}],
	toDOM: (node) => ["foo", { dummy: node.attrs.dummy }]
};
const FooNodeView = React.forwardRef(function Break({ nodeProps,...props }, ref) {
	const foo = nodeProps.node.attrs.foo || "ok still missing";
	return /* @__PURE__ */ jsxs("div", {
		className: "p-8 bg-red-500 rounded-lg",
		children: [/* @__PURE__ */ jsx("h1", {
			contentEditable: false,
			children: foo
		}), /* @__PURE__ */ jsx("div", {
			...props,
			ref
		})]
	});
});
function addFooRule(schema$2) {
	return new InputRule(/^<foo\s*\/>/, (state, match, start, end) => {
		const tr = state.tr;
		const node = schema$2.nodes.foo.create({}, schema$2.nodes.paragraph.create());
		tr.replaceRangeWith(start, end, node);
		tr.setSelection(Selection.near(tr.doc.resolve(start + 1)));
		return tr;
	});
}
function insertFoo(state) {
	const { from, to } = state.selection;
	const attrs = { dummy: "fosso" };
	const foo = state.schema.nodes.foo.create(attrs, state.schema.nodes.paragraph.create());
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(foo);
	const insertPos = tr.selection.from;
	const innerPos = insertPos + 1;
	tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
	return tr;
}

//#endregion
//#region src/editor/components/frame.tsx
const frameNodeSpec = {
	group: "block",
	content: "block+",
	attrs: {
		caption: { default: "" },
		padding: { default: "md" }
	},
	selectable: true,
	parseDOM: [{
		tag: "frame",
		getAttrs: (dom) => ({
			caption: dom.getAttribute("caption") || "",
			padding: dom.getAttribute("padding") || "md"
		})
	}],
	toDOM: (node) => [
		"frame",
		{
			caption: node.attrs.caption,
			padding: node.attrs.padding
		},
		0
	]
};
function FrameEditModal({ open, initialCaption, initialPadding, onCloseAction, onSubmitAction, modalTitle = "Edit Frame" }) {
	const [caption, setCaption] = useState(initialCaption);
	const [padding, setPadding] = useState(initialPadding);
	const [isVisible, setIsVisible] = useState(false);
	React.useEffect(() => {
		if (open) {
			setCaption(initialCaption);
			setPadding(initialPadding);
			setIsVisible(true);
		} else {
			const timer = setTimeout(() => setIsVisible(false), 200);
			return () => clearTimeout(timer);
		}
	}, [
		open,
		initialCaption,
		initialPadding
	]);
	if (!isVisible) return null;
	const handleSubmit = (e) => {
		e.preventDefault();
		onSubmitAction({
			caption: caption.trim(),
			padding
		});
	};
	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCloseAction();
		}
	};
	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) onCloseAction();
	};
	return ReactDOM.createPortal(/* @__PURE__ */ jsx("div", {
		className: `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`,
		onClick: handleBackdropClick,
		onKeyDown: handleKeyDown,
		tabIndex: -1,
		children: /* @__PURE__ */ jsxs("div", {
			className: `relative bg-background border border-border shadow-2xl rounded-lg min-w-[400px] max-w-[90vw] w-full mx-4 transform transition-all duration-200 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "px-6 py-4 border-b border-border",
					children: /* @__PURE__ */ jsx("h2", {
						className: "text-lg font-semibold text-foreground",
						children: modalTitle
					})
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: handleSubmit,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "px-6 py-4 space-y-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "frame-caption",
								className: "text-sm font-medium text-foreground",
								children: "Caption (optional)"
							}), /* @__PURE__ */ jsx(Input, {
								id: "frame-caption",
								value: caption,
								onChange: (e) => setCaption(e.target.value),
								onKeyDown: handleKeyDown,
								className: "w-full bg-background border-border focus:border-primary focus:ring-primary/20",
								placeholder: "Add a caption for this frame",
								autoFocus: true,
								spellCheck: false
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, {
								htmlFor: "frame-padding",
								className: "text-sm font-medium text-foreground",
								children: "Padding Size"
							}), /* @__PURE__ */ jsxs("select", {
								id: "frame-padding",
								value: padding,
								onChange: (e) => setPadding(e.target.value),
								className: "w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background hover:cursor-pointer",
								children: [
									/* @__PURE__ */ jsx("option", {
										value: "sm",
										children: "Small (0.5rem)"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "md",
										children: "Medium (1rem)"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "lg",
										children: "Large (1.5rem)"
									}),
									/* @__PURE__ */ jsx("option", {
										value: "xl",
										children: "Extra Large (2rem)"
									})
								]
							})]
						})]
					}), /* @__PURE__ */ jsxs("div", {
						className: "px-6 py-4 border-t border-border flex justify-end gap-3",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: onCloseAction,
							className: "px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer",
							children: "Cancel"
						}), /* @__PURE__ */ jsx("button", {
							type: "submit",
							className: "px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer",
							children: "Save"
						})]
					})]
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: onCloseAction,
					className: "absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded hover:cursor-pointer",
					"aria-label": "Close modal",
					children: /* @__PURE__ */ jsx("svg", {
						className: "w-4 h-4",
						fill: "none",
						stroke: "currentColor",
						viewBox: "0 0 24 24",
						children: /* @__PURE__ */ jsx("path", {
							strokeLinecap: "round",
							strokeLinejoin: "round",
							strokeWidth: 2,
							d: "M6 18L18 6M6 6l12 12"
						})
					})
				})
			]
		})
	}), document.body);
}
function getPaddingClass(padding) {
	switch (padding) {
		case "sm": return "p-2";
		case "md": return "p-4";
		case "lg": return "p-6";
		case "xl": return "p-8";
		default: return "p-4";
	}
}
const FrameNodeView = React.forwardRef(function Frame$1({ nodeProps,...props }, ref) {
	const [modalOpen, setModalOpen] = useState(false);
	const caption = nodeProps.node.attrs.caption || "";
	const padding = nodeProps.node.attrs.padding || "md";
	const editable = useEditorEditable();
	const updateFrame = useEditorEventCallback((view, { caption: newCaption, padding: newPadding }) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			caption: newCaption,
			padding: newPadding
		});
		view.dispatch(tr);
		setModalOpen(false);
	});
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: "mb-4",
		children: [
			/* @__PURE__ */ jsx(FrameEditModal, {
				open: modalOpen,
				initialCaption: caption,
				initialPadding: padding,
				onCloseAction: () => setModalOpen(false),
				onSubmitAction: updateFrame
			}),
			/* @__PURE__ */ jsxs("div", {
				className: `border border-border rounded-lg ${getPaddingClass(padding)} relative ${editable ? "hover:border-primary/50 transition-colors" : ""}`,
				children: [editable && /* @__PURE__ */ jsxs(Fragment$1, { children: [
					/* @__PURE__ */ jsx("div", {
						className: "absolute top-0 left-0 right-0 h-2 cursor-pointer z-10",
						onClick: (e) => {
							e.stopPropagation();
							setModalOpen(true);
						},
						"aria-label": "Click to edit frame settings"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "absolute bottom-0 left-0 right-0 h-2 cursor-pointer z-10",
						onClick: (e) => {
							e.stopPropagation();
							setModalOpen(true);
						},
						"aria-label": "Click to edit frame settings"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "absolute top-0 bottom-0 left-0 w-2 cursor-pointer z-10",
						onClick: (e) => {
							e.stopPropagation();
							setModalOpen(true);
						},
						"aria-label": "Click to edit frame settings"
					}),
					/* @__PURE__ */ jsx("div", {
						className: "absolute top-0 bottom-0 right-0 w-2 cursor-pointer z-10",
						onClick: (e) => {
							e.stopPropagation();
							setModalOpen(true);
						},
						"aria-label": "Click to edit frame settings"
					})
				] }), /* @__PURE__ */ jsx("div", {
					className: "prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 relative z-0",
					children: /* @__PURE__ */ jsx("div", { ...props })
				})]
			}),
			caption && /* @__PURE__ */ jsx("div", {
				className: "mt-2 text-center",
				children: /* @__PURE__ */ jsx("span", {
					contentEditable: false,
					className: `text-sm text-muted-foreground italic ${editable ? "cursor-pointer hover:text-foreground transition-colors hover:cursor-pointer" : ""}`,
					onClick: (e) => {
						if (!editable) return;
						e.stopPropagation();
						setModalOpen(true);
					},
					onKeyDown: (e) => {
						if (!editable) return;
						if (e.key === "Enter" || e.key === " ") {
							e.stopPropagation();
							setModalOpen(true);
						}
					},
					tabIndex: editable ? 0 : -1,
					"aria-disabled": !editable,
					children: caption
				})
			})
		]
	});
});
const addFrameRule = new InputRule(/^<frame(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	const attrs = {
		caption: "",
		padding: "md"
	};
	if (match[1]) {
		const captionMatch = match[1].match(/caption="([^"]*)"/);
		if (captionMatch) attrs.caption = captionMatch[1];
		const paddingMatch = match[1].match(/padding="([^"]*)"/);
		if (paddingMatch) attrs.padding = paddingMatch[1];
	}
	const frame = schema$2.nodes.frame.create(attrs, schema$2.nodes.paragraph.create());
	tr.replaceRangeWith(start, end, frame);
	const newPos = start + 1;
	tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
	return tr;
});
function insertFrame(state) {
	const { from, to } = state.selection;
	const attrs = {
		caption: "",
		padding: "md"
	};
	const frame = state.schema.nodes.frame.create(attrs, state.schema.nodes.paragraph.create());
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(frame);
	const insertPos = tr.selection.from;
	const innerPos = insertPos + 1;
	tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
	return tr;
}

//#endregion
//#region src/editor/components/icon.tsx
const iconNodeSpec = {
	group: "inline",
	inline: true,
	atom: true,
	selectable: false,
	attrs: {
		name: { default: "FileText" },
		size: { default: 20 }
	},
	parseDOM: [{
		tag: "icon",
		getAttrs: (dom) => ({
			name: dom.getAttribute("name") || "FileText",
			size: parseInt(dom.getAttribute("size") || "20")
		})
	}],
	toDOM: (node) => ["icon", {
		name: node.attrs.name,
		size: node.attrs.size.toString(),
		class: `inline-flex items-center justify-center text-muted-foreground`,
		style: `width: ${node.attrs.size}px; height: ${node.attrs.size}px;`
	}]
};
const IconNodeView = React.forwardRef(function Icon({ nodeProps }, ref) {
	const [modalOpen, setModalOpen] = useState(false);
	const name = nodeProps.node.attrs.name || "FileText";
	const size = nodeProps.node.attrs.size || 20;
	const editable = useEditorEditable();
	const updateIcon = useEditorEventCallback((view, { icon: newIcon, size: newSize }) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			name: newIcon,
			size: newSize ?? node.attrs.size
		});
		view.dispatch(tr);
		setModalOpen(false);
	});
	const iconElement = resolveInlineIcon(name, {
		size,
		showIcon: true,
		fallbackIcon: DEFAULT_CARD_ICON
	});
	return /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(IconEditModal, {
		open: modalOpen,
		initialIcon: name,
		initialSize: size,
		onCloseAction: () => setModalOpen(false),
		onSubmitAction: updateIcon,
		modalTitle: "Edit Icon",
		iconLabel: "Icon Name",
		iconPlaceholder: "e.g. FileText, Book, Star, Heart",
		sizeLabel: "Size (pixels)",
		sizePlaceholder: "e.g. 16, 20, 24, 32",
		showSize: true
	}), /* @__PURE__ */ jsx("span", {
		"data-icon": "",
		"data-name": name,
		className: `inline-flex items-center justify-center text-muted-foreground ${editable ? "cursor-pointer hover:cursor-pointer hover:text-foreground transition-colors" : ""}`,
		ref,
		contentEditable: false,
		suppressContentEditableWarning: true,
		onClick: (e) => {
			if (!editable) return;
			e.stopPropagation();
			setModalOpen(true);
		},
		onKeyDown: (e) => {
			if (!editable) return;
			if (e.key === "Enter" || e.key === " ") {
				e.stopPropagation();
				setModalOpen(true);
			}
		},
		tabIndex: editable ? 0 : -1,
		"aria-disabled": !editable,
		"aria-label": editable ? `Change icon (currently ${name})` : void 0,
		title: editable ? `Click to change icon (${name})` : name,
		children: iconElement
	})] });
});
const addIconRule = new InputRule(/^<icon(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	const attrs = {
		name: "FileText",
		size: 20
	};
	if (match[1]) {
		const nameMatch = match[1].match(/name="([^"]*)"/);
		if (nameMatch) attrs.name = nameMatch[1];
		const sizeMatch = match[1].match(/size="([^"]*)"/);
		if (sizeMatch) attrs.size = parseInt(sizeMatch[1]) || 20;
	}
	if (!schema$2.nodes.icon) return null;
	const iconNode = schema$2.nodes.icon.create(attrs);
	tr.replaceRangeWith(start, end, iconNode);
	tr.setSelection(Selection.near(tr.doc.resolve(start + iconNode.nodeSize)));
	return tr;
});
function insertIcon(state) {
	const { from, to } = state.selection;
	const attrs = {
		name: "FileText",
		size: 20
	};
	const iconNode = state.schema.nodes.icon.create(attrs);
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(iconNode);
	tr = tr.setSelection(Selection.near(tr.doc.resolve(tr.selection.from + iconNode.nodeSize)));
	return tr;
}

//#endregion
//#region src/components/ui/textarea.tsx
function Textarea({ className,...props }) {
	return /* @__PURE__ */ jsx("textarea", {
		"data-slot": "textarea",
		className: cn("border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		...props
	});
}

//#endregion
//#region src/editor/components/mermaid.tsx
const mermaidNodeSpec = {
	group: "block",
	content: "text*",
	marks: "",
	code: true,
	attrs: {
		code: { default: "graph TD\n    A[Start] --> B[End]" },
		size: { default: "md" },
		showBorder: { default: true }
	},
	selectable: true,
	parseDOM: [{
		tag: "mermaid",
		getAttrs: (dom) => ({
			code: dom.textContent || "graph TD\n    A[Start] --> B[End]",
			size: dom.getAttribute("size") || "md",
			showBorder: dom.getAttribute("showBorder") !== "false"
		})
	}],
	toDOM: (node) => [
		"mermaid",
		{
			class: "mermaid-diagram",
			size: node.attrs.size,
			showBorder: node.attrs.showBorder?.toString()
		},
		node.attrs.code
	]
};
mermaid.initialize({
	startOnLoad: false,
	theme: "dark",
	securityLevel: "loose",
	fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
	flowchart: {
		useMaxWidth: true,
		htmlLabels: true,
		curve: "cardinal"
	},
	gantt: {
		useMaxWidth: true,
		fontSize: 11
	},
	sequence: { useMaxWidth: true },
	themeVariables: {
		fontSize: "12px",
		fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace"
	}
});
function MermaidEditModal({ open, initialCode, initialSize, onCloseAction, onSubmitAction }) {
	const [code, setCode] = useState(initialCode);
	const [size, setSize] = useState(initialSize || "md");
	const [error, setError] = useState(null);
	const [isVisible, setIsVisible] = useState(false);
	useEffect(() => {
		setCode(initialCode);
		setSize(initialSize || "md");
		setError(null);
	}, [
		initialCode,
		initialSize,
		open
	]);
	useEffect(() => {
		if (open) setIsVisible(true);
		else {
			const timer = setTimeout(() => setIsVisible(false), 200);
			return () => clearTimeout(timer);
		}
	}, [open]);
	if (!isVisible) return null;
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await mermaid.parse(code);
			setError(null);
			onSubmitAction(code, size);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Invalid mermaid syntax");
		}
	};
	const handleKeyDown = (e) => {
		if (e.key === "Enter" && e.ctrlKey) {
			e.preventDefault();
			handleSubmit(e);
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCloseAction();
		}
	};
	const handleBackdropClick = (e) => {
		if (e.target === e.currentTarget) onCloseAction();
	};
	return ReactDOM.createPortal(/* @__PURE__ */ jsx("div", {
		className: `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`,
		onClick: handleBackdropClick,
		onKeyDown: handleKeyDown,
		tabIndex: -1,
		children: /* @__PURE__ */ jsxs("div", {
			className: `relative bg-background border border-border shadow-2xl rounded-lg min-w-[500px] max-w-[90vw] w-full mx-4 transform transition-all duration-200 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "px-6 py-4 border-b border-border",
					children: /* @__PURE__ */ jsx("h2", {
						className: "text-lg font-semibold text-foreground",
						children: "Edit Mermaid Diagram"
					})
				}),
				/* @__PURE__ */ jsxs("form", {
					onSubmit: handleSubmit,
					children: [/* @__PURE__ */ jsxs("div", {
						className: "px-6 py-4 space-y-4",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "mermaid-code",
									className: "text-sm font-medium text-foreground",
									children: "Mermaid Code"
								}), /* @__PURE__ */ jsx(Textarea, {
									id: "mermaid-code",
									value: code,
									onChange: (e) => setCode(e.target.value),
									onKeyDown: handleKeyDown,
									className: "min-h-[200px] font-mono text-sm w-full bg-background border-border focus:border-primary focus:ring-primary/20",
									placeholder: "Enter your mermaid diagram code...",
									autoFocus: true
								})]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "diagram-size",
									className: "text-sm font-medium text-foreground",
									children: "Diagram Size"
								}), /* @__PURE__ */ jsxs("select", {
									id: "diagram-size",
									value: size,
									onChange: (e) => setSize(e.target.value),
									className: "w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 bg-background hover:cursor-pointer",
									children: [
										/* @__PURE__ */ jsx("option", {
											value: "sm",
											children: "Small (300px max width)"
										}),
										/* @__PURE__ */ jsx("option", {
											value: "md",
											children: "Medium (500px max width)"
										}),
										/* @__PURE__ */ jsx("option", {
											value: "lg",
											children: "Large (700px max width)"
										}),
										/* @__PURE__ */ jsx("option", {
											value: "xl",
											children: "Extra Large (900px max width)"
										}),
										/* @__PURE__ */ jsx("option", {
											value: "full",
											children: "Full Width"
										})
									]
								})]
							}),
							error && /* @__PURE__ */ jsx("div", {
								className: "text-destructive text-sm bg-destructive/10 p-2 rounded border",
								children: error
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "text-xs text-muted-foreground",
								children: [
									"Learn more about mermaid syntax at",
									" ",
									/* @__PURE__ */ jsx("a", {
										href: "https://mermaid.js.org/",
										target: "_blank",
										rel: "noopener noreferrer",
										className: "underline hover:text-foreground hover:cursor-pointer",
										children: "mermaid.js.org"
									})
								]
							})
						]
					}), /* @__PURE__ */ jsxs("div", {
						className: "px-6 py-4 border-t border-border flex justify-end gap-3",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: onCloseAction,
							className: "px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer",
							children: "Cancel"
						}), /* @__PURE__ */ jsx("button", {
							type: "submit",
							className: "px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 hover:cursor-pointer",
							children: "Save"
						})]
					})]
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: onCloseAction,
					className: "absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded hover:cursor-pointer",
					"aria-label": "Close modal",
					children: /* @__PURE__ */ jsx("svg", {
						className: "w-4 h-4",
						fill: "none",
						stroke: "currentColor",
						viewBox: "0 0 24 24",
						children: /* @__PURE__ */ jsx("path", {
							strokeLinecap: "round",
							strokeLinejoin: "round",
							strokeWidth: 2,
							d: "M6 18L18 6M6 6l12 12"
						})
					})
				})
			]
		})
	}), document.body);
}
function getDiagramSizeStyles(size) {
	switch (size) {
		case "sm": return {
			maxWidth: "300px",
			maxHeight: "200px"
		};
		case "md": return {
			maxWidth: "500px",
			maxHeight: "300px"
		};
		case "lg": return {
			maxWidth: "700px",
			maxHeight: "400px"
		};
		case "xl": return {
			maxWidth: "900px",
			maxHeight: "500px"
		};
		case "full": return {
			maxWidth: "100%",
			maxHeight: "600px"
		};
		default: return {
			maxWidth: "500px",
			maxHeight: "300px"
		};
	}
}
const MermaidNodeView = React.forwardRef(function Mermaid({ nodeProps,...props }, ref) {
	const [modalOpen, setModalOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const [error, setError] = useState(null);
	const [isHovered, setIsHovered] = useState(false);
	const diagramRef = useRef(null);
	const code = nodeProps.node.attrs.code || "graph TD\n    A[Start] --> B[End]";
	const size = nodeProps.node.attrs.size || "md";
	const showBorder = nodeProps.node.attrs.showBorder ?? true;
	const editable = useEditorEditable();
	const updateCode = useEditorEventCallback((view, newCode, newSize) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			code: newCode,
			...newSize && { size: newSize }
		});
		const textNode = view.state.schema.text(newCode);
		tr.replaceWith(pos + 1, pos + 1 + node.content.size, textNode);
		const newNode = tr.doc.nodeAt(pos);
		if (newNode) {
			const afterPos = pos + newNode.nodeSize;
			const isLastNode = afterPos >= tr.doc.content.size;
			const nextNode = !isLastNode ? tr.doc.nodeAt(afterPos) : null;
			if (isLastNode || nextNode && nextNode.type.name !== "paragraph") {
				const emptyParagraph = view.state.schema.nodes.paragraph.create();
				tr.insert(afterPos, emptyParagraph);
			}
		}
		view.dispatch(tr);
		setModalOpen(false);
	});
	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2e3);
		} catch (err) {
			console.error("Failed to copy code: ", err);
		}
	};
	const handleEdit = () => {
		if (!editable) return;
		setModalOpen(true);
	};
	const toggleBorder = useEditorEventCallback((view) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") return;
		const pos = getPos();
		if (typeof pos !== "number") return;
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			showBorder: !showBorder
		});
		view.dispatch(tr);
	});
	useEffect(() => {
		const renderDiagram = async () => {
			if (!diagramRef.current) return;
			try {
				setError(null);
				diagramRef.current.innerHTML = "";
				const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
				const { svg } = await mermaid.render(id, code);
				diagramRef.current.innerHTML = svg;
				const svgElement = diagramRef.current.querySelector("svg");
				if (svgElement) {
					svgElement.removeAttribute("width");
					svgElement.removeAttribute("height");
					const sizeStyles = getDiagramSizeStyles(size);
					svgElement.style.maxWidth = "100%";
					svgElement.style.maxHeight = sizeStyles.maxHeight;
					svgElement.style.width = "100%";
					svgElement.style.height = "auto";
					svgElement.style.display = "block";
					const viewBox = svgElement.getAttribute("viewBox");
					if (viewBox) svgElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Invalid mermaid syntax");
				if (diagramRef.current) diagramRef.current.innerHTML = `
            <div class="p-4 text-center text-destructive bg-destructive/10 rounded border" role="alert">
              <p class="font-medium">Error rendering diagram</p>
              <p class="text-sm mt-1">${err instanceof Error ? err.message : "Invalid mermaid syntax"}</p>
            </div>
          `;
			}
		};
		renderDiagram();
	}, [
		code,
		error,
		size
	]);
	return /* @__PURE__ */ jsxs("div", {
		ref,
		className: `relative ${showBorder ? "border border-border" : ""} bg-card rounded-lg overflow-hidden mb-2`,
		onMouseEnter: () => setIsHovered(true),
		onMouseLeave: () => setIsHovered(false),
		...props,
		children: [
			/* @__PURE__ */ jsx(MermaidEditModal, {
				open: modalOpen,
				initialCode: code,
				initialSize: size,
				onCloseAction: () => setModalOpen(false),
				onSubmitAction: updateCode
			}),
			editable && /* @__PURE__ */ jsxs("div", {
				className: `absolute top-2 right-2 flex items-center gap-2 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0 pointer-events-none"} z-10 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg border border-border`,
				children: [
					/* @__PURE__ */ jsxs("button", {
						onClick: handleEdit,
						className: "flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 rounded px-2 py-1 transition-colors text-xs font-medium hover:cursor-pointer",
						title: "Edit diagram",
						contentEditable: false,
						children: [/* @__PURE__ */ jsx(Edit, { className: "w-3 h-3" }), "Edit"]
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: toggleBorder,
						className: "flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded px-2 py-1 transition-colors text-xs font-medium hover:cursor-pointer",
						title: showBorder ? "Hide border" : "Show border",
						contentEditable: false,
						children: showBorder ? /* @__PURE__ */ jsx(Square, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(SquareDashed, { className: "w-3 h-3" })
					}),
					/* @__PURE__ */ jsxs("button", {
						onClick: handleCopy,
						className: "flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded px-2 py-1 transition-colors text-xs font-medium hover:cursor-pointer",
						title: "Copy code",
						contentEditable: false,
						children: [copied ? /* @__PURE__ */ jsx(Check, { className: "w-3 h-3" }) : /* @__PURE__ */ jsx(Copy, { className: "w-3 h-3" }), copied ? "Copied!" : "Copy"]
					})
				]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "p-4",
				children: /* @__PURE__ */ jsx("div", {
					ref: diagramRef,
					className: "flex justify-center items-center min-h-[100px] w-full",
					contentEditable: false,
					style: {
						...getDiagramSizeStyles(size),
						overflow: "auto",
						margin: "0 auto"
					},
					role: "img",
					"aria-label": "Mermaid diagram"
				})
			})
		]
	});
});
const addMermaidRule = new InputRule(/^<mermaid(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	let code = "graph TD\n    A[Start] --> B[End]";
	if (match[1]) {
		const codeMatch = match[1].match(/code="([^"]*)"/);
		if (codeMatch) code = codeMatch[1].replace(/\\n/g, "\n");
	}
	const mermaidNode = schema$2.nodes.mermaid.create({ code }, schema$2.text(code));
	tr.replaceRangeWith(start, end, mermaidNode);
	const insertedNode = tr.doc.nodeAt(start);
	if (insertedNode) {
		const afterPos = start + insertedNode.nodeSize;
		const isLastNode = afterPos >= tr.doc.content.size;
		const nextNode = !isLastNode ? tr.doc.nodeAt(afterPos) : null;
		if (isLastNode || nextNode && nextNode.type.name !== "paragraph") {
			const emptyParagraph = schema$2.nodes.paragraph.create();
			tr.insert(afterPos, emptyParagraph);
		}
	}
	const newPos = start + 1;
	tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
	return tr;
});
function insertMermaid(state) {
	const { from, to } = state.selection;
	const attrs = {
		code: "graph TD\n    A[Start] --> B[End]",
		size: "md",
		showBorder: true
	};
	const mermaidNode = state.schema.nodes.mermaid.create(attrs, state.schema.text(attrs.code));
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(mermaidNode);
	const insertPos = from;
	const insertedNode = tr.doc.nodeAt(insertPos);
	if (insertedNode) {
		const afterPos = insertPos + insertedNode.nodeSize;
		const isLastNode = afterPos >= tr.doc.content.size;
		const nextNode = !isLastNode ? tr.doc.nodeAt(afterPos) : null;
		if (isLastNode || nextNode && nextNode.type.name !== "paragraph") {
			const emptyParagraph = state.schema.nodes.paragraph.create();
			tr = tr.insert(afterPos, emptyParagraph);
			const paragraphPos = afterPos + 1;
			tr = tr.setSelection(Selection.near(tr.doc.resolve(paragraphPos)));
		} else tr = tr.setSelection(Selection.near(tr.doc.resolve(afterPos)));
	}
	return tr;
}

//#endregion
//#region src/editor/components/modals/TooltipPromptModal.tsx
function TooltipPromptModal({ open, initialTooltip = "", onCloseAction, onSubmitAction, onRemoveAction, isEditing = false }) {
	const [tooltipText, setTooltipText] = useState(initialTooltip);
	const [isVisible, setIsVisible] = useState(false);
	useEffect(() => {
		setTooltipText(initialTooltip);
	}, [initialTooltip, open]);
	useEffect(() => {
		if (open) setIsVisible(true);
		else {
			const timer = setTimeout(() => setIsVisible(false), 200);
			return () => clearTimeout(timer);
		}
	}, [open]);
	if (!isVisible) return null;
	function handleSubmit() {
		const trimmed = tooltipText.trim();
		if (trimmed) onSubmitAction(trimmed);
	}
	function handleKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onCloseAction();
		}
	}
	function handleBackdropClick(e) {
		if (e.target === e.currentTarget) onCloseAction();
	}
	return ReactDOM.createPortal(/* @__PURE__ */ jsx("div", {
		className: `fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`,
		onClick: handleBackdropClick,
		onKeyDown: handleKeyDown,
		tabIndex: -1,
		children: /* @__PURE__ */ jsxs("div", {
			className: `relative bg-background border border-border shadow-2xl rounded-lg min-w-[400px] max-w-[90vw] w-full mx-4 transform transition-all duration-200 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ jsx("div", {
					className: "px-6 py-4 border-b border-border",
					children: /* @__PURE__ */ jsx("h2", {
						className: "text-lg font-semibold text-foreground",
						children: isEditing ? "Edit Tooltip" : "Add Tooltip"
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "px-6 py-4 space-y-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "tooltip-text-input",
							className: "text-sm font-medium text-foreground",
							children: "Tooltip Text"
						}), /* @__PURE__ */ jsx(Input, {
							id: "tooltip-text-input",
							value: tooltipText,
							autoFocus: true,
							onChange: (e) => setTooltipText(e.target.value),
							onKeyDown: handleKeyDown,
							className: "w-full bg-background border-border focus:border-primary focus:ring-primary/20",
							placeholder: "Enter tooltip text...",
							spellCheck: false
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "text-sm text-muted-foreground",
						children: "This will add a tooltip to the selected text. Hover over the text to see the tooltip."
					})]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "px-6 py-4 border-t border-border flex justify-between",
					children: [/* @__PURE__ */ jsx("div", { children: isEditing && onRemoveAction && /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: onRemoveAction,
						className: "px-4 py-2 text-sm font-medium text-destructive bg-transparent border border-destructive rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-destructive/20",
						children: "Remove Tooltip"
					}) }), /* @__PURE__ */ jsxs("div", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: onCloseAction,
							className: "px-4 py-2 text-sm font-medium text-muted-foreground bg-transparent border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20",
							children: "Cancel"
						}), /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: handleSubmit,
							disabled: !tooltipText.trim(),
							className: "px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed",
							children: isEditing ? "Update Tooltip" : "Apply Tooltip"
						})]
					})]
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: onCloseAction,
					className: "absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded",
					"aria-label": "Close modal",
					children: /* @__PURE__ */ jsx("svg", {
						className: "w-4 h-4",
						fill: "none",
						stroke: "currentColor",
						viewBox: "0 0 24 24",
						children: /* @__PURE__ */ jsx("path", {
							strokeLinecap: "round",
							strokeLinejoin: "round",
							strokeWidth: 2,
							d: "M6 18L18 6M6 6l12 12"
						})
					})
				})
			]
		})
	}), document.body);
}

//#endregion
//#region src/editor/components/steps.tsx
const stepNodeSpec = {
	group: "block",
	content: "block+",
	attrs: {
		title: { default: "" },
		stepNumber: { default: 1 }
	},
	selectable: true,
	parseDOM: [{
		tag: "step",
		getAttrs: (dom) => ({
			title: dom.getAttribute("title") || "",
			stepNumber: parseInt(dom.getAttribute("stepNumber") || "1")
		})
	}],
	toDOM: (node) => [
		"step",
		{
			title: node.attrs.title,
			stepNumber: node.attrs.stepNumber.toString()
		},
		0
	]
};
const StepNodeView = React.forwardRef(function Step({ nodeProps, children,...props }, ref) {
	const [modalOpen, setModalOpen] = useState(false);
	const [numberModalOpen, setNumberModalOpen] = useState(false);
	const title = nodeProps.node.attrs.title || "";
	const stepNumber = nodeProps.node.attrs.stepNumber || 1;
	const editable = useEditorEditable();
	const updateTitle = useEditorEventCallback((view, newTitle) => {
		const { getPos, node } = nodeProps;
		if (typeof getPos !== "function") {
			console.error("getPos is not a function");
			return;
		}
		const pos = getPos();
		if (typeof pos !== "number") {
			console.error("getPos did not return a number");
			return;
		}
		const tr = view.state.tr;
		tr.setNodeMarkup(pos, void 0, {
			...node.attrs,
			title: newTitle
		});
		view.dispatch(tr);
		setModalOpen(false);
	});
	const createNewStep = useEditorEventCallback((view) => {
		const { getPos } = nodeProps;
		if (typeof getPos !== "function") return;
		const pos = getPos();
		if (typeof pos !== "number") return;
		const tr = view.state.tr;
		const nextStepNumber = stepNumber + 1;
		const insertPos = pos + nodeProps.node.nodeSize;
		const $insertPos = tr.doc.resolve(insertPos);
		if ($insertPos.nodeAfter && $insertPos.nodeAfter.type.name === "step") {
			const updateStepNumbers = (doc, startPos, increment) => {
				doc.descendants((node, pos$1) => {
					if (node.type.name === "step" && pos$1 >= startPos) {
						const currentNumber = node.attrs.stepNumber;
						tr.setNodeMarkup(pos$1, void 0, {
							...node.attrs,
							stepNumber: currentNumber + increment
						});
					}
				});
			};
			updateStepNumbers(tr.doc, insertPos, 1);
		}
		const newStep = view.state.schema.nodes.step.create({
			title: "",
			stepNumber: nextStepNumber
		}, view.state.schema.nodes.paragraph.create());
		tr.insert(insertPos, newStep);
		tr.setSelection(Selection.near(tr.doc.resolve(insertPos + 1)));
		view.dispatch(tr);
		view.focus();
	});
	useStopEvent((view, event) => {
		if (!editable) return false;
		if (event instanceof KeyboardEvent && event.key === "Enter" && !event.shiftKey) {
			const { $head, empty } = view.state.selection;
			if (empty && $head.parent.type.name === "paragraph" && $head.parent.content.size === 0) {
				event.preventDefault();
				createNewStep();
				return true;
			}
		}
		return false;
	});
	return /* @__PURE__ */ jsxs("div", {
		ref,
		"data-step": "",
		className: "relative flex gap-4",
		...props,
		children: [
			/* @__PURE__ */ jsx(TitleDescriptionEditModal, {
				open: modalOpen,
				initialTitle: title,
				onCloseAction: () => setModalOpen(false),
				onSubmitAction: ({ title: title$1 }) => updateTitle(title$1),
				titleLabel: "Title",
				modalTitle: "Edit Step Title",
				showDescription: false,
				titlePlaceholder: "Step title"
			}),
			/* @__PURE__ */ jsx(TitleDescriptionEditModal, {
				open: numberModalOpen,
				initialTitle: stepNumber.toString(),
				onCloseAction: () => setNumberModalOpen(false),
				onSubmitAction: ({ title: title$1 }) => {
					const newNumber = parseInt(title$1);
					if (!isNaN(newNumber) && newNumber > 0) updateTitle(newNumber.toString());
				},
				titleLabel: "Step Number",
				modalTitle: "Edit Step Number",
				showDescription: false,
				titlePlaceholder: "1"
			}),
			/* @__PURE__ */ jsxs("div", {
				contentEditable: false,
				className: "flex flex-col items-center flex-shrink-0",
				children: [/* @__PURE__ */ jsx("button", {
					className: `flex h-8 w-8 min-h-[2rem] min-w-[2rem] items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground flex-shrink-0 ${editable ? "cursor-pointer hover:cursor-pointer hover:bg-secondary/80 transition-colors" : ""}`,
					onClick: (e) => {
						if (!editable) return;
						e.stopPropagation();
						setNumberModalOpen(true);
					},
					onKeyDown: (e) => {
						if (!editable) return;
						if (e.key === "Enter" || e.key === " ") {
							e.stopPropagation();
							setNumberModalOpen(true);
						}
					},
					tabIndex: editable ? 0 : -1,
					"aria-disabled": !editable,
					"aria-label": editable ? `Change step number (currently ${stepNumber})` : void 0,
					children: stepNumber
				}), /* @__PURE__ */ jsx("div", { className: "mt-2 h-full min-h-[3rem] w-px bg-border" })]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex-1 pb-4",
				children: [title && /* @__PURE__ */ jsx("button", {
					contentEditable: false,
					className: `mb-3 text-lg font-semibold text-foreground ${editable ? "cursor-pointer hover:cursor-pointer" : ""}`,
					onClick: (e) => {
						if (!editable) return;
						e.stopPropagation();
						setModalOpen(true);
					},
					tabIndex: editable ? 0 : -1,
					onKeyDown: (e) => {
						if (!editable) return;
						if (e.key === "Enter" || e.key === " ") {
							e.stopPropagation();
							setModalOpen(true);
						}
					},
					"aria-disabled": !editable,
					children: title
				}), /* @__PURE__ */ jsx("div", {
					className: "text-muted-foreground prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
					children
				})]
			})
		]
	});
});
const findNextStepNumber = (state) => {
	let maxStepNumber = 0;
	state.doc.descendants((node) => {
		if (node.type.name === "step") {
			const stepNum = node.attrs.stepNumber || 1;
			if (stepNum > maxStepNumber) maxStepNumber = stepNum;
		}
	});
	return maxStepNumber + 1;
};
const addStepRule = new InputRule(/^<step(?:\s+([^>]+))?(?:\s*\/>|\s*>)/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	let title = "";
	let stepNumber = 1;
	if (match[1]) {
		const titleMatch = match[1].match(/title="([^"]*)"/);
		if (titleMatch) title = titleMatch[1];
		const numberMatch = match[1].match(/stepNumber="([^"]*)"/);
		if (numberMatch) stepNumber = parseInt(numberMatch[1]) || 1;
		else stepNumber = findNextStepNumber(state);
	} else stepNumber = findNextStepNumber(state);
	const step = schema$2.nodes.step.create({
		title,
		stepNumber
	}, schema$2.nodes.paragraph.create());
	tr.replaceRangeWith(start, end, step);
	const newPos = start + 1;
	tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
	return tr;
});
function insertStep(state) {
	const { from, to } = state.selection;
	const attrs = {
		title: "Step Title",
		stepNumber: findNextStepNumber(state)
	};
	const step = state.schema.nodes.step.create(attrs, state.schema.nodes.paragraph.create());
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(step);
	const insertPos = tr.selection.from;
	const innerPos = insertPos + 1;
	tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
	return tr;
}

//#endregion
//#region src/editor/components/tabs.tsx
const tabsNodeSpec = {
	group: "block",
	content: "block+",
	attrs: {
		tabNames: { default: ["Tab 1"] },
		activeTab: { default: 0 },
		tabContents: { default: {} }
	},
	defining: true,
	selectable: true,
	parseDOM: [{
		tag: "tabs",
		getAttrs: (dom) => {
			const el = dom;
			let tabNames = JSON.parse(el.getAttribute("tabNames") || "[]");
			let activeTab = parseInt(el.getAttribute("activeTab") || "0");
			let tabContents = JSON.parse(el.getAttribute("tabContents") || "{}");
			if (tabNames.length === 0) {
				const elementsToProcess = Array.from(el.querySelectorAll("pre > code"));
				if (elementsToProcess.length > 0) {
					const newTabNames = [];
					const newTabContents = {};
					for (let i = 0; i < elementsToProcess.length; i++) {
						const cs = elementsToProcess[i];
						const language = cs.getAttribute("data-language") || cs.getAttribute("language") || "javascript";
						let title = cs.getAttribute("title");
						const content = cs.getAttribute("content") || cs.textContent || "";
						if (!title && cs.tagName.toLowerCase() === "code") {
							const preElement = cs.parentElement;
							if (preElement && preElement.tagName.toLowerCase() === "pre") title = preElement.getAttribute("title");
						}
						const tabName = title || language.charAt(0).toUpperCase() + language.slice(1);
						newTabNames.push(tabName);
						const tabContent = [{
							type: "code_snippet",
							attrs: {
								language,
								title: title || ""
							},
							content: content ? [{
								type: "text",
								text: content
							}] : []
						}];
						newTabContents[i] = tabContent;
					}
					tabNames = newTabNames;
					tabContents = newTabContents;
					activeTab = 0;
				}
			}
			if (tabNames.length === 0) {
				tabNames = ["Tab 1"];
				tabContents = {};
			}
			return {
				tabNames,
				activeTab,
				tabContents
			};
		},
		getContent: (dom, schema$2) => {
			const el = dom;
			const elementsToProcess = Array.from(el.querySelectorAll("pre > code"));
			if (elementsToProcess.length > 0) {
				const firstElement = elementsToProcess[0];
				const language = firstElement.getAttribute("data-language") || firstElement.getAttribute("language") || "javascript";
				let title = firstElement.getAttribute("title");
				const content = firstElement.getAttribute("content") || firstElement.textContent || "";
				if (!title && firstElement.tagName.toLowerCase() === "code") {
					const preElement = firstElement.parentElement;
					if (preElement && preElement.tagName.toLowerCase() === "pre") title = preElement.getAttribute("title");
				}
				return Fragment.fromJSON(schema$2, [{
					type: "code_snippet",
					attrs: {
						language,
						title: title || ""
					},
					content: content ? [{
						type: "text",
						text: content
					}] : []
				}]);
			}
			return Fragment.fromJSON(schema$2, [{ type: "paragraph" }]);
		}
	}],
	toDOM: (node) => [
		"tabs",
		{
			tabNames: JSON.stringify(node.attrs.tabNames),
			activeTab: JSON.stringify(node.attrs.activeTab),
			tabContents: JSON.stringify(node.attrs.tabContents)
		},
		0
	]
};
const TabsNodeView = React.forwardRef(function Tabs({ nodeProps,...props }, ref) {
	const tabNames = nodeProps.node.attrs.tabNames ?? ["Tab 1"];
	const activeTab = nodeProps.node.attrs.activeTab ?? 0;
	const tabContents = nodeProps.node.attrs.tabContents ?? {};
	const { node } = nodeProps;
	const editable = useEditorEditable();
	const [modalOpen, setModalOpen] = useState(false);
	const [editingTabIndex, setEditingTabIndex] = useState(null);
	const switchTab = useEditorEventCallback((view, newIdx) => {
		if (activeTab === newIdx) return;
		const currentContent = node.content.toJSON();
		const updatedTabContents = {
			...tabContents,
			[activeTab]: currentContent
		};
		const newTabContent = updatedTabContents[newIdx];
		const tr = view.state.tr;
		tr.setNodeMarkup(nodeProps.getPos(), null, {
			...node.attrs,
			activeTab: newIdx,
			tabContents: updatedTabContents
		});
		if (newTabContent) {
			const newFragment = Fragment.fromJSON(node.type.schema, newTabContent);
			tr.replaceWith(nodeProps.getPos() + 1, nodeProps.getPos() + 1 + node.content.size, newFragment);
		} else tr.replaceWith(nodeProps.getPos() + 1, nodeProps.getPos() + 1 + node.content.size, node.type.schema.nodes.paragraph.create());
		view.dispatch(tr);
	});
	const updateTabName = useEditorEventCallback((view, tabIndex, newName) => {
		const updatedTabNames = [...tabNames];
		updatedTabNames[tabIndex] = newName;
		const tr = view.state.tr;
		tr.setNodeMarkup(nodeProps.getPos(), null, {
			...node.attrs,
			tabNames: updatedTabNames
		});
		view.dispatch(tr);
	});
	const addNewTab = useEditorEventCallback((view) => {
		const newTabIndex = tabNames.length;
		const newTabName = `Tab ${newTabIndex + 1}`;
		const updatedTabNames = [...tabNames, newTabName];
		const currentContent = node.content.toJSON();
		const updatedTabContents = {
			...tabContents,
			[activeTab]: currentContent
		};
		const tr = view.state.tr;
		tr.setNodeMarkup(nodeProps.getPos(), null, {
			...node.attrs,
			tabNames: updatedTabNames,
			activeTab: newTabIndex,
			tabContents: updatedTabContents
		});
		tr.replaceWith(nodeProps.getPos() + 1, nodeProps.getPos() + 1 + node.content.size, node.type.schema.nodes.paragraph.create());
		view.dispatch(tr);
	});
	const deleteTab = useEditorEventCallback((view, tabIndex) => {
		if (tabNames.length <= 1) return;
		const updatedTabNames = tabNames.filter((_, index) => index !== tabIndex);
		const updatedTabContents = { ...tabContents };
		delete updatedTabContents[tabIndex];
		let newActiveTab = activeTab;
		if (tabIndex === activeTab) newActiveTab = tabIndex > 0 ? tabIndex - 1 : 0;
		else if (tabIndex < activeTab) newActiveTab = activeTab - 1;
		const reindexedTabContents = {};
		Object.entries(updatedTabContents).forEach(([key, value]) => {
			const oldIndex = parseInt(key);
			if (oldIndex < tabIndex) reindexedTabContents[oldIndex] = value;
			else if (oldIndex > tabIndex) reindexedTabContents[oldIndex - 1] = value;
		});
		const tr = view.state.tr;
		tr.setNodeMarkup(nodeProps.getPos(), null, {
			...node.attrs,
			tabNames: updatedTabNames,
			activeTab: newActiveTab,
			tabContents: reindexedTabContents
		});
		const newActiveTabContent = reindexedTabContents[newActiveTab];
		if (newActiveTabContent) {
			const newFragment = Fragment.fromJSON(node.type.schema, newActiveTabContent);
			tr.replaceWith(nodeProps.getPos() + 1, nodeProps.getPos() + 1 + node.content.size, newFragment);
		} else tr.replaceWith(nodeProps.getPos() + 1, nodeProps.getPos() + 1 + node.content.size, node.type.schema.nodes.paragraph.create());
		view.dispatch(tr);
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "border border-border bg-card shadow-sm rounded-lg mb-2",
		children: [
			/* @__PURE__ */ jsx(TitleDescriptionEditModal, {
				open: modalOpen && editingTabIndex !== null,
				initialTitle: editingTabIndex !== null ? tabNames[editingTabIndex] || "" : "",
				onCloseAction: () => {
					setModalOpen(false);
					setEditingTabIndex(null);
				},
				onSubmitAction: ({ title }) => {
					if (editingTabIndex !== null) updateTabName(editingTabIndex, title);
					setModalOpen(false);
					setEditingTabIndex(null);
				},
				titleLabel: "Tab Name",
				modalTitle: "Edit Tab Name",
				showDescription: false,
				titlePlaceholder: "Enter tab name"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-row rounded-t-lg border-b border-border",
				children: [tabNames.map((tab, i) => {
					const isFirst = i === 0;
					const isActive = i === activeTab;
					return /* @__PURE__ */ jsxs("div", {
						className: `
                ${isFirst ? "rounded-tl-lg" : ""}
                ${isActive ? "bg-secondary/60 text-secondary-foreground" : "text-muted-foreground"}
                hover:bg-secondary/60 hover:text-secondary-foreground
                px-4 py-2 border-b-2 border-transparent hover:border-border
                transition-colors duration-100 hover:cursor-pointer
                min-w-0 flex-1
                flex items-center justify-between
              `,
						onClick: () => switchTab(i),
						children: [/* @__PURE__ */ jsx("span", {
							contentEditable: false,
							className: `
                  ${isActive ? "text-foreground" : "text-muted-foreground"}
                  ${editable ? "cursor-pointer hover:cursor-pointer hover:underline" : ""}
                  inline-block font-mono text-sm
                `,
							onClick: (e) => {
								if (!editable) return;
								e.stopPropagation();
								setEditingTabIndex(i);
								setModalOpen(true);
							},
							onDoubleClick: (e) => {
								if (!editable) return;
								e.stopPropagation();
								setEditingTabIndex(i);
								setModalOpen(true);
							},
							children: tab || `Tab ${i + 1}`
						}), tabNames.length > 1 && editable && /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: (e) => {
								e.stopPropagation();
								deleteTab(i);
							},
							className: "ml-2 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors duration-100 hover:cursor-pointer",
							title: "Delete tab",
							children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
						})]
					}, tab);
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => addNewTab(),
					className: "px-3 py-2 border-b-2 border-transparent text-muted-foreground hover:text-secondary-foreground hover:bg-secondary/60 transition-colors duration-100 hover:cursor-pointer rounded-tr-lg flex items-center justify-center",
					title: "Add new tab",
					children: /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" })
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				...props,
				className: "pt-1 px-4 pb-4 prose prose-sm max-w-none text-card-foreground",
				ref
			})
		]
	});
});
const addTabsRule = new InputRule(/^<tabs\s*\/>/, (state, match, start, end) => {
	const { tr, schema: schema$2 } = state;
	const tabs = schema$2.nodes.tabs.create({ tabNames: ["Tab 1"] }, schema$2.nodes.paragraph.create());
	tr.replaceRangeWith(start, end, tabs);
	const newPos = start + 1;
	tr.setSelection(Selection.near(tr.doc.resolve(newPos)));
	return tr;
});
function insertTabs(state) {
	const { from, to } = state.selection;
	const attrs = {
		tabNames: ["Tab 1"],
		activeTab: 0,
		tabContents: {}
	};
	const tabs = state.schema.nodes.tabs.create(attrs, state.schema.nodes.paragraph.create());
	let tr = state.tr;
	if (from !== to) tr = tr.delete(from, to);
	tr = tr.replaceSelectionWith(tabs);
	const insertPos = tr.selection.from;
	const innerPos = insertPos + 1;
	tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
	return tr;
}

//#endregion
//#region src/editor/schema.ts
const nodes = schema.spec.nodes.remove("code_block").append({ card: cardNodeSpec }).append({ tabs: tabsNodeSpec }).append({ callout: calloutNodeSpec }).append({ badge: badgeNodeSpec }).append({ code_snippet: codeSnippetNodeSpec }).append({ break: breakNodeSpec }).append({ step: stepNodeSpec }).append({ accordion: accordionNodeSpec }).append({ columns: columnsNodeSpec }).append({ column: columnNodeSpec }).append({ foo: fooNodeSpec }).append({ icon: iconNodeSpec }).append({ mermaid: mermaidNodeSpec }).append({ field: fieldNodeSpec }).append({ frame: frameNodeSpec });
const marks = schema.spec.marks.append({ strikethrough: {
	inclusive: false,
	parseDOM: [
		{ tag: "s" },
		{ tag: "del" },
		{ tag: "strike" },
		{
			style: "text-decoration",
			getAttrs: (value) => {
				return typeof value === "string" && value.includes("line-through") ? {} : false;
			}
		}
	],
	toDOM: () => ["s", 0]
} }).append({ tooltip_mark: {
	attrs: { tooltip: { default: "" } },
	inclusive: false,
	parseDOM: [{
		tag: "span[data-tooltip]",
		getAttrs: (dom) => ({ tooltip: dom.getAttribute("data-tooltip") || "" })
	}],
	toDOM: (mark) => [
		"span",
		{
			"data-tooltip": mark.attrs.tooltip,
			class: "underline decoration-dotted decoration-muted-foreground cursor-help hover:decoration-foreground transition-colors relative group"
		},
		0
	]
} });
const schema$1 = new Schema({
	nodes,
	marks
});

//#endregion
//#region src/editor/markdown/input.tsx
const addHeadersRule = textblockTypeInputRule(/^(#{1,4})\s$/, schema$1.nodes.heading, (match) => ({ level: match[1].length }));
const addUnorderedListRule = wrappingInputRule(/^\s*[-*+]\s$/, schema$1.nodes.bullet_list);
const addOrderedListRule = wrappingInputRule(/^\s*\d+\.\s$/, schema$1.nodes.ordered_list);
const addQuoteRule = wrappingInputRule(/^\s*>\s/, schema$1.nodes.blockquote);
const addStrongRule = new InputRule(/\*\*([^*]+)\*\*/, (state, match, start, end) => {
	const tr = state.tr;
	if (match) {
		const textContent = match[1];
		tr.replaceWith(start, end, state.schema.text(textContent, [state.schema.marks.strong.create()]));
		tr.removeStoredMark(schema$1.marks.strong);
	}
	return tr;
});
const addEmRule = new InputRule(/_([^_]+)_/, (state, match, start, end) => {
	const tr = state.tr;
	if (match) {
		const textContent = match[1];
		tr.replaceWith(start, end, state.schema.text(textContent, [state.schema.marks.em.create()]));
		tr.removeStoredMark(schema$1.marks.em);
	}
	return tr;
});
const addStrikethroughRule = new InputRule(/~~([^~]+)~~/, (state, match, start, end) => {
	const tr = state.tr;
	if (match) {
		const textContent = match[1];
		tr.replaceWith(start, end, state.schema.text(textContent, [state.schema.marks.strikethrough.create()]));
		tr.removeStoredMark(schema$1.marks.strikethrough);
	}
	return tr;
});
const enterKeyHandler = (state, dispatch, view) => {
	const $from = state.selection.$from;
	const parent = $from.node($from.depth);
	const grandParent = $from.node($from.depth - 1);
	if (grandParent?.type?.name === "list_item") {
		if (parent.content.size === 0) return liftListItem(schema$1.nodes.list_item)(state, dispatch, view);
		return splitListItem(schema$1.nodes.list_item)(state, dispatch, view);
	}
	return false;
};
const tabKeyHandler = (state, dispatch, view) => {
	const $from = state.selection.$from;
	const grandParent = $from.node($from.depth - 1);
	if (grandParent.type.name === "list_item") return sinkListItem(schema$1.nodes.list_item)(state, dispatch, view);
	return false;
};
function inputPlugin() {
	return inputRules({ rules: [
		addHeadersRule,
		addUnorderedListRule,
		addOrderedListRule,
		addQuoteRule,
		addStrongRule,
		addEmRule,
		addStrikethroughRule,
		addCardRule,
		addTabsRule,
		addCalloutRule,
		addBadgeRule,
		addCodeSnippetRule(schema$1),
		addBreakRule(schema$1),
		addStepRule,
		addAccordionRule,
		addColumnsRule,
		addFooRule(schema$1),
		addIconRule,
		addMermaidRule,
		addFieldRule,
		addFrameRule
	] });
}

//#endregion
//#region src/editor/keymap.ts
function modEnterHandler(state, dispatch) {
	const { $from } = state.selection;
	const cardType = schema$1.nodes.card;
	if (!cardType) return false;
	const parent = $from.node(-1);
	if (parent.type === cardType) {
		const cardPos = $from.before($from.depth - 1);
		const afterCard = cardPos + parent.nodeSize;
		if (dispatch) {
			let tr = state.tr;
			const nextPos = tr.doc.resolve(afterCard);
			if (!nextPos.nodeAfter || nextPos.nodeAfter.type.name !== "paragraph") tr = tr.insert(afterCard, state.schema.nodes.paragraph.create());
			tr = tr.setSelection(TextSelection.create(tr.doc, afterCard + 1));
			dispatch(tr);
		}
		return true;
	}
	return false;
}
function backspaceToEmptyCardHandler(state, dispatch) {
	const { $from } = state.selection;
	const cardType = schema$1.nodes.card;
	if (!cardType) return false;
	if ($from.depth < 2) return false;
	const maybeCard = $from.node($from.depth - 1);
	if (maybeCard.type !== cardType) return false;
	if (maybeCard.childCount === 1 && $from.parentOffset === 0) {
		const cardPos = $from.before($from.depth - 1);
		const child = maybeCard.child(0);
		if (dispatch) {
			let tr = state.tr.delete(cardPos + 1, cardPos + 1 + child.nodeSize);
			const afterCard = cardPos + maybeCard.nodeSize;
			if (afterCard <= tr.doc.content.size) {
				const nextPos = tr.doc.resolve(afterCard);
				if (!nextPos.nodeAfter || nextPos.nodeAfter.type.name !== "paragraph") tr = tr.insert(afterCard, state.schema.nodes.paragraph.create());
				tr = tr.setSelection(TextSelection.create(tr.doc, afterCard + 1));
			} else {
				tr = tr.insert(tr.doc.content.size, state.schema.nodes.paragraph.create());
				const paraStart = tr.doc.content.size - 1;
				tr = tr.setSelection(TextSelection.create(tr.doc, paraStart));
			}
			dispatch(tr);
		}
		return true;
	}
	return false;
}
function keymapPlugin(commands = {}) {
	return keymap({
		...commands,
		Enter: enterKeyHandler,
		Tab: tabKeyHandler,
		"Mod-Enter": modEnterHandler,
		Backspace: backspaceToEmptyCardHandler
	});
}

//#endregion
//#region src/editor/utils/attribute-prompts.tsx
function Modal({ isOpen, onClose, children }) {
	if (!isOpen) return null;
	return /* @__PURE__ */ jsxs("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40",
		children: [/* @__PURE__ */ jsx("div", {
			className: "absolute inset-0",
			onClick: onClose
		}), /* @__PURE__ */ jsx("div", {
			className: "relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95",
			onClick: (e) => e.stopPropagation(),
			children
		})]
	});
}
function AttributePromptDialog({ isOpen, config, values, errors, onChange, onSubmit, onClose }) {
	if (!isOpen || !config) return null;
	const handleKeyDown = (e) => {
		if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
		if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement) && !e.nativeEvent.isComposing) {
			e.preventDefault();
			onSubmit();
		}
	};
	return /* @__PURE__ */ jsx(Modal, {
		isOpen,
		onClose,
		children: /* @__PURE__ */ jsxs("form", {
			className: "flex flex-col gap-0",
			onKeyDown: handleKeyDown,
			onSubmit: (e) => {
				e.preventDefault();
				onSubmit();
			},
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "px-6 pt-6 pb-2 border-b border-border",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "text-xl font-semibold text-foreground",
						children: config.title
					}), config.description && /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: config.description
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "px-6 py-4 flex flex-col gap-4 attribute-prompt-modal",
					children: config.fields.map((field, index) => /* @__PURE__ */ jsx(AttributeFieldInput, {
						field,
						value: values[field.name],
						error: errors[field.name],
						onChange: (value) => onChange(field.name, value),
						autoFocus: index === 0
					}, field.name))
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "px-6 pb-6 pt-2 flex justify-end gap-2 border-t border-border",
					children: [/* @__PURE__ */ jsx("button", {
						className: "rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition cursor-pointer",
						type: "button",
						onClick: onClose,
						children: "Cancel"
					}), /* @__PURE__ */ jsx("button", {
						className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition cursor-pointer",
						type: "submit",
						children: "Create"
					})]
				})
			]
		})
	});
}
function AttributeFieldInput({ field, value, error, onChange, autoFocus }) {
	let input = null;
	const baseInput = "block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition";
	switch (field.type) {
		case "text":
		case "url":
			input = /* @__PURE__ */ jsx("input", {
				id: field.name,
				type: field.type === "url" ? "url" : "text",
				value: value || "",
				placeholder: field.placeholder,
				onChange: (e) => onChange(e.target.value),
				className: `${baseInput} ${error ? "border-destructive" : "border-border bg-background text-foreground"}`,
				autoFocus,
				onKeyDown: (e) => e.stopPropagation()
			});
			break;
		case "number":
			input = /* @__PURE__ */ jsx("input", {
				id: field.name,
				type: "number",
				value: value || "",
				placeholder: field.placeholder,
				onChange: (e) => onChange(e.target.value ? parseFloat(e.target.value) : ""),
				className: `${baseInput} ${error ? "border-destructive" : "border-border bg-background text-foreground"}`,
				autoFocus,
				onKeyDown: (e) => e.stopPropagation()
			});
			break;
		case "boolean":
			input = /* @__PURE__ */ jsxs("label", {
				className: "inline-flex items-center gap-2 cursor-pointer select-none",
				children: [/* @__PURE__ */ jsx("input", {
					id: field.name,
					type: "checkbox",
					checked: !!value,
					onChange: (e) => onChange(e.target.checked),
					className: "rounded border-border text-primary focus:ring-primary/40"
				}), /* @__PURE__ */ jsx("span", {
					className: "text-sm text-foreground",
					children: field.label
				})]
			});
			break;
		default: input = /* @__PURE__ */ jsx("input", {
			id: field.name,
			value: value || "",
			placeholder: field.placeholder,
			onChange: (e) => onChange(e.target.value),
			className: `${baseInput} ${error ? "border-destructive" : "border-border bg-background text-foreground"}`,
			autoFocus,
			onKeyDown: (e) => e.stopPropagation()
		});
	}
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-1",
		children: [
			field.type !== "boolean" && /* @__PURE__ */ jsxs("label", {
				htmlFor: field.name,
				className: "text-sm font-medium text-foreground",
				children: [field.label, field.required && /* @__PURE__ */ jsx("span", {
					className: "text-destructive ml-1",
					children: "*"
				})]
			}),
			input,
			error && /* @__PURE__ */ jsx("p", {
				className: "text-xs text-destructive mt-1",
				children: error
			})
		]
	});
}

//#endregion
//#region src/editor/utils/command-system.tsx
const commandMenuSetup = [
	{
		id: "h1",
		name: "Heading 1",
		icon: Heading1,
		description: "Big section heading",
		write: "# "
	},
	{
		id: "h2",
		name: "Heading 2",
		icon: Heading2,
		description: "Medium section heading",
		write: "## "
	},
	{
		id: "h3",
		name: "Heading 3",
		icon: Heading3,
		description: "Small section heading",
		write: "### "
	},
	{
		id: "paragraph",
		name: "Text",
		icon: AlignLeft,
		description: "Just start writing with plain text",
		write: ""
	},
	{
		id: "bullet",
		name: "Bulleted list",
		icon: List,
		description: "Create a simple bulleted list",
		write: "- "
	},
	{
		id: "code",
		name: "Code",
		icon: Code,
		description: "Capture a code snippet",
		componentName: "code_snippet"
	},
	{
		id: "mermaid",
		name: "Mermaid",
		icon: Network,
		description: "Create a mermaid diagram",
		componentName: "mermaid"
	},
	{
		id: "quote",
		name: "Quote",
		icon: Quote,
		description: "Capture a quote",
		write: "> "
	},
	{ separator: true },
	{
		id: "card",
		name: "Card",
		icon: CreditCard,
		description: "Create a horizontal or vertical card",
		componentName: "card"
	},
	{
		id: "break",
		name: "Break",
		icon: Minus,
		description: "Add spacing between content",
		componentName: "break"
	},
	{
		id: "callout",
		name: "Callout",
		icon: AlertCircle,
		description: "Add a callout (info, warning, caution, etc.)",
		componentName: "callout"
	},
	{
		id: "step",
		name: "Step",
		icon: ArrowUpFromDot,
		description: "Create a step",
		componentName: "step"
	},
	{
		id: "accordion",
		name: "Accordion",
		icon: ListCollapse,
		description: "Add an accordion section",
		componentName: "accordion"
	},
	{
		id: "columns",
		name: "Columns",
		icon: Columns,
		description: "Create a responsive columns/grid layout",
		componentName: "columns"
	},
	{
		id: "icon",
		name: "Icon",
		icon: Sparkles,
		description: "Insert an icon from Lucide icons",
		componentName: "icon"
	},
	{
		id: "tabs",
		name: "Tabs",
		icon: List,
		description: "Create a tabbed interface",
		componentName: "tabs"
	},
	{
		id: "field",
		name: "Parameter Field",
		icon: FileText,
		description: "Document a parameter with name, type, and description",
		componentName: "field"
	},
	{
		id: "frame",
		name: "Frame",
		icon: Frame,
		description: "Add a frame with padding and optional caption",
		componentName: "frame"
	},
	{
		id: "badge",
		name: "Badge",
		icon: Hash,
		description: "Add a badge with custom text and styling",
		componentName: "badge"
	}
];
function isComponentCommand(command) {
	return "componentName" in command && !("requiresAttributes" in command);
}

//#endregion
//#region src/editor/utils/marks-system.tsx
const marksMenuSetup = [
	{
		id: "bold",
		name: "Bold",
		description: "Make text bold",
		icon: Bold,
		execute: (state, dispatch) => {
			const { from, to } = state.selection;
			if (from === to) return false;
			if (dispatch) {
				const mark = state.schema.marks.strong.create();
				const tr = state.tr.addMark(from, to, mark).removeStoredMark(mark);
				dispatch(tr);
			}
			return true;
		}
	},
	{
		id: "italic",
		name: "Italic",
		description: "Make text italic",
		icon: Italic,
		execute: (state, dispatch) => {
			const { from, to } = state.selection;
			if (from === to) return false;
			if (dispatch) {
				const mark = state.schema.marks.em.create();
				const tr = state.tr.addMark(from, to, mark).removeStoredMark(mark);
				dispatch(tr);
			}
			return true;
		}
	},
	{
		id: "strikethrough",
		name: "Strikethrough",
		description: "Strike through text",
		icon: Strikethrough,
		execute: (state, dispatch) => {
			const { from, to } = state.selection;
			if (from === to) return false;
			if (dispatch) {
				const mark = state.schema.marks.strikethrough.create();
				const tr = state.tr.addMark(from, to, mark).removeStoredMark(mark);
				dispatch(tr);
			}
			return true;
		}
	},
	{
		id: "code",
		name: "Inline Code",
		description: "Format as inline code",
		icon: Code,
		execute: (state, dispatch) => {
			const { from, to } = state.selection;
			if (from === to) return false;
			if (dispatch) {
				const mark = state.schema.marks.code.create();
				const tr = state.tr.addMark(from, to, mark).removeStoredMark(mark);
				dispatch(tr);
			}
			return true;
		}
	},
	{ separator: true },
	{
		id: "tooltip",
		name: "Tooltip",
		description: "Add a tooltip to the selected text",
		icon: Info,
		type: "tooltip",
		requiresAttributes: true
	}
];
function isTooltipMarkCommand(command) {
	return "requiresAttributes" in command && command.requiresAttributes === true;
}
function isSimpleMarkCommand(command) {
	return "execute" in command;
}
function hasTextSelection(state) {
	return !state.selection.empty;
}
function executeTooltipMark(state, dispatch, tooltipText) {
	const { from, to } = state.selection;
	if (from === to) return false;
	const mark = state.schema.marks.tooltip_mark.create({ tooltip: tooltipText });
	const tr = state.tr.addMark(from, to, mark).removeStoredMark(mark);
	dispatch(tr);
	return true;
}

//#endregion
//#region src/editor/utils/tooltip-click-plugin.tsx
const tooltipClickPluginKey = new PluginKey("tooltipClick");
function createTooltipClickPlugin(handler) {
	return new Plugin({
		key: tooltipClickPluginKey,
		props: { handleClickOn(view, pos, node, nodePos, event) {
			const $pos = view.state.doc.resolve(pos);
			const marks$1 = $pos.marks();
			const tooltipMark = marks$1.find((mark) => mark.type.name === "tooltip_mark");
			if (!tooltipMark) return false;
			let from = pos;
			let to = pos;
			while (from > 0) {
				const beforePos = view.state.doc.resolve(from - 1);
				const beforeMarks = beforePos.marks();
				const hasTooltipMark = beforeMarks.some((mark) => mark.type.name === "tooltip_mark" && mark.attrs.tooltip === tooltipMark.attrs.tooltip);
				if (!hasTooltipMark) break;
				from--;
			}
			while (to < view.state.doc.content.size) {
				const afterPos = view.state.doc.resolve(to);
				const afterMarks = afterPos.marks();
				const hasTooltipMark = afterMarks.some((mark) => mark.type.name === "tooltip_mark" && mark.attrs.tooltip === tooltipMark.attrs.tooltip);
				if (!hasTooltipMark) break;
				to++;
			}
			handler.onTooltipClick(tooltipMark.attrs.tooltip, from, to);
			event.preventDefault();
			return true;
		} }
	});
}
function removeTooltipMark(view, from, to) {
	const { state, dispatch } = view;
	const tooltipMarkType = state.schema.marks.tooltip_mark;
	const tr = state.tr.removeMark(from, to, tooltipMarkType);
	dispatch(tr);
}
function updateTooltipMark(view, from, to, newTooltipText) {
	const { state, dispatch } = view;
	const tooltipMarkType = state.schema.marks.tooltip_mark;
	let tr = state.tr.removeMark(from, to, tooltipMarkType);
	const newMark = tooltipMarkType.create({ tooltip: newTooltipText });
	tr = tr.addMark(from, to, newMark);
	dispatch(tr);
}

//#endregion
//#region src/editor/preprocessMarkdown.ts
function escapeHtml(text) {
	const map = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	};
	return text.replace(/[&<>"']/g, (m) => map[m]);
}
const renderer = new marked.Renderer();
renderer.code = (code, lang) => {
	if (lang?.includes("#")) {
		const [language, title] = lang.split("#");
		return `<pre><code title="${escapeHtml(title)}" language="${escapeHtml(language)}">${code}</code></pre>`;
	}
	if (lang) return `<pre><code language="${escapeHtml(lang)}">${code}</code></pre>`;
	return `<pre><code>${code}</code></pre>`;
};
function preprocessMarkdownToHTML(markdown) {
	markdown = markdown.trim();
	markdown = markdown.replace(/^---[\s\S]*?---\n?/m, "");
	return marked.parse(markdown, { renderer });
}

//#endregion
//#region src/editor/index.tsx
function proseMirrorToHTML(doc) {
	const serializer = DOMSerializer.fromSchema(schema$1);
	const domNode = serializer.serializeFragment(doc.content);
	const container = document.createElement("div");
	container.appendChild(domNode);
	return container.innerHTML;
}
function htmlToProseMirror(html$1) {
	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = html$1;
	const parser = DOMParser.fromSchema(schema$1);
	const fragment = parser.parseSlice(tempDiv).content;
	return fragment;
}
function mdxLikeToProseMirror(markdown) {
	const html$1 = preprocessMarkdownToHTML(markdown);
	return htmlToProseMirror(html$1);
}
function WebEditor(props) {
	const { theme, resolvedTheme } = useTheme();
	const dialogRef = useRef(null);
	const marksDialogRef = useRef(null);
	const editorViewRef = useRef(null);
	const [dialogPosition, setDialogPosition] = useState({
		top: 0,
		left: 0
	});
	const [marksDialogPosition, setMarksDialogPosition] = useState({
		top: 0,
		left: 0
	});
	const [commandMenuQuery, setCommandMenuQuery] = useState("");
	const [marksMenuQuery, setMarksMenuQuery] = useState("");
	const [currentMenuType, setCurrentMenuType] = useState("commands");
	const DIALOG_WIDTH = 400;
	const DIALOG_HEIGHT = 400;
	function clampDialogPosition(top, left) {
		const padding = 16;
		const maxTop = window.innerHeight - DIALOG_HEIGHT - padding;
		const maxLeft = window.innerWidth - DIALOG_WIDTH - padding;
		return {
			top: Math.max(padding, Math.min(top, maxTop)),
			left: Math.max(padding, Math.min(left, maxLeft))
		};
	}
	const [dialogSelectedIdx, setDialogSelectedIdx] = useState(0);
	const filteredCommands = useMemo(() => commandMenuSetup.filter((command) => {
		if ("separator" in command && commandMenuQuery) return false;
		if (!commandMenuQuery) return true;
		const q = commandMenuQuery.toLowerCase();
		return command.name.toLowerCase().includes(q) || command.description?.toLowerCase().includes(q);
	}), [commandMenuQuery]);
	const filteredMarks = useMemo(() => marksMenuSetup.filter((command) => {
		if ("separator" in command && marksMenuQuery) return false;
		if (!marksMenuQuery) return true;
		const q = marksMenuQuery.toLowerCase();
		return command.name.toLowerCase().includes(q) || command.description?.toLowerCase().includes(q);
	}), [marksMenuQuery]);
	useEffect(() => {
		const items = currentMenuType === "commands" ? filteredCommands : filteredMarks;
		const firstIdx = items.findIndex((cmd) => !("separator" in cmd));
		setDialogSelectedIdx(firstIdx === -1 ? 0 : firstIdx);
	}, [
		commandMenuQuery,
		marksMenuQuery,
		filteredCommands,
		filteredMarks,
		currentMenuType
	]);
	useEffect(() => {
		const items = currentMenuType === "commands" ? filteredCommands : filteredMarks;
		if (dialogSelectedIdx > items.length - 1 || items[dialogSelectedIdx] && "separator" in items[dialogSelectedIdx]) {
			const firstIdx = items.findIndex((cmd) => !("separator" in cmd));
			setDialogSelectedIdx(firstIdx === -1 ? 0 : firstIdx);
		}
	}, [
		filteredCommands,
		filteredMarks,
		dialogSelectedIdx,
		currentMenuType
	]);
	const [editorState, setEditorState] = useState(null);
	const [showCommandHint, setShowCommandHint] = useState(false);
	const [hintPosition, setHintPosition] = useState({
		top: 0,
		left: 0
	});
	const [attributePromptOpen, setAttributePromptOpen] = useState(false);
	const [attributePromptConfig, setAttributePromptConfig] = useState(null);
	const [attributePromptValues, setAttributePromptValues] = useState({});
	const [attributePromptErrors, setAttributePromptErrors] = useState({});
	const [pendingAttributeCommand, setPendingAttributeCommand] = useState(null);
	const [tooltipPromptOpen, setTooltipPromptOpen] = useState(false);
	const [tooltipText, setTooltipText] = useState("");
	const [isEditingTooltip, setIsEditingTooltip] = useState(false);
	const [tooltipEditRange, setTooltipEditRange] = useState(null);
	const containerRef = useRef(null);
	const checkCommandHint = useCallback((view) => {
		const { $head, empty } = view.state.selection;
		if (empty && $head.parent.type.name === "paragraph") {
			const isEmptyParagraph = $head.parent.content.size === 0;
			if (isEmptyParagraph) try {
				const coords = view.coordsAtPos($head.pos);
				const containerRect = containerRef.current?.getBoundingClientRect();
				if (!containerRect) {
					setShowCommandHint(false);
					return;
				}
				const relativeTop = coords.bottom - containerRect.top - 25;
				const relativeLeft = coords.left - containerRect.left + 4;
				setHintPosition({
					top: relativeTop,
					left: relativeLeft
				});
				setShowCommandHint(true);
				return;
			} catch {}
		}
		setShowCommandHint(false);
	}, [setShowCommandHint, setHintPosition]);
	function customPastePlugin() {
		return new Plugin({ props: { handlePaste(view, event) {
			if (event.clipboardData) {
				const html$1 = event.clipboardData.getData("text/html");
				if (html$1) {
					const fragment = htmlToProseMirror(html$1);
					if (fragment) {
						const topNode = view.state.schema.topNodeType.create(null, fragment);
						view.dispatch(view.state.tr.replaceSelectionWith(topNode));
						return true;
					}
				}
				const text = event.clipboardData.getData("text/plain");
				if (text) {
					const fragment = mdxLikeToProseMirror(text);
					if (fragment) {
						const topNode = view.state.schema.topNodeType.create(null, fragment);
						view.dispatch(view.state.tr.replaceSelectionWith(topNode));
						return true;
					}
				}
			}
			return false;
		} } });
	}
	const plugins = useMemo(() => [
		reactKeys(),
		createTooltipClickPlugin({ onTooltipClick: (tooltipText$1, from, to) => {
			setTooltipText(tooltipText$1);
			setTooltipEditRange({
				from,
				to
			});
			setIsEditingTooltip(true);
			setTooltipPromptOpen(true);
		} }),
		keymapPlugin({
			"Mod-z": undo,
			"Mod-r": redo,
			"/": (state, _dispatch, view) => {
				if (!view) return false;
				const { $head, empty } = state.selection;
				const activeElement = document.activeElement;
				if (activeElement) {
					const cmEditor = activeElement.closest(".cm-editor");
					const cmContent = activeElement.closest(".cm-content");
					if (cmEditor || cmContent) return false;
				}
				if (empty && $head.parent.type.name === "paragraph") {
					const parentStart = $head.start($head.depth);
					const isAtStart = $head.pos === parentStart;
					const isEmptyParagraph = $head.parent.content.size === 0;
					if (isEmptyParagraph || isAtStart) {
						const coords = view.coordsAtPos($head.pos);
						const { top, left } = clampDialogPosition(coords.bottom + 5, coords.left);
						setDialogPosition({
							top,
							left
						});
						setCurrentMenuType("commands");
						openDialog();
						return true;
					}
				}
				if (!empty && hasTextSelection(state)) {
					const coords = view.coordsAtPos(state.selection.from);
					const { top, left } = clampDialogPosition(coords.bottom + 5, coords.left);
					setMarksDialogPosition({
						top,
						left
					});
					setCurrentMenuType("marks");
					openMarksDialog();
					return true;
				}
				return false;
			}
		}),
		history(),
		inputPlugin(),
		customPastePlugin(),
		keymap(baseKeymap)
	], []);
	useEffect(() => {
		if (props.value !== void 0) {
			const fragment = props.value.length > 0 ? mdxLikeToProseMirror(props.value) : Fragment.empty;
			const topNode = schema$1.topNodeType.create(null, fragment);
			const newState = EditorState.create({
				schema: schema$1,
				doc: topNode,
				plugins
			});
			setEditorState(newState);
		} else {
			const newState = EditorState.create({
				schema: schema$1,
				plugins
			});
			setEditorState(newState);
		}
	}, [props.value, plugins]);
	async function handleCommandWrapper(command) {
		closeDialog();
		const view = editorViewRef.current;
		if (!view) return;
		const { state, dispatch } = view;
		const insertFunctions = {
			accordion: insertAccordion,
			badge: insertBadge,
			break: insertBreak,
			callout: insertCallout,
			card: insertCard,
			code_snippet: insertCodeSnippet,
			columns: insertColumns,
			field: insertField,
			foo: insertFoo,
			frame: insertFrame,
			icon: insertIcon,
			mermaid: insertMermaid,
			step: insertStep,
			tabs: insertTabs
		};
		if (isComponentCommand(command) && command.componentName in insertFunctions) {
			const insertFunction = insertFunctions[command.componentName];
			const tr = insertFunction(state);
			dispatch(tr);
			view.focus();
			return;
		}
		const text = command.write;
		if (typeof text !== "string") return;
		const { from, to } = state.selection;
		let currentPos = from;
		if (from !== to) {
			const deleteTransaction = state.tr.delete(from, to);
			dispatch(deleteTransaction);
			currentPos = from;
		}
		for (let i = 0; i < text.length; i++) {
			const char = text[i];
			const currentState = view.state;
			const handled = view.someProp("handleTextInput", (f) => f(view, currentPos, currentPos, char, () => currentState.tr));
			if (!handled) {
				const tr = currentState.tr.insertText(char, currentPos);
				view.dispatch(tr);
			}
			currentPos++;
		}
		view.focus();
	}
	async function handleMarkCommand(command) {
		closeMarksDialog();
		const view = editorViewRef.current;
		if (!view) return;
		const { state, dispatch } = view;
		if (isSimpleMarkCommand(command)) {
			command.execute(state, dispatch);
			view.focus();
		} else if (isTooltipMarkCommand(command)) {
			setTooltipText("");
			setIsEditingTooltip(false);
			setTooltipEditRange(null);
			setTooltipPromptOpen(true);
		}
	}
	function onKeyDown(e) {
		const items = currentMenuType === "commands" ? filteredCommands : filteredMarks;
		let newIdx = dialogSelectedIdx;
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				do
					newIdx = newIdx < items.length - 1 ? newIdx + 1 : 0;
				while (items[newIdx] && "separator" in items[newIdx]);
				setDialogSelectedIdx(newIdx);
				setTimeout(() => {
					const el = document.querySelector(`[data-cmd-idx="${newIdx}"]`);
					if (el) el.scrollIntoView({ block: "nearest" });
				}, 0);
				break;
			case "ArrowUp":
				e.preventDefault();
				do
					newIdx = newIdx > 0 ? newIdx - 1 : items.length - 1;
				while (items[newIdx] && "separator" in items[newIdx]);
				setDialogSelectedIdx(newIdx);
				setTimeout(() => {
					const el = document.querySelector(`[data-cmd-idx="${newIdx}"]`);
					if (el) el.scrollIntoView({ block: "nearest" });
				}, 0);
				break;
			case "Escape":
				e.preventDefault();
				if (currentMenuType === "commands") closeDialog();
				else closeMarksDialog();
				break;
			case "Enter": {
				e.preventDefault();
				const idx = dialogSelectedIdx;
				const selectedItem = items[idx];
				if (selectedItem && !("separator" in selectedItem)) if (currentMenuType === "commands") handleCommandWrapper(selectedItem);
				else handleMarkCommand(selectedItem);
				break;
			}
			default: break;
		}
	}
	function openDialog() {
		setShowCommandHint(false);
		setCommandMenuQuery("");
		dialogRef.current?.showModal();
	}
	function closeDialog() {
		dialogRef.current?.close();
		setShowCommandHint(false);
		setCommandMenuQuery("");
	}
	function openMarksDialog() {
		setShowCommandHint(false);
		setMarksMenuQuery("");
		marksDialogRef.current?.showModal();
	}
	function closeMarksDialog() {
		marksDialogRef.current?.close();
		setShowCommandHint(false);
		setMarksMenuQuery("");
	}
	useEffect(() => {
		setDialogSelectedIdx(0);
	}, [commandMenuQuery, marksMenuQuery]);
	useEffect(() => {
		const items = currentMenuType === "commands" ? filteredCommands : filteredMarks;
		if (dialogSelectedIdx > items.length - 1) setDialogSelectedIdx(0);
	}, [
		filteredCommands,
		filteredMarks,
		dialogSelectedIdx,
		currentMenuType
	]);
	return /* @__PURE__ */ jsx(EditorEditableProvider, {
		editable: props.editable ?? true,
		children: /* @__PURE__ */ jsxs("div", {
			className: "p-4 shadow-lg m-4 rounded-lg min-h-96",
			style: { position: "relative" },
			ref: containerRef,
			children: [
				/* @__PURE__ */ jsxs("dialog", {
					onKeyDown,
					onClick: closeDialog,
					ref: dialogRef,
					className: "fixed m-0 p-1.5 drop-shadow-lg border border-border rounded-lg bg-popover/95 z-1000 backdrop:bg-transparent",
					style: {
						top: `${dialogPosition.top}px`,
						left: `${dialogPosition.left}px`,
						width: `${DIALOG_WIDTH}px`,
						maxHeight: `${DIALOG_HEIGHT}px`,
						overflowY: "auto"
					},
					children: [/* @__PURE__ */ jsx("input", {
						autoFocus: true,
						type: "text",
						placeholder: "Type to search components…",
						className: "w-full mb-2 px-2 py-1 rounded bg-background text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring text-sm font-mono",
						value: commandMenuQuery,
						onChange: (e) => {
							setCommandMenuQuery(e.target.value);
						},
						onClick: (e) => e.stopPropagation()
					}), /* @__PURE__ */ jsx("ol", {
						className: "outline-none overflow-y-auto max-h-[350px]",
						children: filteredCommands.map((command, index) => {
							const isSelected = index === dialogSelectedIdx;
							if ("separator" in command) return /* @__PURE__ */ jsx("li", {
								className: "my-2",
								children: /* @__PURE__ */ jsx("hr", { className: "border-border" })
							}, `separator-${index}`);
							return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
								type: "button",
								"data-cmd-idx": index,
								onClick: (e) => {
									e.stopPropagation();
									handleCommandWrapper(command);
								},
								className: `flex flex-row items-center gap-3 outline-none px-2 py-1.5 rounded transition-colors duration-100 cursor-pointer w-full text-left font-mono text-sm
                      ${isSelected ? "bg-accent text-accent-foreground" : "text-muted-foreground"}
                      hover:bg-accent hover:text-accent-foreground`,
								children: [/* @__PURE__ */ jsx(command.icon, { className: "w-4 h-4" }), /* @__PURE__ */ jsxs("div", {
									className: "flex flex-col w-full",
									children: [/* @__PURE__ */ jsx("h2", {
										className: "font-semibold",
										children: command.name
									}), /* @__PURE__ */ jsx("p", {
										className: "text-muted-foreground text-xs",
										children: command.description
									})]
								})]
							}) }, command.id);
						})
					})]
				}),
				/* @__PURE__ */ jsxs("dialog", {
					onKeyDown,
					onClick: closeMarksDialog,
					ref: marksDialogRef,
					className: "fixed m-0 p-1.5 drop-shadow-lg border border-border rounded-lg bg-popover/95 z-1000 backdrop:bg-transparent",
					style: {
						top: `${marksDialogPosition.top}px`,
						left: `${marksDialogPosition.left}px`,
						width: `${DIALOG_WIDTH}px`,
						maxHeight: `${DIALOG_HEIGHT}px`,
						overflowY: "auto"
					},
					children: [/* @__PURE__ */ jsx("input", {
						autoFocus: true,
						type: "text",
						placeholder: "Type to search marks…",
						className: "w-full mb-2 px-2 py-1 rounded bg-background text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-ring text-sm font-mono",
						value: marksMenuQuery,
						onChange: (e) => {
							setMarksMenuQuery(e.target.value);
						},
						onClick: (e) => e.stopPropagation()
					}), /* @__PURE__ */ jsx("ol", {
						className: "outline-none overflow-y-auto max-h-[350px]",
						children: filteredMarks.map((command, index) => {
							const isSelected = index === dialogSelectedIdx;
							if ("separator" in command) return /* @__PURE__ */ jsx("li", {
								className: "my-2",
								children: /* @__PURE__ */ jsx("hr", { className: "border-border" })
							}, `separator-${index}`);
							return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("button", {
								type: "button",
								"data-cmd-idx": index,
								onClick: (e) => {
									e.stopPropagation();
									handleMarkCommand(command);
								},
								className: `flex flex-row items-center gap-3 outline-none px-2 py-1.5 rounded transition-colors duration-100 cursor-pointer w-full text-left font-mono text-sm
                      ${isSelected ? "bg-accent text-accent-foreground" : "text-muted-foreground"}
                      hover:bg-accent hover:text-accent-foreground`,
								children: [/* @__PURE__ */ jsx(command.icon, { className: "w-4 h-4" }), /* @__PURE__ */ jsxs("div", {
									className: "flex flex-col w-full",
									children: [/* @__PURE__ */ jsx("h2", {
										className: "font-semibold",
										children: command.name
									}), /* @__PURE__ */ jsx("p", {
										className: "text-muted-foreground text-xs",
										children: command.description
									})]
								})]
							}) }, command.id);
						})
					})]
				}),
				editorState && /* @__PURE__ */ jsxs(ProseMirror, {
					className: "outline-none min-h-96",
					editable: () => props.editable ?? true,
					state: editorState,
					dispatchTransaction: (tr) => {
						const oldSelection = editorState?.selection;
						const newState = editorState.apply(tr);
						setEditorState(newState);
						if (oldSelection && !tr.selection.eq(oldSelection)) {
							const view = editorViewRef.current;
							if (view) setTimeout(() => checkCommandHint(view), 0);
						}
						if (tr.docChanged) {
							const view = editorViewRef.current;
							if (view) setTimeout(() => checkCommandHint(view), 0);
						}
						props.onChange?.(proseMirrorToHTML(newState.doc));
					},
					nodeViews: {
						card: CardNodeView,
						tabs: TabsNodeView,
						callout: CalloutNodeView,
						code_snippet: CodeSnippetNodeView,
						break: BreakNodeView,
						badge: BadgeNodeView,
						icon: IconNodeView,
						step: StepNodeView,
						accordion: AccordionNodeView,
						columns: ColumnsNodeView,
						column: ColumnNodeView,
						foo: FooNodeView,
						mermaid: MermaidNodeView,
						field: FieldNodeView,
						frame: FrameNodeView
					},
					children: [/* @__PURE__ */ jsx(EditorViewCapture, {
						viewRef: editorViewRef,
						checkCommandHint
					}), /* @__PURE__ */ jsx(ProseMirrorDoc, {})]
				}),
				props.editable !== false && showCommandHint && /* @__PURE__ */ jsx("span", {
					className: "text-muted-foreground italic pointer-events-none select-none",
					style: {
						position: "absolute",
						top: hintPosition.top,
						left: hintPosition.left,
						opacity: .7,
						fontStyle: "italic",
						zIndex: 10,
						pointerEvents: "none"
					},
					children: "Press '/' for commands and marks"
				}),
				/* @__PURE__ */ jsx(AttributePromptDialog, {
					isOpen: attributePromptOpen,
					config: attributePromptConfig,
					values: attributePromptValues,
					errors: attributePromptErrors,
					onChange: (name, value) => {
						setAttributePromptValues((v) => ({
							...v,
							[name]: value
						}));
						setAttributePromptErrors((e) => ({
							...e,
							[name]: void 0
						}));
					},
					onSubmit: () => {
						if (!attributePromptConfig || !pendingAttributeCommand) return;
						const newErrors = {};
						let hasErrors = false;
						attributePromptConfig.fields.forEach((field) => {
							const value = attributePromptValues[field.name];
							if (field.required && (value === void 0 || value === null || value === "")) {
								newErrors[field.name] = `${field.label} is required`;
								hasErrors = true;
								return;
							}
							if (field.validation && value !== void 0 && value !== null && value !== "") {
								const error = field.validation(value);
								if (error) {
									newErrors[field.name] = error;
									hasErrors = true;
								}
							}
						});
						setAttributePromptErrors(newErrors);
						if (hasErrors) return;
						const command = pendingAttributeCommand;
						const editorView = editorViewRef.current;
						if (editorView) {
							const { state, dispatch } = editorView;
							const { from, to } = state.selection;
							const componentName = command.componentName;
							const nodeType = state.schema.nodes[componentName];
							if (!nodeType) {
								console.error("No node type found for", componentName);
								return;
							}
							const attrs = {};
							for (const [key, value] of Object.entries(attributePromptValues)) if (typeof value === "string" && (value === "true" || value === "false")) attrs[key] = value === "true";
							else attrs[key] = value;
							let content;
							if (componentName === "card" || componentName === "callout" || componentName === "accordion" || componentName === "frame" || componentName === "field") content = state.schema.nodes.paragraph.create();
							else content = null;
							const node = nodeType.create(attrs, content);
							let tr = state.tr;
							if (from !== to) tr = tr.delete(from, to);
							tr = tr.replaceSelectionWith(node);
							if (componentName === "card" || componentName === "callout" || componentName === "accordion" || componentName === "frame" || componentName === "field") {
								const insertPos = tr.selection.from;
								const innerPos = insertPos + 1;
								tr = tr.setSelection(Selection.near(tr.doc.resolve(innerPos)));
							}
							dispatch(tr);
							editorView.focus();
						}
						setAttributePromptOpen(false);
						setPendingAttributeCommand(null);
					},
					onClose: () => {
						setAttributePromptOpen(false);
						setPendingAttributeCommand(null);
					}
				}),
				/* @__PURE__ */ jsx(TooltipPromptModal, {
					open: tooltipPromptOpen,
					initialTooltip: tooltipText,
					isEditing: isEditingTooltip,
					onCloseAction: () => {
						setTooltipPromptOpen(false);
						setTooltipText("");
						setIsEditingTooltip(false);
						setTooltipEditRange(null);
					},
					onSubmitAction: (text) => {
						const view = editorViewRef.current;
						if (view && text.trim()) {
							if (isEditingTooltip && tooltipEditRange) updateTooltipMark(view, tooltipEditRange.from, tooltipEditRange.to, text.trim());
							else executeTooltipMark(view.state, view.dispatch, text.trim());
							view.focus();
						}
						setTooltipPromptOpen(false);
						setTooltipText("");
						setIsEditingTooltip(false);
						setTooltipEditRange(null);
					},
					onRemoveAction: isEditingTooltip && tooltipEditRange ? () => {
						const view = editorViewRef.current;
						if (view) {
							removeTooltipMark(view, tooltipEditRange.from, tooltipEditRange.to);
							view.focus();
						}
						setTooltipPromptOpen(false);
						setTooltipText("");
						setIsEditingTooltip(false);
						setTooltipEditRange(null);
					} : void 0
				})
			]
		})
	});
}
function EditorViewCapture({ viewRef, checkCommandHint }) {
	useEditorEffect((view) => {
		viewRef.current = view;
		checkCommandHint(view);
		const handleFocus = () => {
			setTimeout(() => checkCommandHint(view), 50);
		};
		const handleScroll = () => {
			setTimeout(() => checkCommandHint(view), 0);
		};
		const handleWindowScroll = () => {
			setTimeout(() => checkCommandHint(view), 0);
		};
		const handleWindowResize = () => {
			setTimeout(() => checkCommandHint(view), 0);
		};
		view.dom.addEventListener("focus", handleFocus);
		view.dom.addEventListener("scroll", handleScroll);
		window.addEventListener("scroll", handleWindowScroll);
		window.addEventListener("resize", handleWindowResize);
		return () => {
			viewRef.current = null;
			view.dom.removeEventListener("focus", handleFocus);
			view.dom.removeEventListener("scroll", handleScroll);
			window.removeEventListener("scroll", handleWindowScroll);
			window.removeEventListener("resize", handleWindowResize);
		};
	}, [checkCommandHint]);
	return null;
}

//#endregion
export { WebEditor, useTheme };