// ====== LIBRARY APPLICATION ======
// Handles UI interactions for the library page

// State
let currentPrompts = [];
let filteredPrompts = [];
let showFavoritesOnly = false;
let currentDetailId = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    loadLibrary();
    setupEventListeners();
    setupStorageListeners();

    // Check for URL parameter to open specific prompt
    const urlParams = new URLSearchParams(window.location.search);
    const promptId = urlParams.get('prompt');
    if (promptId) {
        setTimeout(() => {
            openDetailModal(promptId);
        }, 100);
    }
});

// ====== INITIALIZATION ======

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            applyFilters();
        }, 300); // Debounce search
    });

    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', () => {
        applyFilters();
    });

    // Sort select
    document.getElementById('sortSelect').addEventListener('change', () => {
        applyFilters();
    });

    // Close modal on outside click
    document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') {
            closeDetailModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close modal
        if (e.key === 'Escape') {
            closeDetailModal();
        }
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }
    });
}

function setupStorageListeners() {
    // Listen for prompt save events
    window.addEventListener('promptSaved', (e) => {
        loadLibrary();
        showToast('Prompt saved successfully!', 'success');
    });

    window.addEventListener('promptUpdated', (e) => {
        loadLibrary();
    });

    window.addEventListener('promptDeleted', (e) => {
        loadLibrary();
        showToast('Prompt deleted', 'success');
    });

    window.addEventListener('promptsCleared', (e) => {
        loadLibrary();
        showToast('All prompts cleared', 'success');
    });
}

// ====== LOAD LIBRARY ======

function loadLibrary() {
    // Load from localStorage - using the key from save-prompt-system.js
    const libraryData = localStorage.getItem('universe_saved_prompts');
    currentPrompts = libraryData ? JSON.parse(libraryData) : [];

    console.log('📚 Library loaded:', currentPrompts.length, 'prompts');
    console.log('Raw library data:', libraryData);
    if (currentPrompts.length > 0) {
        console.log('First prompt:', currentPrompts[0]);
    }
    updateStatistics();
    applyFilters();
}

function updateStatistics() {
    const total = currentPrompts.length;
    const favorites = currentPrompts.filter(p => p.favorite).length;
    const totalViews = currentPrompts.reduce((sum, p) => sum + (p.viewCount || 0), 0);

    document.getElementById('totalCount').textContent = total;
    document.getElementById('favCount').textContent = favorites;
    document.getElementById('viewCount').textContent = totalViews;
}

// ====== FILTERING & SORTING ======

function applyFilters() {
    const searchQuery = document.getElementById('searchInput').value.trim();
    const category = document.getElementById('categoryFilter').value;
    const sortValue = document.getElementById('sortSelect').value;

    // Start with all prompts
    let prompts = [...currentPrompts];

    // Apply search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        prompts = prompts.filter(p =>
            (p.prompt || '').toLowerCase().includes(query) ||
            (p.response || '').toLowerCase().includes(query) ||
            (p.tags || []).some(tag => tag.toLowerCase().includes(query))
        );
    }

    // Apply category filter
    if (category !== 'all') {
        prompts = prompts.filter(p => p.category === category);
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
        prompts = prompts.filter(p => p.favorite);
    }

    // Apply sorting
    const [sortBy, order] = sortValue.split('-');
    prompts.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') {
            comparison = (a.savedAt || 0) - (b.savedAt || 0);
        } else if (sortBy === 'views') {
            comparison = (a.viewCount || 0) - (b.viewCount || 0);
        } else if (sortBy === 'alphabetical') {
            comparison = (a.prompt || '').localeCompare(b.prompt || '');
        }
        return order === 'desc' ? -comparison : comparison;
    });

    filteredPrompts = prompts;
    renderLibrary();
}

function toggleFavoritesOnly() {
    showFavoritesOnly = !showFavoritesOnly;
    const btn = document.getElementById('favBtn');

    if (showFavoritesOnly) {
        btn.style.background = 'var(--primary-color)';
        btn.style.color = 'white';
    } else {
        btn.style.background = 'var(--bg-card)';
        btn.style.color = 'var(--text-primary)';
    }

    applyFilters();
}

// ====== RENDERING ======

function renderLibrary() {
    const grid = document.getElementById('libraryGrid');
    const emptyState = document.getElementById('emptyState');

    if (filteredPrompts.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';

        if (currentPrompts.length > 0) {
            // Has prompts but filtered out
            emptyState.querySelector('h2').textContent = 'No Results Found';
            emptyState.querySelector('p').textContent = 'Try adjusting your search or filters';
            emptyState.querySelector('.btn').style.display = 'none';
        } else {
            // Actually empty
            emptyState.querySelector('h2').textContent = 'No Saved Prompts Yet';
            emptyState.querySelector('p').textContent = 'Start saving your favorite AI conversations from the chat page!';
            emptyState.querySelector('.btn').style.display = 'inline-flex';
        }
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = '';

    filteredPrompts.forEach(prompt => {
        const card = createPromptCard(prompt);
        grid.appendChild(card);
    });
}

function createPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.onclick = () => openDetailModal(prompt.id);

    // Format date
    const date = new Date(prompt.savedAt);
    const timeAgo = getTimeAgo(date);

    // Truncate response for preview
    const responseText = prompt.response || '';
    const responsePreview = responseText.substring(0, 150) + (responseText.length > 150 ? '...' : '');
    const promptText = prompt.prompt || 'Untitled';
    const tags = prompt.tags || [];

    card.innerHTML = `
        <div class="card-header">
            <span class="card-category">${prompt.category || 'general'}</span>
            <button class="favorite-btn ${prompt.favorite ? 'active' : ''}" onclick="toggleFavorite(event, '${prompt.id}')">
                ${prompt.favorite ? '⭐' : '☆'}
            </button>
        </div>
        <div class="card-prompt">${escapeHtml(promptText)}</div>
        <div class="card-response">${escapeHtml(responsePreview)}</div>
        <div class="card-tags">
            ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="card-footer">
            <div class="card-meta">
                <div class="meta-item">
                    <span>📅</span>
                    <span>${timeAgo}</span>
                </div>
                <div class="meta-item">
                    <span>👁️</span>
                    <span>${prompt.viewCount || 0}</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="icon-btn" onclick="copyPrompt(event, '${prompt.id}')" title="Copy">
                    📋
                </button>
                <button class="icon-btn" onclick="exportPrompt(event, '${prompt.id}')" title="Export">
                    📥
                </button>
                <button class="icon-btn" onclick="deletePrompt(event, '${prompt.id}')" title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    `;

    return card;
}

// ====== DETAIL MODAL ======

function openDetailModal(promptId) {
    const prompt = currentPrompts.find(p => p.id === promptId);
    if (!prompt) return;

    currentDetailId = promptId;

    // Increment view count
    prompt.views = (prompt.views || 0) + 1;
    localStorage.setItem('universe_library', JSON.stringify(currentPrompts));

    // Populate modal
    document.getElementById('detailPrompt').textContent = prompt.userPrompt;

    // Render response with markdown
    const responseHtml = marked.parse(prompt.aiResponse);
    document.getElementById('detailResponse').innerHTML = responseHtml;

    // Apply syntax highlighting to code blocks
    document.querySelectorAll('#detailResponse pre code').forEach((block) => {
        hljs.highlightElement(block);
    });

    // Prepare metadata
    const date = new Date(prompt.timestamp);
    const modelUsed = document.getElementById('modelSelect')?.value || 'Unknown';

    // Show modal
    const modal = document.getElementById('detailModal');
    const metaSection = modal.querySelector('.detail-meta');
    if (metaSection) {
        metaSection.innerHTML = `
            <p><strong>Category:</strong> ${prompt.category}</p>
            <p><strong>Saved:</strong> ${date.toLocaleString()}</p>
            <p><strong>Views:</strong> ${prompt.views || 0}</p>
        `;
    }

    modal.classList.add('active');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
    currentDetailId = null;
    loadLibrary(); // Refresh to update view counts
}

// ====== ACTIONS ======

function toggleFavorite(event, promptId) {
    event.stopPropagation();
    const prompt = currentPrompts.find(p => p.id === promptId);

    if (prompt) {
        prompt.favorite = !prompt.favorite;
        localStorage.setItem('universe_saved_prompts', JSON.stringify(currentPrompts));
        loadLibrary();
        showToast(prompt.favorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    }
}

function copyPrompt(event, promptId) {
    event.stopPropagation();
    const prompt = currentPrompts.find(p => p.id === promptId);
    if (!prompt) return;

    const text = `Prompt: ${prompt.prompt}\n\nResponse: ${prompt.response}`;
    copyToClipboard(text);
}

function exportPrompt(event, promptId) {
    event.stopPropagation();
    const prompt = currentPrompts.find(p => p.id === promptId);
    if (!prompt) return;

    const data = {
        prompt: prompt.prompt,
        response: prompt.response,
        category: prompt.category,
        tags: prompt.tags,
        savedAt: new Date(prompt.savedAt).toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt_${promptId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Prompt exported', 'success');
}

function deletePrompt(event, promptId) {
    event.stopPropagation();

    if (confirm('Are you sure you want to delete this saved prompt?')) {
        currentPrompts = currentPrompts.filter(p => p.id !== promptId);
        localStorage.setItem('universe_saved_prompts', JSON.stringify(currentPrompts));
        loadLibrary();
    }
}

// ====== DETAIL MODAL ACTIONS ======

function copyDetailResponse() {
    const prompt = currentPrompts.find(p => p.id === currentDetailId);
    if (!prompt) return;

    copyToClipboard(prompt.response);
}

function exportDetailPrompt() {
    if (!currentDetailId) return;
    exportPrompt(new Event('click'), currentDetailId);
}

function deleteDetailPrompt() {
    if (!currentDetailId) return;

    if (confirm('Are you sure you want to delete this saved prompt?')) {
        currentPrompts = currentPrompts.filter(p => p.id !== currentDetailId);
        localStorage.setItem('universe_saved_prompts', JSON.stringify(currentPrompts));
        closeDetailModal();
    }
}

// ====== BULK ACTIONS ======

function exportAll() {
    if (currentPrompts.length === 0) {
        showToast('No prompts to export', 'warning');
        return;
    }

    const json = JSON.stringify(currentPrompts, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `universe_ai_prompts_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast(`Exported ${currentPrompts.length} prompts`, 'success');
}

function clearAllPrompts() {
    if (currentPrompts.length === 0) {
        showToast('No prompts to clear', 'warning');
        return;
    }

    if (confirm(`Are you sure you want to delete all ${currentPrompts.length} saved prompts? This cannot be undone.`)) {
        localStorage.removeItem('universe_saved_prompts');
        loadLibrary();
        showToast('All prompts cleared', 'success');
    }
}

// ====== UTILITY FUNCTIONS ======

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy', 'error');
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
}

function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '⚠';
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('📚 Library App initialized');
