// Standalone ChatGPTAPI class for testing
// This is extracted from the main plugin code for easier testing

class ChatGPTAPI {
    constructor() {
        this.conversationHistory = [];
        this.settings = {
            openaiApiKey: '',
            openaiModel: 'gpt-4.1',
            maxTokens: 1000,
            systemPrompt: 'You are a helpful AI assistant from the ChatGPT Toolkit integrated with Joplin notes. Help users improve their notes, answer questions, and provide writing assistance.',
            autoSave: true,
            reasoningEffort: 'low',
            verbosity: 'low'
        };
    }

    async loadSettings() {
        this.settings.openaiApiKey = await joplin.settings.value('openaiApiKey');
        this.settings.openaiModel = await joplin.settings.value('openaiModel');
        this.settings.maxTokens = await joplin.settings.value('maxTokens');
        this.settings.systemPrompt = await joplin.settings.value('systemPrompt');
        this.settings.autoSave = await joplin.settings.value('autoSave');
        this.settings.reasoningEffort = await joplin.settings.value('reasoningEffort');
        this.settings.verbosity = await joplin.settings.value('verbosity');
    }

    clearConversationHistory() {
        this.conversationHistory = [];
        console.info(`[ChatGPT API] Conversation history cleared`);
    }

    // Validate API key format
    validateApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }
        // Check for basic OpenAI API key format (sk- or sk-proj- prefix)
        if (!apiKey.startsWith('sk-')) {
            console.warn('API key validation: Key should start with "sk-"');
            return true; // Allow anyway, just warn
        }
        // Current API keys are typically 150+ characters
        if (apiKey.length < 20 || apiKey.length > 200) {
            return false;
        }
        // Allow letters, numbers, hyphens, underscores, and periods
        // Modern OpenAI API keys follow format: sk-proj-[long alphanumeric string]
        if (!/^sk-[A-Za-z0-9\-_\.]+$/.test(apiKey)) {
            return false;
        }
        return true;
    }

    // Estimate token count for a message (rough approximation: 1 token ≈ 4 characters)
    estimateTokens(text) {
        if (!text || typeof text !== 'string') {
            return 0;
        }
        return Math.ceil(text.length / 4);
    }

    // Get conversation history limited by token count
    getLimitedHistory(maxTokens) {
        if (this.conversationHistory.length === 0) {
            return [];
        }
        let totalTokens = 0;
        const limitedHistory = [];
        // Start from the most recent messages and work backwards
        for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
            const message = this.conversationHistory[i];
            if (!message || !message.content) {
                continue; // Skip malformed messages
            }
            const messageTokens = this.estimateTokens(message.content);
            if (totalTokens + messageTokens <= maxTokens) {
                limitedHistory.unshift(message); // Add to beginning to maintain order
                totalTokens += messageTokens;
            }
            else {
                break; // Stop if adding this message would exceed the limit
            }
        }
        console.info(`[ChatGPT API] History limited to ${limitedHistory.length} messages (estimated ${totalTokens} tokens, max ${maxTokens})`);
        return limitedHistory;
    }

    // Trim conversation history to stay within token limits
    trimHistoryToTokenLimit(maxTokens) {
        if (this.conversationHistory.length === 0) {
            return;
        }
        let totalTokens = 0;
        const trimmedHistory = [];
        // Start from the most recent messages and work backwards
        for (let i = this.conversationHistory.length - 1; i >= 0; i--) {
            const message = this.conversationHistory[i];
            if (!message || !message.content) {
                continue; // Skip malformed messages
            }
            const messageTokens = this.estimateTokens(message.content);
            if (totalTokens + messageTokens <= maxTokens) {
                trimmedHistory.unshift(message); // Add to beginning to maintain order
                totalTokens += messageTokens;
            }
            else {
                break; // Stop if adding this message would exceed the limit
            }
        }
        this.conversationHistory = trimmedHistory;
        console.info(`[ChatGPT API] History trimmed to ${trimmedHistory.length} messages (estimated ${totalTokens} tokens, max ${maxTokens})`);
    }

    async sendMessage(userMessage) {
        await this.loadSettings();
        if (!this.settings.openaiApiKey) {
            throw new Error('OpenAI API key is not set. Please configure it in Settings → Plugins → ChatGPT Toolkit.');
        }
        console.info(`[ChatGPT API] Starting request to model: ${this.settings.openaiModel}`);
        console.info(`[ChatGPT API] User message length: ${userMessage.length} characters`);
        console.info(`[ChatGPT API] Max tokens: ${this.settings.maxTokens}`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.error(`[ChatGPT API] Request timeout after 60 seconds for model: ${this.settings.openaiModel}`);
            controller.abort();
        }, 60000); // 60 second timeout
        
        try {
            // Determine the correct endpoint and parameter name based on model type
            const endpoint = (this.settings.openaiModel.startsWith('o3') || this.settings.openaiModel === 'o4-mini')
                ? 'https://api.openai.com/v1/responses'
                : 'https://api.openai.com/v1/chat/completions';
            const isResponsesEndpoint = endpoint.includes('/responses');
            
            // Build messages array with conversation history
            const messages = [
                { role: 'system', content: this.settings.systemPrompt + '\n\nPlease format your responses using Markdown syntax for better readability.' }
            ];
            
            // Add conversation history, but limit to 1/2 of max tokens
            const maxHistoryTokensForRequest = Math.floor(this.settings.maxTokens / 2);
            const recentHistory = this.getLimitedHistory(maxHistoryTokensForRequest);
            messages.push(...recentHistory);
            
            // Add current user message
            messages.push({ role: 'user', content: userMessage });
            
            const requestBody = {
                model: this.settings.openaiModel,
                [isResponsesEndpoint ? 'input' : 'messages']: messages,
                ...(this.settings.openaiModel.includes('gpt-5') || this.settings.openaiModel.includes('gpt-4.1') || this.settings.openaiModel.startsWith('o')
                    ? { max_completion_tokens: this.settings.maxTokens }
                    : { max_tokens: this.settings.maxTokens }),
                stream: false
            };
            
            // Add new parameters for newer models
            if (this.settings.openaiModel.includes('gpt-5') || this.settings.openaiModel.startsWith('o')) {
                requestBody.reasoning_effort = this.settings.reasoningEffort; // low, medium, high
                requestBody.verbosity = this.settings.verbosity; // low, medium, high
            }
            
            console.info(`[ChatGPT API] Request body:`, JSON.stringify(requestBody, null, 2));
            console.info(`[ChatGPT API] Using endpoint: ${endpoint}`);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.settings.openaiApiKey}`
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.info(`[ChatGPT API] Response status: ${response.status} ${response.statusText}`);
            console.info(`[ChatGPT API] Response headers:`, {
                'content-type': response.headers.get('content-type'),
                'content-length': response.headers.get('content-length'),
                'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
                'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining')
            });
            
            if (!response.ok) {
                let errorData = {};
                try {
                    const errorText = await response.text();
                    console.error(`[ChatGPT API] Error response body:`, errorText);
                    errorData = JSON.parse(errorText);
                }
                catch (parseError) {
                    console.error(`[ChatGPT API] Failed to parse error response:`, parseError);
                }
                const errorMessage = `OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || errorData.error?.code || 'Unknown error'}`;
                console.error(`[ChatGPT API] Full error:`, errorMessage);
                throw new Error(errorMessage);
            }
            
            // Handle non-streaming response
            const responseText = await response.text();
            console.info(`[ChatGPT API] Response body length: ${responseText.length} characters`);
            let data;
            try {
                data = JSON.parse(responseText);
            }
            catch (parseError) {
                console.error(`[ChatGPT API] Failed to parse response JSON:`, parseError);
                console.error(`[ChatGPT API] Raw response:`, responseText);
                throw new Error('Invalid JSON response from OpenAI API');
            }
            
            console.info(`[ChatGPT API] Parsed response:`, {
                choices: data.choices?.length || 0,
                usage: data.usage,
                model: data.model
            });
            
            if (!data.choices || data.choices.length === 0) {
                console.error(`[ChatGPT API] No choices in response:`, data);
                throw new Error('No response choices received from ChatGPT');
            }
            
            const content = data.choices[0]?.message?.content;
            if (!content) {
                console.error(`[ChatGPT API] No content in first choice:`, data.choices[0]);
                throw new Error('No content in ChatGPT response');
            }
            
            console.info(`[ChatGPT API] Success! Response length: ${content.length} characters`);
            
            // Store the conversation exchange in history
            this.conversationHistory.push({ role: 'user', content: userMessage });
            this.conversationHistory.push({ role: 'assistant', content: content });
            
            // Trim history to stay within token limits (keep it under 1/2 of max tokens)
            const maxHistoryTokensForStorage = Math.floor(this.settings.maxTokens / 2);
            this.trimHistoryToTokenLimit(maxHistoryTokensForStorage);
            
            console.info(`[ChatGPT API] Conversation history now has ${this.conversationHistory.length} messages`);
            
            return content;
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.error(`[ChatGPT API] Request was aborted (timeout) for model: ${this.settings.openaiModel}`);
                throw new Error(`Request timeout after 60 seconds. This may indicate the model '${this.settings.openaiModel}' is not available or experiencing issues.`);
            }
            console.error(`[ChatGPT API] Request failed:`, error);
            if (error.message.includes('fetch')) {
                throw new Error(`Network error: ${error.message}. Please check your internet connection and try again.`);
            }
            throw error;
        }
    }

    async improveNote(noteContent) {
        const prompt = `Please improve the following note content by enhancing clarity, structure, and readability while preserving the original meaning and key information:

${noteContent}

Please provide only the improved version without any additional commentary.`;
        return await this.sendMessage(prompt);
    }

    async summarizeNote(noteContent) {
        const prompt = `Please provide a concise summary of the following note content, highlighting the key points and main ideas:

${noteContent}

Please provide only the summary without any additional commentary.`;
        return await this.sendMessage(prompt);
    }

    async checkGrammar(text) {
        const prompt = `Please fix any grammar, spelling, and punctuation errors in the following text while preserving the original meaning and style:

${text}

Please provide only the corrected version without any additional commentary.`;
        return await this.sendMessage(prompt);
    }
}

module.exports = ChatGPTAPI;
