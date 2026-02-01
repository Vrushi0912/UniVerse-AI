// ====== CHAT SAVE INTEGRATION ======
// Integrates save prompt functionality with chat interface - Backend API version
const API_BASE_URL = 'http://localhost:8000';

// Track last user prompt and AI response for saving
let lastUserPrompt = null;
let lastAIResponse = null;

// ====== SAVE CURRENT PROMPT-RESPONSE PAIR ======

async function saveCurrentPrompt() {
    // Get the last exchange from currentMessages
    if (!window.currentMessages || window.currentMessages.length === 0) {
        showSaveToast('No conversation to save yet. Send a message first!', 'warning');
        return;
    }

    // Get the last exchange (user + assistant)
    let lastUserMsg = null;
    let lastAIMsg = null;

    for (let i = window.currentMessages.length - 1; i >= 0; i--) {
        if (window.currentMessages[i].role === 'assistant' && !lastAIMsg) {
            lastAIMsg = window.currentMessages[i].content;
        }
        if (window.currentMessages[i].role === 'user' && !lastUserMsg) {
            lastUserMsg = window.currentMessages[i].content;
        }
        if (lastUserMsg && lastAIMsg) break;
    }

    if (!lastUserMsg || !lastAIMsg) {
        showSaveToast('No complete conversation found!', 'warning');
        return;
    }

    // Get current model
    const model = document.getElementById('modelSelect')?.value || 'unknown';

    // Save using backend API
    console.log('💾 Attempting to save prompt:', { prompt: lastUserMsg.substring(0, 50), response: lastAIMsg.substring(0, 50) });

    const success = await saveToBackend(lastUserMsg, lastAIMsg, {
        model: model,
        chatId: window.currentChatId || null
    });

    if (success) {
        console.log('✅ Prompt saved successfully');
        showSaveToast('💾 Prompt saved to library!', 'success');
    } else {
        console.error('❌ Failed to save prompt');
        showSaveToast('Failed to save prompt', 'error');
    }
}

// ====== SAVE TO LIBRARY (from header button) ======

async function saveChatToLibrary() {
    console.log('💾 Save button clicked');

    // Check if we have messages
    if (!window.currentMessages || window.currentMessages.length === 0) {
        // Try to get from DOM if currentMessages is empty
        const messages = document.querySelectorAll('.message');
        if (messages.length === 0) {
            showSaveToast('No conversation to save yet. Send a message first!', 'warning');
            return;
        }
    }

    // Get the last exchange (user + assistant)
    let lastUserMsg = null;
    let lastAIMsg = null;

    // Try to get from state first
    if (window.currentMessages && window.currentMessages.length > 0) {
        for (let i = window.currentMessages.length - 1; i >= 0; i--) {
            if (window.currentMessages[i].role === 'assistant' && !lastAIMsg) {
                lastAIMsg = window.currentMessages[i].content;
            }
            if (window.currentMessages[i].role === 'user' && !lastUserMsg) {
                lastUserMsg = window.currentMessages[i].content;
            }
            if (lastUserMsg && lastAIMsg) break;
        }
    }

    // Fallback to DOM if state is empty
    if (!lastUserMsg || !lastAIMsg) {
        const userMsgs = document.querySelectorAll('.message.user .message-content');
        const aiMsgs = document.querySelectorAll('.message.assistant .message-content');

        if (userMsgs.length > 0) lastUserMsg = userMsgs[userMsgs.length - 1].innerText;
        if (aiMsgs.length > 0) lastAIMsg = aiMsgs[aiMsgs.length - 1].innerText;
    }

    if (!lastUserMsg) {
        showSaveToast('No user message found to save.', 'warning');
        return;
    }

    // Save to backend
    const success = await saveToBackend(lastUserMsg, lastAIMsg || '(No response)', {
        model: document.getElementById('modelSelect')?.value || 'unknown'
    });

    if (success) {
        console.log('✅ Saved to backend');
        DialogSystem.show('conversation_saved',
            () => { window.location.href = 'library.html'; }
        );
    } else {
        showSaveToast('Failed to save to library', 'error');
    }
}

// ====== BACKEND SAVE FUNCTION ======

async function saveToBackend(userPrompt, aiResponse, options = {}) {
    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        if (!token) {
            showSaveToast('Please log in to save prompts', 'warning');
            return false;
        }

        // Prepare the prompt data
        const promptData = {
            title: userPrompt.substring(0, 100), // Use first 100 chars as title
            content: aiResponse.trim(),
            description: userPrompt.trim(),
            category: categorizePrompt(userPrompt),
            tags: extractTags(userPrompt),
            is_public: false,
            model_preference: options.model || null,
            temperature: null
        };

        const response = await fetch(`${API_BASE_URL}/api/library/save-prompt`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(promptData)
        });

        if (!response.ok) {
            if (response.status === 401) {
                showSaveToast('Session expired. Please log in again.', 'error');
            } else {
                const error = await response.json();
                console.error('Save failed:', error);
                showSaveToast('Failed to save: ' + (error.error || 'Unknown error'), 'error');
            }
            return false;
        }

        const result = await response.json();
        console.log('💾 Saved to backend:', result);
        return true;

    } catch (error) {
        console.error('Error saving to backend:', error);
        showSaveToast('Network error. Please check your connection.', 'error');
        return false;
    }
}

// ====== OVERRIDE SAVE FUNCTION FOR INDIVIDUAL MESSAGES ======

window.savePromptFromMessage = async function (button) {
    const userMsgDiv = button.closest('.message');
    const userText = userMsgDiv.querySelector('.message-content').innerText.trim();

    // Attempt to find the next sibling which should be the AI response
    let aiText = '(No response saved)';
    const nextElem = userMsgDiv.nextElementSibling;

    if (nextElem && nextElem.classList.contains('message') && nextElem.classList.contains('assistant')) {
        aiText = nextElem.querySelector('.message-content').innerText.trim();
    }

    if (!userText) return;

    // Save to backend
    const success = await saveToBackend(userText, aiText, {
        model: document.getElementById('modelSelect')?.value || 'unknown'
    });

    if (success) {
        showSaveToast('Prompt saved to library!', 'success');
    }
};

// ====== HELPER FUNCTIONS ======

function extractTags(text) {
    const tags = [];
    const lower = text.toLowerCase();
    const commonTags = ['javascript', 'python', 'html', 'css', 'react', 'ai', 'machine learning', 'algorithm', 'math', 'science', 'explain', 'code'];
    commonTags.forEach(tag => {
        if (lower.includes(tag)) tags.push(tag);
    });
    return tags.slice(0, 5);
}

function categorizePrompt(text) {
    const lower = text.toLowerCase();
    if (lower.match(/code|program|function|debug|error|syntax/)) return 'programming';
    if (lower.match(/explain|what is|how does|definition/)) return 'explanation';
    if (lower.match(/math|calculate|equation|solve/)) return 'math';
    if (lower.match(/write|create|poem|story/)) return 'creative';
    return 'general';
}

// ====== UTILITY FUNCTIONS ======

function getTimeAgoShort(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
}

function showSaveToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.save-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'save-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-left: 4px solid ${type === 'success' ? 'var(--success-color, #10b981)' : type === 'warning' ? 'var(--warning-color, #f59e0b)' : 'var(--danger-color, #ef4444)'};
        border-radius: 10px;
        padding: 1rem 1.5rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;

    const icon = type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕';
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ====== INITIALIZATION ======

document.addEventListener('DOMContentLoaded', () => {
    console.log('💾 Chat Save Integration initialized (Backend API version)');
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    :root {
        --success-color: #10b981;
        --warning-color: #f59e0b;
        --danger-color: #ef4444;
    }
`;
document.head.appendChild(style);

console.log('💾 Chat Save Integration initialized (Backend API version)');
