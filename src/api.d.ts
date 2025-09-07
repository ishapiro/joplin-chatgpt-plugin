// Type definitions for Joplin Plugin API
declare module 'api' {
  interface JoplinPlugin {
    onStart: () => Promise<void>;
  }

  interface JoplinSettings {
    registerSetting: (id: string, spec: any) => Promise<void>;
    value: (key: string) => Promise<any>;
    setValue: (key: string, value: any) => Promise<void>;
    settingType: {
      String: string;
      Int: number;
      Float: number;
      Bool: boolean;
    };
  }

  interface JoplinCommands {
    register: (command: any) => Promise<void>;
    execute: (command: string, ...args: any[]) => Promise<any>;
  }

  interface JoplinViews {
    panels: {
      create: (id: string) => Promise<string>;
      setTitle: (panel: string, title: string) => Promise<void>;
      setHtml: (panel: string, html: string) => Promise<void>;
      addScript: (panel: string, script: string) => Promise<void>;
      postMessage: (panel: string, message: any) => Promise<void>;
      onMessage: (panel: string, handler: (message: any) => Promise<void>) => Promise<void>;
    };
    dialogs: {
      showMessageBox: (message: string, title?: string, buttons?: string[]) => Promise<number>;
      showErrorMessageBox: (message: string) => Promise<void>;
      showPrompt: (message: string, defaultText?: string) => Promise<string | null>;
    };
  }

  interface JoplinWorkspace {
    selectedNote: () => Promise<any>;
  }

  interface JoplinData {
    put: (path: string[], id: string | null, data: any) => Promise<any>;
    post: (path: string[], data: any) => Promise<any>;
    get: (path: string[], options?: any) => Promise<any>;
  }

  interface JoplinClipboard {
    writeText: (text: string) => Promise<void>;
  }

  interface Joplin {
    plugins: {
      register: (plugin: JoplinPlugin) => void;
    };
    settings: JoplinSettings;
    commands: JoplinCommands;
    views: JoplinViews;
    workspace: JoplinWorkspace;
    data: JoplinData;
    clipboard: JoplinClipboard;
  }

  const joplin: Joplin;
  export default joplin;
}
