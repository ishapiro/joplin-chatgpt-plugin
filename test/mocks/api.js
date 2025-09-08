// Mock Joplin API for testing
const mockJoplin = {
  plugins: {
    register: jest.fn(),
    onMessage: jest.fn(),
    postMessage: jest.fn()
  },
  settings: {
    registerSettings: jest.fn(),
    value: jest.fn(),
    settingType: {
      String: 1,
      Int: 2,
      Float: 3,
      Bool: 4
    }
  },
  commands: {
    register: jest.fn(),
    execute: jest.fn()
  },
  views: {
    panels: {
      create: jest.fn(),
      setHtml: jest.fn(),
      setTitle: jest.fn(),
      show: jest.fn()
    },
    dialogs: {
      showMessageBox: jest.fn(),
      showPrompt: jest.fn()
    }
  },
  data: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn()
  },
  workspace: {
    selectedNoteIds: jest.fn()
  },
  clipboard: {
    writeText: jest.fn()
  }
};

module.exports = mockJoplin;
