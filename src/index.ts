import joplin from 'api';
import { setupSettings } from './settings';
import { setupCommands } from './commands';
import { setupChatPanel } from './chat-panel';

joplin.plugins.register({
  onStart: async function() {
    console.info('ChatGPT Integration Plugin started!');
    
    try {
      // Initialize settings
      await setupSettings();
      
      // Setup commands
      await setupCommands();
      
      // Setup chat panel
      await setupChatPanel();
      
      console.info('ChatGPT Integration Plugin initialized successfully!');
    } catch (error) {
      console.error('Error initializing ChatGPT plugin:', error);
    }
  },
});
