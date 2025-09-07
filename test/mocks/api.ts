// Mock Joplin API for testing
export default {
  plugins: {
    register: jest.fn(),
  },
  settings: {
    registerSetting: jest.fn(),
    value: jest.fn(),
    setValue: jest.fn(),
    settingType: {
      String: 'string',
      Int: 'int',
      Float: 'float',
      Bool: 'bool',
    },
  },
  commands: {
    register: jest.fn(),
    execute: jest.fn(),
  },
  views: {
    panels: {
      create: jest.fn(),
      setTitle: jest.fn(),
      setHtml: jest.fn(),
      addScript: jest.fn(),
      postMessage: jest.fn(),
      onMessage: jest.fn(),
    },
    dialogs: {
      showMessageBox: jest.fn(),
      showErrorMessageBox: jest.fn(),
      showPrompt: jest.fn(),
    },
  },
  workspace: {
    selectedNote: jest.fn(),
  },
  data: {
    put: jest.fn(),
    post: jest.fn(),
    get: jest.fn(),
  },
  clipboard: {
    writeText: jest.fn(),
  },
};
