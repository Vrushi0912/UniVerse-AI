// ====== CHAT SAVE INTEGRATION ======
// Integrates save prompt functionality with chat interface

// Track last user prompt and AI response for saving
let lastUserPrompt = null;
let lastAIResponse = null;

// ====== SAVE CURRENT PROMPT-RESPONSE PAIR ======

function saveCurrentPrompt() {
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

    // Save using the SavePromptSystem
    console.log('💾 Attempting to save prompt:', { prompt: lastUserMsg.substring(0, 50), response: lastAIMsg.substring(0, 50) });
    const entry = window.SavePromptSystem.savePrompt(lastUserMsg, lastAIMsg, {
        model: model,
        chatId: window.currentChatId || null
    });

    if (entry) {
        console.log('✅ Prompt saved successfully:', entry.id);
        console.log('Total saved prompts:', window.SavePromptSystem.getAllPrompts().length);
        showSaveToast('💾 Prompt saved to library!', 'success');
        updateSavedPromptsInSidebar();
    } else {
        console.error('❌ Failed to save prompt');
    }
}

// ====== SAVE TO LIBRARY (from header button) ======

function saveChatToLibrary() {
    console.log('💾 Save button clicked');

    // Check if we have messages
    if (!window.currentMessages || window.currentMessages.length === 0) {
        // Try to get from DOM if currentMessages is empty
        const messages = document.querySelectorAll('.message');
        if (messages.length === 0) {
            alert('No conversation to save yet. Send a message first!');
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
        alert('No user message found to save.');
        return;
    }

    // Construct the entry
    const entry = {
        id: 'prompt_' + Date.now(),
        prompt: lastUserMsg.trim(),
        response: (lastAIMsg || '(No response)').trim(),
        savedAt: Date.now(),
        model: document.getElementById('modelSelect')?.value || 'unknown',
        tags: extractTags(lastUserMsg),
        category: categorizePrompt(lastUserMsg),
        favorite: false,
        viewCount: 0
    };

    // Save directly to localStorage to ensure it works
    try {
        const existingJSON = localStorage.getItem('universe_saved_prompts');
        const outputArr = existingJSON ? JSON.parse(existingJSON) : [];
        outputArr.push(entry);
        localStorage.setItem('universe_saved_prompts', JSON.stringify(outputArr));

        console.log('✅ Saved directly to localStorage:', entry);

        if (confirm('✅ Conversation saved to Library! View it now?')) {
            window.location.href = 'library.html';
        }
    } catch (e) {
        console.error('Save failed:', e);
        alert('Failed to save to library: ' + e.message);
    }
}

// ====== OVERRIDE SAVE FUNCTION FOR INDIVIDUAL MESSAGES ======
// This fixes the issue where clicking "Save" on a specific message was using the wrong storage key

window.savePromptFromMessage = function (button) {
    const userMsgDiv = button.closest('.message');
    const userText = userMsgDiv.querySelector('.message-content').innerText.trim();

    // Attempt to find the next sibling which should be the AI response
    let aiText = '(No response saved)';
    const nextElem = userMsgDiv.nextElementSibling;

    if (nextElem && nextElem.classList.contains('message') && nextElem.classList.contains('assistant')) {
        aiText = nextElem.querySelector('.message-content').innerText.trim();
    }

    if (!userText) return;

    // Construct the entry
    const entry = {
        id: 'prompt_' + Date.now(),
        prompt: userText,
        response: aiText,
        savedAt: Date.now(),
        model: document.getElementById('modelSelect')?.value || 'unknown',
        tags: extractTags(userText),
        category: categorizePrompt(userText),
        favorite: false,
        viewCount: 0
    };

    // Save to correct storage
    try {
        const existingJSON = localStorage.getItem('universe_saved_prompts');
        const outputArr = existingJSON ? JSON.parse(existingJSON) : [];
        outputArr.push(entry);
        localStorage.setItem('universe_saved_prompts', JSON.stringify(outputArr));

        console.log('✅ Individual prompt saved:', entry);
        alert('Prompt saved to library!');
    } catch (e) {
        console.error('Save failed:', e);
        alert('Failed to save: ' + e.message);
    }
};

// Helpers for the standalone function
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

// ====== UPDATE SAVED PROMPTS IN SIDEBAR ======

function updateSavedPromptsInSidebar() {
    const savedPromptsList = document.getElementById('savedPromptsList');
    if (!savedPromptsList) return;

    const savedPrompts = window.SavePromptSystem.getAllPrompts().slice(0, 5); // Show last 5

    savedPromptsList.innerHTML = '';

    if (savedPrompts.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.style.cssText = 'padding: 1rem; text-align: center; color: var(--text-secondary); font-size: 0.875rem;';
        emptyState.textContent = 'No saved prompts yet';
        savedPromptsList.appendChild(emptyState);
        return;
    }

    savedPrompts.forEach(prompt => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.style.cursor = 'pointer';

        const truncatedPrompt = prompt.prompt.substring(0, 50) + (prompt.prompt.length > 50 ? '...' : '');
        const timeAgo = getTimeAgoShort(new Date(prompt.savedAt));

        item.innerHTML = `
            <div class="history-item-content" onclick="viewSavedPrompt('${prompt.id}')">
                <div class="history-item-title">${truncatedPrompt}</div>
                <div class="history-item-time">${timeAgo} • ${prompt.category}</div>
            </div>
            <button class="history-item-delete" onclick="event.stopPropagation(); deleteSavedPrompt('${prompt.id}')" title="Delete">🗑️</button>
        `;

        savedPromptsList.appendChild(item);
    });
}

function viewSavedPrompt(promptId) {
    // Redirect to library with prompt opened
    window.location.href = `library.html?prompt=${promptId}`;
}

function deleteSavedPrompt(promptId) {
    if (confirm('Delete this saved prompt?')) {
        window.SavePromptSystem.deletePrompt(promptId);
        updateSavedPromptsInSidebar();
        showSaveToast('Prompt deleted', 'success');
    }
}

// ====== AI SUGGESTIONS ======

function showAISuggestions() {
    const userInput = document.getElementById('userInput');
    if (!userInput) return;

    const currentText = userInput.value.trim();

    // Only show suggestions if user has typed at least 3 words
    if (currentText.split(' ').length < 3) return;

    const suggestions = window.SavePromptSystem.getSuggestions(currentText, 3);

    if (suggestions.length === 0) return;

    // Remove existing suggestions
    const existingSuggestions = document.getElementById('aiSuggestions');
    if (existingSuggestions) {
        existingSuggestions.remove();
    }

    // Create suggestions panel
    const suggestionsPanel = document.createElement('div');
    suggestionsPanel.id = 'aiSuggestions';
    suggestionsPanel.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 0;
        right: 0;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 10px 10px 0 0;
        padding: 1rem;
        margin-bottom: 0.5rem;
        box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.3);
        z-index: 10;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--primary-blue); display: flex; justify-content: space-between; align-items: center;';
    title.innerHTML = `
        <span>💡 Similar saved prompts</span>
        <button onclick="document.getElementById('aiSuggestions').remove()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.2rem;">✕</button>
    `;
    suggestionsPanel.appendChild(title);

    suggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 0.75rem; background: var(--bg-dark); border-radius: 6px; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s;';
        item.innerHTML = `
            <div style="font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;">${suggestion.prompt.substring(0, 60)}...</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">Viewed ${suggestion.viewCount || 0} times</div>
        `;

        item.addEventListener('mouseenter', () => {
            item.style.background = 'var(--bg-hover)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.background = 'var(--bg-dark)';
        });

        item.addEventListener('click', () => {
            window.location.href = `library.html?prompt=${suggestion.id}`;
        });

        suggestionsPanel.appendChild(item);
    });

    const inputArea = document.querySelector('.input-area');
    inputArea.style.position = 'relative';
    inputArea.insertBefore(suggestionsPanel, inputArea.firstChild);
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

function showLibraryPrompt() {
    const prompt = document.createElement('div');
    prompt.style.cssText = `
        position: fixed;
        bottom: 6rem;
        right: 2rem;
        background: var(--card-bg);
        border: 1px solid var(--primary-blue);
        border-radius: 10px;
        padding: 1rem 1.5rem;
        box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        z-index: 10000;
        max-width: 300px;
    `;

    prompt.innerHTML = `
        <div style="font-weight: 600;">View in Library?</div>
        <div style="font-size: 0.875rem; color: var(--text-secondary);">Your conversation has been saved. View it in the library?</div>
        <div style="display: flex; gap: 0.5rem;">
            <button onclick="window.location.href='library.html'" style="flex: 1; padding: 0.5rem; background: var(--primary-blue); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Go to Library
            </button>
            <button onclick="this.closest('div').remove()" style="padding: 0.5rem; background: transparent; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer;">
                Later
            </button>
        </div>
    `;

    document.body.appendChild(prompt);

    // Auto remove after 10 seconds
    setTimeout(() => {
        prompt.remove();
    }, 10000);
}

// ====== INITIALIZATION ======

document.addEventListener('DOMContentLoaded', () => {
    // Update saved prompts list on load
    updateSavedPromptsInSidebar();

    // Listen for save events
    window.addEventListener('promptSaved', () => {
        updateSavedPromptsInSidebar();
    });

    // Add input listener for AI suggestions
    const userInput = document.getElementById('userInput');
    if (userInput) {
        let suggestionTimeout;
        userInput.addEventListener('input', () => {
            clearTimeout(suggestionTimeout);
            suggestionTimeout = setTimeout(() => {
                showAISuggestions();
            }, 1000); // Show suggestions after 1 second of typing
        });
    }
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

console.log('💾 Chat Save Integration initialized');
