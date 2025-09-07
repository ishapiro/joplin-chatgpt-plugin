import axios from 'axios';
import { getSettings, PluginSettings } from './settings';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ChatGPTAPI {
  private settings: PluginSettings | null = null;

  async initialize(): Promise<void> {
    this.settings = await getSettings();
    
    if (!this.settings.openaiApiKey) {
      throw new Error('OpenAI API key is not configured. Please set it in the plugin settings.');
    }
  }

  async sendMessage(messages: ChatMessage[]): Promise<ChatResponse> {
    if (!this.settings) {
      await this.initialize();
    }

    if (!this.settings!.openaiApiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.settings!.model,
          messages: messages,
          max_tokens: this.settings!.maxTokens,
          temperature: this.settings!.temperature,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.settings!.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const choice = response.data.choices[0];
      if (!choice || !choice.message) {
        throw new Error('Invalid response from OpenAI API');
      }

      return {
        content: choice.message.content,
        usage: response.data.usage
      };
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || 'Unknown error';
        
        switch (status) {
          case 401:
            throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.');
          case 500:
            throw new Error('OpenAI server error. Please try again later.');
          default:
            throw new Error(`OpenAI API error (${status}): ${message}`);
        }
      } else if (error.request) {
        throw new Error('Network error. Please check your internet connection.');
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  async improveNote(noteContent: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.settings!.systemPrompt + '\n\nPlease improve the following note while maintaining its original meaning and structure. Focus on clarity, grammar, and organization.'
      },
      {
        role: 'user',
        content: noteContent
      }
    ];

    const response = await this.sendMessage(messages);
    return response.content;
  }

  async useNoteAsPrompt(noteContent: string, userPrompt: string = ''): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.settings!.systemPrompt
      },
      {
        role: 'user',
        content: `Here is the context from my note:\n\n${noteContent}\n\n${userPrompt || 'Please help me with this content.'}`
      }
    ];

    const response = await this.sendMessage(messages);
    return response.content;
  }

  async chatWithContext(context: string, userMessage: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: this.settings!.systemPrompt + '\n\nYou have access to the following context from the user\'s notes:'
      },
      {
        role: 'user',
        content: `Context: ${context}\n\nUser message: ${userMessage}`
      }
    ];

    const response = await this.sendMessage(messages);
    return response.content;
  }

  async generateTags(noteContent: string): Promise<string[]> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant that generates relevant tags for notes. Return only a comma-separated list of tags, no other text.'
      },
      {
        role: 'user',
        content: `Generate relevant tags for this note content:\n\n${noteContent}`
      }
    ];

    const response = await this.sendMessage(messages);
    return response.content.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  }

  async summarizeNote(noteContent: string): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful assistant that creates concise summaries. Create a clear, well-structured summary of the provided content.'
      },
      {
        role: 'user',
        content: `Please summarize this note:\n\n${noteContent}`
      }
    ];

    const response = await this.sendMessage(messages);
    return response.content;
  }
}
