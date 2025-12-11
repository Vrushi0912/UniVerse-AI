// ====== ENHANCED UNIVERSE AI - Complete Feature Set ======

// Configuration
const CONFIG = {
    API_KEY: '', // Set your API key in Settings (⚙️ icon)
    API_URL: 'https://openrouter.ai/api/v1/chat/completions',
    DEFAULT_MODEL: 'meta-llama/llama-3.2-3b-instruct:free',
    SITE_URL: window.location.origin,
    SITE_NAME: 'UniVerse AI'
};

// State Management
let currentUser = null;
let currentChatId = null;
let chatHistory = [];
let currentMessages = [];
let isGenerating = false;
let currentUtterance = null;
let recognition = null;
let isRecording = false;
let currentAttachment = null;
let guestMode = false;
let guestPromptCount = 0;
const GUEST_LIMIT = 5;

// ====== AUTHENTICATION & USER MANAGEMENT ======

function checkAuth() {
    const session = localStorage.getItem('universe_session') || sessionStorage.getItem('universe_session');

    if (!session) {
        // Enable guest mode
        guestMode = true;
        guestPromptCount = parseInt(localStorage.getItem('universe_guest_count') || '0');
        setupGuestMode();
        return true; // Allow guest access
    }

    try {
        currentUser = JSON.parse(session);

        // Check if session is valid (less than 7 days old)
        if (Date.now() - currentUser.loginTime > 7 * 24 * 60 * 60 * 1000) {
            logout();
            return false;
        }

        loadUserProfile();
        loadUserHistory();
        return true;
    } catch (e) {
        logout();
        return false;
    }
}

function setupGuestMode() {
    // Setup guest profile
    document.querySelector('.profile-name').textContent = 'Guest User';
    document.querySelector('.profile-email').textContent = `${GUEST_LIMIT - guestPromptCount} prompts left`;
    document.querySelector('.profile-avatar').textContent = 'G';
    document.querySelector('.profile-avatar').style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';

    // Update logout button to login for guest
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.innerHTML = '🔑 Login';
        logoutBtn.onclick = () => window.location.href = 'auth.html';
    }
}

function loadUserProfile() {
    const users = JSON.parse(localStorage.getItem('universe_users') || '[]');
    const user = users.find(u => u.id === currentUser.userId);

    if (user) {
        document.querySelector('.profile-name').textContent = user.name;
        document.querySelector('.profile-email').textContent = user.email;
        document.querySelector('.profile-avatar').textContent = user.avatar || user.name.substring(0, 2).toUpperCase();

        // Check if should show welcome popup (set from auth page)
        const showWelcome = localStorage.getItem('universe_show_welcome');
        if (showWelcome === 'true') {
            // Delay to ensure page is fully loaded
            setTimeout(() => {
                showWelcomePopup(user.name);
                localStorage.removeItem('universe_show_welcome');
            }, 500);
        }
    }
}

function loadUserHistory() {
    // Load chat history specific to this user
    const userHistoryKey = `universe_chat_history_${currentUser.userId}`;
    const saved = localStorage.getItem(userHistoryKey);

    if (saved) {
        chatHistory = JSON.parse(saved);
        renderHistory();
    }
}

function saveUserHistory() {
    // Save chat history for current user only
    if (guestMode) {
        // Don't save history for guests
        return;
    }
    const userHistoryKey = `universe_chat_history_${currentUser.userId}`;
    localStorage.setItem(userHistoryKey, JSON.stringify(chatHistory));
}

function logout() {
    const userName = currentUser ? document.querySelector('.profile-name').textContent : 'there';
    showLogoutPopup(userName);

    setTimeout(() => {
        localStorage.removeItem('universe_session');
        sessionStorage.removeItem('universe_session');
        window.location.href = 'auth.html';
    }, 1500);
}

function toggleProfile() {
    document.getElementById('profileDropdown').classList.toggle('hidden');
}

function viewProfile() {
    alert('Profile page coming soon!');
    toggleProfile();
}

// ====== FILE & PHOTO UPLOAD ======

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    currentAttachment = {
        type: 'file',
        name: file.name,
        size: file.size,
        file: file
    };

    showAttachmentPreview();
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    currentAttachment = {
        type: 'image',
        name: file.name,
        size: file.size,
        file: file
    };

    // Convert image to base64 for preview
    const reader = new FileReader();
    reader.onload = (e) => {
        currentAttachment.preview = e.target.result;
        showAttachmentPreview();
    };
    reader.readAsDataURL(file);
}

function showAttachmentPreview() {
    const preview = document.getElementById('attachmentPreview');
    preview.classList.remove('hidden');

    const icon = currentAttachment.type === 'image' ? '🖼️' : '📎';
    const sizeStr = formatFileSize(currentAttachment.size);

    preview.innerHTML = `
        <div class="file-info">
            <span class="file-icon">${icon}</span>
            <div>
                <div class="file-name">${currentAttachment.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${sizeStr}</div>
            </div>
        </div>
        <button class="remove-btn" onclick="removeAttachment()">✕</button>
    `;
}

function removeAttachment() {
    currentAttachment = null;
    document.getElementById('attachmentPreview').classList.add('hidden');
    document.getElementById('fileInput').value = '';
    document.getElementById('photoInput').value = '';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ====== VOICE RECOGNITION ======

function toggleVoiceInput() {
    if (!recognition) {
        initVoiceRecognition();
    }

    if (isRecording) {
        stopVoiceRecognition();
    } else {
        startVoiceRecognition();
    }
}

function initVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('❌ Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isRecording = true;
        document.getElementById('voiceBtn').classList.add('recording');
        document.getElementById('voiceBtn').innerHTML = '⏺️';
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        document.getElementById('userInput').value = transcript;
    };

    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        stopVoiceRecognition();
    };

    recognition.onend = () => {
        stopVoiceRecognition();
    };
}

function startVoiceRecognition() {
    if (recognition) {
        recognition.start();
    }
}

function stopVoiceRecognition() {
    isRecording = false;
    document.getElementById('voiceBtn').classList.remove('recording');
    document.getElementById('voiceBtn').innerHTML = '🎤';
    if (recognition) {
        recognition.stop();
    }
}

// ====== SIDEBAR NAVIGATION ======

function showSection(section) {
    switch (section) {
        case 'chats':
            // Already showing chats
            break;
        case 'library':
            alert('📚 Library feature coming soon!');
            break;
        case 'projects':
            alert('📁 Projects feature coming soon!');
            break;
    }
}

function searchChats() {
    const query = prompt('🔍 Search your chats:');
    if (!query) return;
    saveRecentSearch(query);
    const lower = query.toLowerCase();
    const matches = chatHistory.filter(chat => chat.title.toLowerCase().includes(lower));
    const others = chatHistory.filter(chat => !chat.title.toLowerCase().includes(lower));
    const ordered = [...matches, ...others];
    renderHistoryOrdered(ordered);
}

// ====== WELCOME & LOGOUT POPUPS ======

function showWelcomePopup(name) {
    const popup = document.createElement('div');
    popup.className = 'welcome-popup';
    popup.innerHTML = `
        <div class="welcome-popup-content">
            <div class="welcome-icon">👋</div>
            <h2>Welcome Back!</h2>
            <p>Hi <strong>${name}</strong>, ready to create amazing things?</p>
            <div class="welcome-sparkle">✨</div>
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.classList.add('show'), 100);
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 500);
    }, 3000);
}

function showLogoutPopup(name) {
    const popup = document.createElement('div');
    popup.className = 'welcome-popup';
    popup.innerHTML = `
        <div class="welcome-popup-content logout">
            <div class="welcome-icon">👋</div>
            <h2>See You Soon!</h2>
            <p>Thanks for using UniVerse AI, <strong>${name}</strong></p>
            <div class="welcome-sparkle">🌟</div>
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.classList.add('show'), 100);
}

function checkGuestLimit() {
    if (!guestMode) return true;

    if (guestPromptCount >= GUEST_LIMIT) {
        showGuestLimitPopup();
        return false;
    }
    return true;
}

function incrementGuestCount() {
    if (guestMode) {
        guestPromptCount++;
        localStorage.setItem('universe_guest_count', guestPromptCount.toString());

        // Update profile to show remaining
        document.querySelector('.profile-email').textContent = `${GUEST_LIMIT - guestPromptCount} prompts left`;

        // Show warning at 4th prompt
        if (guestPromptCount === 4) {
            showGuestWarningPopup();
        }
    }
}

function showGuestWarningPopup() {
    const popup = document.createElement('div');
    popup.className = 'welcome-popup';
    popup.innerHTML = `
        <div class="welcome-popup-content warning">
            <div class="welcome-icon">⚠️</div>
            <h2>One More Left!</h2>
            <p>You have <strong>1 free prompt</strong> remaining.</p>
            <p style="margin-top: 0.5rem; font-size: 0.875rem;">Sign up to get unlimited access!</p>
            <button onclick="window.location.href='auth.html'" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: var(--primary-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Sign Up Now</button>
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.classList.add('show'), 100);
    setTimeout(() => {
        popup.classList.remove('show');
        setTimeout(() => popup.remove(), 500);
    }, 5000);
}

function showGuestLimitPopup() {
    const popup = document.createElement('div');
    popup.className = 'welcome-popup';
    popup.innerHTML = `
        <div class="welcome-popup-content limit">
            <div class="welcome-icon">🔒</div>
            <h2>Free Prompts Used Up!</h2>
            <p>You've used all <strong>5 free prompts</strong>.</p>
            <p style="margin-top: 0.5rem;">Create an account to continue chatting!</p>
            <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                <button onclick="window.location.href='auth.html'" style="flex: 1; padding: 0.75rem; background: var(--primary-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Sign Up Free</button>
                <button onclick="this.closest('.welcome-popup').remove()" style="flex: 1; padding: 0.75rem; background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">Maybe Later</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => popup.classList.add('show'), 100);
}

// ==== INITIALIZATION ======

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    if (!checkAuth()) return;

    loadSettings();
    initializeTextarea();
    startNewChat();
    loadSavedPrompts();
});

// ====== REST OF THE ORIGINAL FUNCTIONS ======
// (Include all the original chat-script.js functions below)

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
        showToast('API Key saved', 'success');
    }
}

function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    localStorage.setItem('universe_theme', theme);
    applyTheme(theme);
    showToast('Theme updated', 'success');
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

function renderHistoryOrdered(list) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    list.forEach(chat => {
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

function getRecentSearchKey() {
    if (currentUser && currentUser.userId) return `universe_recent_searches_${currentUser.userId}`;
    return 'universe_recent_searches_guest';
}

function saveRecentSearch(query) {
    const key = getRecentSearchKey();
    let arr = JSON.parse(localStorage.getItem(key) || '[]');
    const trimmed = query.trim();
    arr = [trimmed, ...arr.filter(q => q !== trimmed)].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(arr));
}

function findMatchingChat(text) {
    const lower = text.toLowerCase();
    return chatHistory.find(c => c.title.toLowerCase() === lower) || chatHistory.find(c => c.title.toLowerCase().includes(lower));
}

function getSavedPromptsKey() {
    if (currentUser && currentUser.userId) return `universe_saved_prompts_${currentUser.userId}`;
    return 'universe_saved_prompts_guest';
}

function loadSavedPrompts() {
    const key = getSavedPromptsKey();
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    renderSavedPrompts(arr);
}

function renderSavedPrompts(list) {
    const container = document.getElementById('savedPromptsList');
    if (!container) return;
    container.innerHTML = '';
    list.forEach(p => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <div class="history-item-content" onclick="usePrompt('${p.replace(/'/g, "&#39;")}')">
                <div class="history-item-title">${p.length > 50 ? p.substring(0, 50) + '...' : p}</div>
                <div class="history-item-time">Saved</div>
            </div>
            <button class="history-item-delete" onclick="deleteSavedPrompt('${p.replace(/'/g, "&#39;")}')" title="Delete">🗑️</button>
        `;
        container.appendChild(item);
    });
}

function saveCurrentPrompt() {
    const input = document.getElementById('userInput');
    const text = (input.value || '').trim();
    if (!text) return;
    const key = getSavedPromptsKey();
    let arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr = [text, ...arr.filter(t => t !== text)].slice(0, 20);
    localStorage.setItem(key, JSON.stringify(arr));
    renderSavedPrompts(arr);
    showToast('Prompt saved', 'success');
}

function deleteSavedPrompt(text) {
    const key = getSavedPromptsKey();
    let arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr = arr.filter(t => t !== text);
    localStorage.setItem(key, JSON.stringify(arr));
    renderSavedPrompts(arr);
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
    openConfirmModal('Delete Chat', 'Delete this conversation?', () => {
        chatHistory = chatHistory.filter(c => c.id !== chatId);
        saveUserHistory();
        if (chatId === currentChatId) {
            startNewChat();
        }
        renderHistory();
        showToast('Chat deleted', 'info');
    });
}

function clearCurrentChat() {
    openConfirmModal('Clear Chat', 'Clear current conversation?', () => {
        startNewChat();
        showToast('Chat cleared', 'info');
    });
}

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

    // Check guest limit before sending
    if (!checkGuestLimit()) {
        return;
    }

    const input = document.getElementById('userInput');
    let message = input.value.trim();

    if (!message && !currentAttachment) return;

    // Add file info to message if attachment exists
    if (currentAttachment) {
        message += `\n\n[Attached: ${currentAttachment.name}]`;
    }

    const match = findMatchingChat(message);
    if (match && currentChatId !== match.id) {
        loadChat(match.id);
    }
    saveRecentSearch(message);

    document.getElementById('welcomeScreen').style.display = 'none';

    const container = document.getElementById('chatContainer');
    const wasAtBottom = isAtBottom(container);
    appendMessage('user', message);
    currentMessages.push({ role: 'user', content: message });

    input.value = '';
    input.style.height = 'auto';
    removeAttachment();

    isGenerating = true;
    document.getElementById('sendBtn').disabled = true;

    // Show loading animation
    showLoadingMessage();

    try {
        const response = await callOpenRouter(message);

        removeLoadingMessage();
        appendMessage('assistant', response);
        currentMessages.push({ role: 'assistant', content: response });

        // Increment guest count after successful response
        incrementGuestCount();

        saveChatToHistory(message);
    } catch (error) {
        // Remove loading animation on error
        removeLoadingMessage();
        appendMessage('assistant', `❌ Error: ${error.message}\n\nPlease check your API key in settings or try again.`);
    } finally {
        isGenerating = false;
        document.getElementById('sendBtn').disabled = false;
        if (wasAtBottom) scrollToBottom();
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

    saveUserHistory();
    renderHistory();
}

function appendMessage(role, content, save = true) {
    const messagesArea = document.getElementById('messagesArea');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = role === 'user' ? '👤' : '🌌';
    // Fix: Handle guest mode where currentUser is null
    const name = role === 'user' ? (currentUser ? currentUser.name : 'Guest User') : 'UniVerse AI';

    let htmlContent = marked.parse(content);
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
        ` : `
        <div class="message-actions">
            <button class="action-btn" onclick="copyMessage(this)">📋 Copy</button>
            <button class="action-btn" onclick="savePromptFromMessage(this)">💾 Save</button>
        </div>
        `}
    `;

    messagesArea.appendChild(messageDiv);

    messageDiv.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
}

function savePromptFromMessage(button) {
    const messageContent = button.closest('.message').querySelector('.message-content');
    const text = messageContent.textContent.trim();
    if (!text) return;
    savePromptText(text);
}

function savePromptText(text) {
    const key = getSavedPromptsKey();
    let arr = JSON.parse(localStorage.getItem(key) || '[]');
    arr = [text, ...arr.filter(t => t !== text)].slice(0, 20);
    localStorage.setItem(key, JSON.stringify(arr));
    renderSavedPrompts(arr);
    showToast('Prompt saved', 'success');
}

// Loading Animation Functions
function showLoadingMessage() {
    const messagesArea = document.getElementById('messagesArea');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant loading-message';
    loadingDiv.id = 'loadingMessage';

    loadingDiv.innerHTML = `
        <div class="message-header">
            <div class="message-avatar assistant">🌌</div>
            <div class="message-name">UniVerse AI</div>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <div class="loading-text">Thinking...</div>
        </div>
    `;

    messagesArea.appendChild(loadingDiv);
    scrollToBottom();
}

function removeLoadingMessage() {
    const loadingMsg = document.getElementById('loadingMessage');
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

function processCodeBlocks(html) {
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
    copyToClipboard(text, button);
}

function copyToClipboard(text, button) {
    const onSuccess = () => {
        const originalText = button.textContent;
        button.textContent = '✓ Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                onSuccess();
            } finally {
                ta.remove();
            }
        });
    } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            onSuccess();
        } finally {
            ta.remove();
        }
    }
}

async function regenerateResponse() {
    if (currentMessages.length < 2) return;

    currentMessages.pop();
    const messagesArea = document.getElementById('messagesArea');
    messagesArea.removeChild(messagesArea.lastChild);

    const lastUserMsg = currentMessages[currentMessages.length - 1].content;
    const container = document.getElementById('chatContainer');
    const wasAtBottom = isAtBottom(container);

    isGenerating = true;
    document.getElementById('sendBtn').disabled = true;

    // Show loading animation
    showLoadingMessage();

    try {
        const response = await callOpenRouter(lastUserMsg);

        removeLoadingMessage();
        appendMessage('assistant', response);
        currentMessages.push({ role: 'assistant', content: response });
        saveChatToHistory(lastUserMsg);
    } catch (error) {
        // Remove loading animation on error
        removeLoadingMessage();
        appendMessage('assistant', `❌ Error: ${error.message}`);
    } finally {
        isGenerating = false;
        document.getElementById('sendBtn').disabled = false;
        if (wasAtBottom) scrollToBottom();
    }
}

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
                ...currentMessages.slice(-10),
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

// AI Teacher functions
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

    if (currentUtterance) {
        speechSynthesis.cancel();
    }

    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 0.9;
    currentUtterance.pitch = 1.0;
    currentUtterance.volume = 1.0;

    document.getElementById('speakingIndicator').classList.add('active');

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
        document.getElementById('explanationText').textContent = text;
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

function exportChat() {
    if (currentMessages.length === 0) {
        showToast('No messages to export', 'error');
        return;
    }
    openExportModal();
}

function saveChatToLibrary() {
    if (currentMessages.length === 0) {
        showToast('No messages to save', 'info');
        return;
    }
    const title = document.getElementById('chatTitle').textContent || 'Conversation';
    let markdown = `# ${title}\n\n`;
    markdown += `Saved: ${new Date().toLocaleString()}\n\n---\n\n`;
    currentMessages.forEach(msg => {
        const role = msg.role === 'user' ? '**You**' : '**UniVerse AI**';
        markdown += `${role}:\n\n${msg.content}\n\n---\n\n`;
    });
    const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');
    if (token) {
        fetch('/api/library/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ topic: title, content: markdown, diagram_data: null, audio_script: '' })
        })
            .then(r => r.json())
            .then(() => showToast('Saved to Library', 'success'))
            .catch(() => {
                saveLibraryLocal(title, markdown);
                showToast('Saved locally', 'info');
            });
    } else {
        saveLibraryLocal(title, markdown);
        showToast('Login to sync Library', 'info');
    }
}

function saveLibraryLocal(topic, content) {
    const key = 'universe_library_items';
    const preview = content.substring(0, 140) + (content.length > 140 ? '...' : '');
    const item = { topic, preview, favorite: false };
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    const next = [item, ...arr.filter(i => i.topic !== topic)].slice(0, 100);
    localStorage.setItem(key, JSON.stringify(next));
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function scrollToBottom() {
    const container = document.getElementById('chatContainer');
    container.scrollTop = container.scrollHeight;
}

function isAtBottom(container) {
    const threshold = 20;
    return container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
}

function showToast(message, type = 'success') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    c.appendChild(t);
    setTimeout(() => {
        t.remove();
    }, 3000);
}

function openConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const ok = document.getElementById('confirmOkBtn');
    ok.onclick = () => {
        closeConfirmModal();
        if (onConfirm) onConfirm();
    };
    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

function openExportModal() {
    document.getElementById('exportModal').classList.add('active');
}

function closeExportModal() {
    document.getElementById('exportModal').classList.remove('active');
}

function confirmExport() {
    const format = document.getElementById('exportFormat').value;
    const chatTitle = document.getElementById('chatTitle').textContent;
    let blob;
    if (format === 'markdown') {
        let markdown = `# ${chatTitle}\n\n`;
        markdown += `Exported: ${new Date().toLocaleString()}\n\n---\n\n`;
        currentMessages.forEach(msg => {
            const role = msg.role === 'user' ? '**You**' : '**UniVerse AI**';
            markdown += `${role}:\n\n${msg.content}\n\n---\n\n`;
        });
        blob = new Blob([markdown], { type: 'text/markdown' });
    } else {
        blob = new Blob([JSON.stringify({ title: chatTitle, messages: currentMessages }, null, 2)], { type: 'application/json' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatTitle.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${format === 'markdown' ? 'md' : 'json'}`;
    a.click();
    URL.revokeObjectURL(url);
    closeExportModal();
    showToast('Chat exported', 'success');
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        startNewChat();
    }

    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});

// Close modal on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

console.log('🌌 UniVerse AI - Enhanced version initialized!');
