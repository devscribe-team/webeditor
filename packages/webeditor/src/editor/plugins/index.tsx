import { NodeViewComponentProps } from "@handlewithcare/react-prosemirror";
import { NodeSpec } from "prosemirror-model";
import { ComponentType } from "react";

export abstract class EditorComponent {
  abstract spec(): NodeSpec;
  abstract view: ComponentType<NodeViewComponentProps>;
}

export class EditorContext {
  private components: Record<string, EditorComponent> = {};
  private plugins: EditorPlugin[] = [];

  registerComponent(name: string, component: EditorComponent) {
    if (this.components[name]) {
      throw new Error(`Component with name ${name} is already registered.`);
    }

    this.components[name] = component;
  }

  registerPlugin(plugin: EditorPlugin) {
    if (this.plugins.includes(plugin)) {
      throw new Error(`Plugin is already registered.`);
    }

    this.plugins.push(plugin);
    plugin.start(this);
  }
}

export abstract class EditorPlugin {
  abstract start(ctx: EditorContext): void;
}

class MyExampleComponent extends EditorComponent {
  spec(): NodeSpec {
    return {
      group: 'inline',
      inline: true,
      atom: true,
    }
  }

  view = () => {
    return (
      <div>
        Hi there
      </div>
    );
  }
}

class MyExamplePlugin extends EditorPlugin {
  start(ctx: EditorContext) {
    ctx.registerComponent("example", new MyExampleComponent());
  }
}
