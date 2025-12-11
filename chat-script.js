// ====== CONFIGURATION ======
const CONFIG = {
    API_KEY: '', // Set your API key in Settings (⚙️ icon)
    API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    DEFAULT_MODEL: 'meta-llama/llama-3.2-3b-instruct:free',
    SITE_URL: window.location.origin,
    SITE_NAME: 'UniVerse AI'
};

// ====== STATE MANAGEMENT ======
let currentChatId = null;
let chatHistory = [];
let currentMessages = [];
let isGenerating = false;
let currentUtterance = null;
let highlightInterval = null;

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadHistory();
    initializeTextarea();
});

// ====== SETTINGS MANAGEMENT ======
function loadSettings() {
    const savedKey = localStorage.getItem('universe_api_key');
    const savedModel = localStorage.getItem('universe_model');
    const savedTheme = localStorage.getItem('universe_theme') || 'blue-black';

    if (savedKey) {
        CONFIG.API_KEY = savedKey;
        document.getElementById('apiKeyInput').value = savedKey;
    }
    if (savedModel) {
        CONFIG.DEFAULT_MODEL = savedModel;
        document.getElementById('modelSelect').value = savedModel;
    }

    document.getElementById('themeSelect').value = savedTheme;
    applyTheme(savedTheme);
}

function saveApiKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (key) {
        CONFIG.API_KEY = key;
        localStorage.setItem('universe_api_key', key);
        alert('API Key saved successfully!');
    }
}

function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    localStorage.setItem('universe_theme', theme);
    applyTheme(theme);
}

function applyTheme(theme) {
    const root = document.documentElement;
    const themes = {
        'blue-black': { primary: '#2563eb', secondary: '#3b82f6', light: '#60a5fa' },
        'purple-black': { primary: '#7c3aed', secondary: '#8b5cf6', light: '#a78bfa' },
        'green-black': { primary: '#059669', secondary: '#10b981', light: '#34d399' }
    };

    const colors = themes[theme] || themes['blue-black'];
    root.style.setProperty('--primary-blue', colors.primary);
    root.style.setProperty('--secondary-blue', colors.secondary);
    root.style.setProperty('--light-blue', colors.light);
}

function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.toggle('active');
}

// ====== CHAT HISTORY MANAGEMENT ======
function loadHistory() {
    const saved = localStorage.getItem('universe_chat_history');
    if (saved) {
        chatHistory = JSON.parse(saved);
        renderHistory();
    }
}

function saveHistory() {
    localStorage.setItem('universe_chat_history', JSON.stringify(chatHistory));
}

function renderHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    chatHistory.sort((a, b) => b.timestamp - a.timestamp).forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        item.innerHTML = `
            <div class="history-item-content" onclick="loadChat('${chat.id}')">
                <div class="history-item-title">${chat.title}</div>
                <div class="history-item-time">${formatTime(chat.timestamp)}</div>
            </div>
            <button class="history-item-delete" onclick="deleteChat('${chat.id}')" title="Delete">🗑️</button>
        `;
        historyList.appendChild(item);
    });
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return date.toLocaleDateString();
}

function startNewChat() {
    currentChatId = 'chat_' + Date.now();
    currentMessages = [];
    document.getElementById('messagesArea').innerHTML = '';
    document.getElementById('welcomeScreen').style.display = 'flex';
    document.getElementById('chatTitle').textContent = 'UniVerse AI';
    renderHistory();
}

function loadChat(chatId) {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    currentChatId = chatId;
    currentMessages = chat.messages;
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('chatTitle').textContent = chat.title;

    const messagesArea = document.getElementById('messagesArea');
    messagesArea.innerHTML = '';
    currentMessages.forEach(msg => {
        appendMessage(msg.role, msg.content, false);
    });

    renderHistory();
    scrollToBottom();
}

function deleteChat(chatId) {
    if (confirm('Delete this conversation?')) {
        chatHistory = chatHistory.filter(c => c.id !== chatId);
        saveHistory();
        if (chatId === currentChatId) {
            startNewChat();
        }
        renderHistory();
    }
}

function clearCurrentChat() {
    if (confirm('Clear current conversation?')) {
        startNewChat();
    }
}

// ====== MESSAGE HANDLING ======
function initializeTextarea() {
    const textarea = document.getElementById('userInput');
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    });
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function usePrompt(prompt) {
    document.getElementById('userInput').value = prompt;
    sendMessage();
}

async function sendMessage() {
    if (isGenerating) return;

    const input = document.getElementById('userInput');
    const message = input.value.trim();

    if (!message) return;

    // Hide welcome screen on first message
    document.getElementById('welcomeScreen').style.display = 'none';

    // Add user message
    appendMessage('user', message);
    currentMessages.push({ role: 'user', content: message });

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Generate AI response
    isGenerating = true;
    document.getElementById('sendBtn').disabled = true;

    try {
        const response = await callOpenRouter(message);
        appendMessage('assistant', response);
        currentMessages.push({ role: 'assistant', content: response });

        // Save to history
        saveChatToHistory(message);
    } catch (error) {
        appendMessage('assistant', `❌ Error: ${error.message}\n\nPlease check your API key in settings or try again.`);
    } finally {
        isGenerating = false;
        document.getElementById('sendBtn').disabled = false;
        scrollToBottom();
    }
}

function saveChatToHistory(firstMessage) {
    const existingChat = chatHistory.find(c => c.id === currentChatId);

    if (existingChat) {
        existingChat.messages = currentMessages;
        existingChat.timestamp = Date.now();
    } else {
        const title = firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
        chatHistory.push({
            id: currentChatId,
            title: title,
            messages: currentMessages,
            timestamp: Date.now()
        });
        document.getElementById('chatTitle').textContent = title;
    }

    saveHistory();
    renderHistory();
}

function appendMessage(role, content, save = true) {
    const messagesArea = document.getElementById('messagesArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = role === 'user' ? '👤' : '🌌';
    const name = role === 'user' ? 'You' : 'UniVerse AI';

    // Convert markdown to HTML
    let htmlContent = marked.parse(content);

    // Process code blocks with syntax highlighting
    htmlContent = processCodeBlocks(htmlContent);

    messageDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar ${role}">${avatar}</div>
            <div class="message-name">${name}</div>
        </div>
        <div class="message-content">${htmlContent}</div>
        ${role === 'assistant' ? `
        <div class="message-actions">
            <button class="action-btn" onclick="copyMessage(this)">📋 Copy</button>
            <button class="action-btn" onclick="openTeacherMode(this)">🎓 Explain</button>
            <button class="action-btn" onclick="regenerateResponse()">🔄 Regenerate</button>
        </div>
        ` : ''}
    `;

    messagesArea.appendChild(messageDiv);

    // Apply syntax highlighting
    messageDiv.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
}

function processCodeBlocks(html) {
    // Wrap code blocks with header containing language and copy button
    return html.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g, (match, lang, code) => {
        const codeId = 'code_' + Math.random().toString(36).substr(2, 9);
        return `
        <div class="code-block-wrapper">
            <div class="code-header">
                <span class="code-language">${lang}</span>
                <div class="code-actions">
                    <button class="code-btn" onclick="copyCode('${codeId}')">Copy</button>
                </div>
            </div>
            <pre id="${codeId}"><code class="language-${lang}">${code}</code></pre>
        </div>
        `;
    });
}

function copyCode(codeId) {
    const codeElement = document.getElementById(codeId);
    const code = codeElement.textContent;
    copyToClipboard(code);
}

function copyMessage(button) {
    const messageContent = button.closest('.message').querySelector('.message-content');
    const text = messageContent.textContent;
    copyToClipboard(text);
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

async function regenerateResponse() {
    if (currentMessages.length < 2) return;

    // Remove last AI response
    currentMessages.pop();
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.removeChild(messagesArea.lastChild);

    // Get last user message
    const lastUserMsg = currentMessages[currentMessages.length - 1].content;

    // Generate new response
    isGenerating = true;
    document.getElementById('sendBtn').disabled = true;

    try {
        const response = await callOpenRouter(lastUserMsg);
        appendMessage('assistant', response);
        currentMessages.push({ role: 'assistant', content: response });
        saveChatToHistory(lastUserMsg);
    } catch (error) {
        appendMessage('assistant', `❌ Error: ${error.message}`);
    } finally {
        isGenerating = false;
        document.getElementById('sendBtn').disabled = false;
    }
}

// ====== OPENROUTER API INTEGRATION ======
async function callOpenRouter(userMessage) {
    const model = document.getElementById('modelSelect').value || CONFIG.DEFAULT_MODEL;

    const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.API_KEY}`,
            'HTTP-Referer': CONFIG.SITE_URL,
            'X-Title': CONFIG.SITE_NAME,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are UniVerse AI, a helpful, knowledgeable, and friendly AI assistant. Provide clear, accurate, and well-formatted responses. Use markdown for formatting. When providing code, always specify the language.'
                },
                ...currentMessages.slice(-10), // Last 10 messages for context
                { role: 'user', content: userMessage }
            ]
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// ====== AI TEACHER MODE ======
function openTeacherMode(button) {
    const messageContent = button.closest('.message').querySelector('.message-content');
    const text = messageContent.textContent;

    document.getElementById('explanationText').textContent = text;
    document.getElementById('teacherModal').classList.add('active');
}

function closeTeacher() {
    stopTeacherAudio();
    document.getElementById('teacherModal').classList.remove('active');
}

function playTeacherAudio() {
    const text = document.getElementById('explanationText').textContent;

    // Stop any ongoing speech
    if (currentUtterance) {
        speechSynthesis.cancel();
    }

    // Create new utterance
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 0.9;
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;

    // Show speaking indicator
    document.getElementById('speakingIndicator').classList.add('active');

    // Highlight words as they're spoken
    const words = text.split(' ');
    let wordIndex = 0;

    currentUtterance.onboundary = (event) => {
        if (event.name === 'word') {
            highlightWord(words, wordIndex);
            wordIndex++;
        }
    };

    currentUtterance.onend = () => {
        document.getElementById('speakingIndicator').classList.remove('active');
        document.getElementById('explanationText').textContent = text; // Reset highlights
    };

    speechSynthesis.speak(currentUtterance);
}

function pauseTeacherAudio() {
    if (speechSynthesis.speaking) {
        speechSynthesis.pause();
        document.getElementById('speakingIndicator').classList.remove('active');
    }
}

function stopTeacherAudio() {
    speechSynthesis.cancel();
    document.getElementById('speakingIndicator').classList.remove('active');

    // Reset text without highlights
    const text = document.getElementById('explanationText').textContent.replace(/<[^>]*>/g, '');
    document.getElementById('explanationText').textContent = text;
}

function highlightWord(words, index) {
    const container = document.getElementById('explanationText');
    let html = '';

    words.forEach((word, i) => {
        if (i === index) {
            html += `<span class="highlight">${word}</span> `;
        } else {
            html += word + ' ';
        }
    });

    container.innerHTML = html.trim();
}

// ====== EXPORT FUNCTIONALITY ======
function exportChat() {
    if (currentMessages.length === 0) {
        alert('No messages to export');
        return;
    }

    const chatTitle = document.getElementById('chatTitle').textContent;
    let markdown = `# ${chatTitle}\n\n`;
    markdown += `Exported: ${new Date().toLocaleString()}\n\n---\n\n`;

    currentMessages.forEach(msg => {
        const role = msg.role === 'user' ? '**You**' : '**UniVerse AI**';
        markdown += `${role}:\n\n${msg.content}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

// ====== UI HELPERS ======
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function scrollToBottom() {
    const container = document.getElementById('chatContainer');
    container.scrollTop = container.scrollHeight;
}

// ====== KEYBOARD SHORTCUTS ======
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for new chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        startNewChat();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

// ====== SAVE TO LIBRARY FUNCTIONALITY ======
function saveChatToLibrary() {
    if (currentMessages.length === 0) {
        alert('No conversation to save');
        return;
    }

    // Get the chat title and messages
    const title = document.getElementById('chatTitle').textContent;
    const userMessage = currentMessages.find(msg => msg.role === 'user')?.content || 'Untitled';
    const aiResponse = currentMessages.find(msg => msg.role === 'assistant')?.content || '';

    // Create library item
    const libraryItem = {
        id: 'lib_' + Date.now(),
        title: userMessage.substring(0, 100) + (userMessage.length > 100 ? '...' : ''),
        userPrompt: userMessage,
        aiResponse: aiResponse,
        category: detectCategory(userMessage),
        tags: extractTags(userMessage),
        timestamp: Date.now(),
        isFavorite: false,
        views: 0,
        chatId: currentChatId,
        fullConversation: currentMessages
    };

    // Load existing library
    const library = JSON.parse(localStorage.getItem('universe_library') || '[]');

    // Add new item
    library.push(libraryItem);

    // Save back to localStorage
    localStorage.setItem('universe_library', JSON.stringify(library));

    // Show success message and redirect
    if (confirm('✅ Conversation saved to Library!\n\nWould you like to view your library now?')) {
        window.location.href = 'library.html';
    }
}

// Helper function to detect category
function detectCategory(text) {
    const lower = text.toLowerCase();
    if (lower.match(/code|program|function|debug|error|syntax/)) return 'programming';
    if (lower.match(/explain|what is|how does|definition/)) return 'explanation';
    if (lower.match(/math|calculate|equation|solve/)) return 'math';
    if (lower.match(/write|create story|poem|creative/)) return 'creative';
    if (lower.match(/learn|teach|understand|study/)) return 'learning';
    return 'general';
}

// Helper function to extract tags
function extractTags(text) {
    const tags = [];
    const words = text.toLowerCase().split(' ');
    const commonTags = ['javascript', 'python', 'html', 'css', 'react', 'ai', 'machine learning', 'algorithm', 'math', 'science'];

    commonTags.forEach(tag => {
        if (text.toLowerCase().includes(tag)) {
            tags.push(tag);
        }
    });

    return tags.slice(0, 5); // Limit to 5 tags
}

console.log('🌌 UniVerse AI initialized successfully!');
