// ====== ENHANCED UNIVERSE AI - Complete Feature Set ======

// Configuration
const CONFIG = {
    API_KEY: '', // Will be loaded from backend (using Grok API)
    BACKEND_URL: 'http://localhost:8000',
    DEFAULT_MODEL: 'grok-4-latest', // Grok default model
    SITE_URL: window.location.origin,
    SITE_NAME: 'UniVerse AI',
    MAX_RETRIES: 3,
    RETRY_BASE_DELAY_MS: 2000
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
    // This function is mainly used for internal state checks or re-checks
    const token = localStorage.getItem('universe_token');
    if (!token) {
        guestMode = true;
        guestPromptCount = parseInt(localStorage.getItem('universe_guest_count') || '0');
        setupGuestMode();
        return true;
    }
    // Deep validation happens in DOMContentLoaded
    return true;
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

async function loadUserHistory() {
    // Load chat history from backend
    if (guestMode) return;

    try {
        const token = localStorage.getItem('universe_token');
        if (!token) return;

        const response = await fetch(`${CONFIG.BACKEND_URL}/api/chat/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.history && Array.isArray(data.history)) {
                chatHistory = data.history;
                renderHistory();
            }
        }
    } catch (error) {
        console.error('Failed to load history from backend:', error);
    }
}

function saveUserHistory() {
    // No local storage saving.
    // UI updates are handled in memory (chatHistory array)
    // Backend updates are handled via API calls (saveMessageToBackend)
}

async function saveMessageToBackend(role, content) {
    if (guestMode) return;

    try {
        const token = localStorage.getItem('universe_token');
        if (!token) return;

        await fetch(`${CONFIG.BACKEND_URL}/api/chat/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                session_id: currentChatId,
                role: role,
                content: content,
                model: document.getElementById('modelSelect').value || CONFIG.DEFAULT_MODEL
            })
        });
    } catch (error) {
        console.error('Failed to save message to backend:', error);
        // Show user-visible error
        if (typeof showSaveToast === 'function') {
            showSaveToast('⚠️ Network Error: Message could not be saved to history.', 'error');
        } else {
            // Fallback if toast not available
            alert('⚠️ Network Error: Could not save message to history. Please check your connection.');
        }
    }
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
    window.location.href = 'profile.html';
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

function setupGuestMode() {
    document.querySelector('.profile-name').textContent = 'Guest User';
    document.querySelector('.profile-email').textContent = `${GUEST_LIMIT - guestPromptCount} prompts left`;
    document.querySelector('.profile-avatar').textContent = 'G';
    document.querySelector('.profile-avatar').style.backgroundColor = 'var(--secondary-blue)';
    document.querySelector('.profile-avatar').style.color = 'white';

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.textContent = 'Sign Up';
        logoutBtn.onclick = () => window.location.href = 'auth.html';
    }

    if (guestPromptCount >= GUEST_LIMIT - 1) {
        showGuestWarningPopup();
    }
}

// ==== INITIALIZATION ======

document.addEventListener('DOMContentLoaded', async () => {
    // ====== AUTHENTICATION & GUEST MODE ======
    const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

    if (!token) {
        // Enable guest mode - no authentication required
        guestMode = true;
        guestPromptCount = parseInt(localStorage.getItem('universe_guest_count') || '0');
        setupGuestMode();

        // Continue loading the app for guest users
        loadSettings();
        initializeTextarea();
        loadSavedPrompts();
        return;
    }

    // User has a token - validate it with backend
    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/validate`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.valid) {
                // Valid session - update user info and display
                const user = {
                    userId: data.user_id,
                    email: data.email,
                    name: data.full_name,
                    loginTime: Date.now(),
                    rememberMe: true // Assumption
                };
                currentUser = user; // Update global state

                // Keep session info updated in local storage for UI use (display name etc)
                localStorage.setItem('universe_session', JSON.stringify(user));

                displayUserProfile(user);
            } else {
                throw new Error('Session invalid');
            }
        } else {
            throw new Error('Validation failed');
        }
    } catch (e) {
        // Invalid session - switch to guest mode
        console.warn('Session expired or invalid, switching to guest mode:', e);
        localStorage.removeItem('universe_session');
        localStorage.removeItem('universe_token');
        sessionStorage.removeItem('universe_session');
        sessionStorage.removeItem('universe_token');

        guestMode = true;
        guestPromptCount = parseInt(localStorage.getItem('universe_guest_count') || '0');
        setupGuestMode();
    }

    loadSettings();
    initializeTextarea();
    loadSavedPrompts();

    // Add model selection change listener
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
        modelSelect.addEventListener('change', () => {
            const selectedModel = modelSelect.value;
            CONFIG.DEFAULT_MODEL = selectedModel;

            // Debounced backend update
            clearTimeout(preferenceUpdateTimer);
            preferenceUpdateTimer = setTimeout(() => {
                updatePreferences({ model: { default_model: selectedModel } });
            }, 500);
        });
    }
});

// Display user profile in sidebar for authenticated users
function displayUserProfile(user) {
    const users = JSON.parse(localStorage.getItem('universe_users') || '[]');
    const userDetails = users.find(u => u.id === user.userId);

    if (userDetails) {
        document.querySelector('.profile-name').textContent = userDetails.name || user.name || user.email;
        document.querySelector('.profile-email').textContent = userDetails.email || user.email;
        const avatar = userDetails.avatar || (userDetails.name || user.name || user.email).substring(0, 2).toUpperCase();
        document.querySelector('.profile-avatar').textContent = avatar;

        // Set currentUser for the rest of the app
        currentUser = {
            userId: user.userId,
            email: user.email,
            name: userDetails.name || user.name,
            loginTime: user.loginTime,
            rememberMe: user.rememberMe
        };

        // Check if should show welcome popup
        const showWelcome = localStorage.getItem('universe_show_welcome');
        if (showWelcome === 'true') {
            setTimeout(() => {
                showWelcomePopup(currentUser.name || currentUser.email);
                localStorage.removeItem('universe_show_welcome');
            }, 500);
        }

        // Load user-specific chat history
        loadUserHistory();
    } else {
        // User data not found, use session data
        document.querySelector('.profile-name').textContent = user.name || user.email;
        document.querySelector('.profile-email').textContent = user.email;
        const avatar = (user.name || user.email).substring(0, 2).toUpperCase();
        document.querySelector('.profile-avatar').textContent = avatar;

        currentUser = user;

        // Still try to load history with session user ID
        loadUserHistory();
    }
}

// ====== REST OF THE ORIGINAL FUNCTIONS ======
// (Include all the original chat-script.js functions below)

async function loadSettings() {
    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        // Check for local API key override first
        const localKey = localStorage.getItem('universe_api_key_override');
        if (localKey) {
            console.warn('⚠️ Local API key override detected. This is insecure and deprecated.');
            console.warn('⚠️ All API calls should go through the backend proxy.');
        }

        // All API calls go through backend proxy which uses Grok securely
        console.log('🔑 Using backend Grok API proxy (secure)');

        if (!token) {
            // No token, load defaults
            applyTheme('blue-black');
            return;
        }

        const response = await fetch(`${CONFIG.BACKEND_URL}/api/user/preferences`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();

            // Apply theme preferences
            if (data.theme && data.theme.mode) {
                const themeSelect = document.getElementById('themeSelect');
                if (themeSelect) themeSelect.value = data.theme.mode;
                applyTheme(data.theme.mode);
            } else {
                applyTheme('blue-black');
            }

            // Apply model preferences - default to Grok
            if (data.model && data.model.default_model) {
                CONFIG.DEFAULT_MODEL = data.model.default_model;

                const modelSelect = document.getElementById('modelSelect');
                if (modelSelect) {
                    modelSelect.value = CONFIG.DEFAULT_MODEL;

                    // If the specific value isn't in the list, default to Grok
                    if (modelSelect.value === '') {
                        modelSelect.value = 'grok-4-latest';
                        CONFIG.DEFAULT_MODEL = 'grok-4-latest';
                    }
                }
            }

            console.log('✅ Preferences loaded from backend');
        } else {
            console.warn('Failed to load preferences, using defaults');
            applyTheme('blue-black');
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
        applyTheme('blue-black');
    }
}

async function saveApiKey() {
    const key = document.getElementById('apiKeyInput').value.trim();
    if (!key) {
        showToast('Please enter an API key', 'warning');
        return;
    }

    // SECURITY: API keys should NEVER be handled in frontend
    showToast('⚠️ For security, API keys must be configured on the server', 'warning');
    showToast('ℹ️ Please ask your administrator to update the .env file', 'info');

    console.warn('⚠️ API keys should not be handled in the frontend for security reasons');
    console.warn('ℹ️ Configure GROK_API_KEY in the backend .env file instead');
}

// Debounce timer for preference updates
let preferenceUpdateTimer = null;

function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    applyTheme(theme);

    // Debounced backend update
    clearTimeout(preferenceUpdateTimer);
    preferenceUpdateTimer = setTimeout(() => {
        updatePreferences({ theme: { mode: theme } });
    }, 500);
}

// Generic preference update function
async function updatePreferences(updates) {
    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        if (!token) {
            console.warn('No token, skipping preference update');
            return;
        }

        const response = await fetch(`${CONFIG.BACKEND_URL}/api/user/preferences`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            console.log('✅ Preferences updated');
            showToast('Preferences saved', 'success');
        } else {
            console.error('Failed to update preferences');
        }
    } catch (error) {
        console.error('Error updating preferences:', error);
    }
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
    if (guestMode) {
        // Guest mode deletion (local only)
        openConfirmModal('Delete Chat', 'Delete this conversation?', () => {
            chatHistory = chatHistory.filter(c => c.id !== chatId);
            if (chatId === currentChatId) startNewChat();
            renderHistory();
            showToast('Chat deleted', 'info');
        });
        return;
    }

    openConfirmModal('Delete Chat', 'Delete this conversation?', async () => {
        try {
            const token = localStorage.getItem('universe_token');
            if (!token) return;

            const res = await fetch(`${CONFIG.BACKEND_URL}/api/chat/history/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                chatHistory = chatHistory.filter(c => c.id !== chatId);
                saveUserHistory(); // Updates UI/memory
                if (chatId === currentChatId) {
                    startNewChat();
                }
                renderHistory();
                showToast('Chat deleted', 'info');
            } else {
                showToast('Failed to delete chat', 'error');
            }
        } catch (e) {
            console.error('Delete chat error:', e);
            showToast('Error deleting chat', 'error');
        }
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

    // Initialize chat session if not already set
    if (!currentChatId) {
        currentChatId = 'chat_' + Date.now();
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
        // Save user message to backend
        saveMessageToBackend('user', message);

        const response = await callGeminiAPI(message);

        removeLoadingMessage();
        appendMessage('assistant', response);
        currentMessages.push({ role: 'assistant', content: response });

        // Save assistant message to backend
        saveMessageToBackend('assistant', response);

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
        const response = await callGeminiAPI(lastUserMsg);

        removeLoadingMessage();
        appendMessage('assistant', response);
        currentMessages.push({ role: 'assistant', content: response });

        saveMessageToBackend('assistant', response);

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

// Helper function to introduce a delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiAPI(userMessage, retries = 0) {
    try {
        // Build conversation history in OpenAI-compatible format (used by Grok)
        let messages = [];

        if (currentMessages.length > 0) {
            // Include last few messages for context
            const recentMessages = currentMessages.slice(-6);
            messages = recentMessages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            }));
        }

        // Add current user message
        messages.push({
            role: 'user',
            content: userMessage
        });

        // Grok API request format (OpenAI-compatible)
        const requestBody = {
            model: CONFIG.DEFAULT_MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048
        };

        // Use backend proxy for Grok API calls (no direct API key needed in frontend)
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
            if (retries < CONFIG.MAX_RETRIES) {
                const retryAfter = response.headers.get('Retry-After');
                let waitTime = retryAfter ? parseInt(retryAfter) * 1000 : CONFIG.RETRY_BASE_DELAY_MS * Math.pow(2, retries);

                console.warn(`⚠️ Rate limit hit. Retrying in ${waitTime / 1000} seconds... (Attempt ${retries + 1}/${CONFIG.MAX_RETRIES})`);
                showToast(`⏳ Rate limit reached. Retrying in ${Math.ceil(waitTime / 1000)}s...`, 'warning');

                await delay(waitTime);
                return callGeminiAPI(userMessage, retries + 1); // Retry the request
            } else {
                throw new Error('Rate limit exceeded. Please try again in a few moments.');
            }
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `API Error: ${response.status} ${response.statusText}`;

            // Special handling for 402 Payment Required
            if (response.status === 402) {
                throw new Error('API credits exhausted. Please add credits or update your API key in Settings.');
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();

        // Extract response from Open Router/OpenAI format
        if (data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            if (choice.message && choice.message.content) {
                return choice.message.content;
            }
        }

        throw new Error('Unexpected response format from Grok API');

    } catch (error) {
        console.error('Failed to call Grok API:', error);
        throw error;
    }
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
        fetch(`${CONFIG.BACKEND_URL}/api/library/save-prompt`, {
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
