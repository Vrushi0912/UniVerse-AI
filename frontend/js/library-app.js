// ====== LIBRARY APPLICATION ======
// Handles UI interactions for the library page - Backend API version
const API_BASE_URL = 'http://localhost:8000';

// State
let currentPrompts = [];
let filteredPrompts = [];
let showFavoritesOnly = false;
let currentDetailId = null;
let isLoading = false;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    loadLibrary();
    setupEventListeners();

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

    // Stats cards interaction
    document.getElementById('totalCountCard').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = 'all';
        showFavoritesOnly = false;
        updateFavoriteButtonState();
        applyFilters();
    });

    document.getElementById('favCountCard').addEventListener('click', () => {
        if (!showFavoritesOnly) {
            toggleFavoritesOnly();
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

function updateFavoriteButtonState() {
    const btn = document.getElementById('favBtn');
    const icon = btn.querySelector('svg');
    if (showFavoritesOnly) {
        btn.classList.add('active');
        if (icon) icon.style.fill = 'currentColor';
    } else {
        btn.classList.remove('active');
        if (icon) icon.style.fill = 'none';
    }
}

// ====== LOAD LIBRARY ======

async function loadLibrary() {
    if (isLoading) return;

    isLoading = true;
    showLoadingState();

    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        if (!token) {
            showError('Please log in to view your saved prompts');
            currentPrompts = [];
            hideLoadingState();
            updateStatistics();
            applyFilters();
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/library/prompts`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                showError('Session expired. Please log in again.');
            } else {
                showError('Failed to load prompts');
            }
            currentPrompts = [];
        } else {
            const data = await response.json();
            currentPrompts = data.prompts || [];
            console.log('📚 Library loaded:', currentPrompts.length, 'prompts');
        }
    } catch (error) {
        console.error('Error loading library:', error);
        showError('Network error. Please check your connection.');
        currentPrompts = [];
    } finally {
        isLoading = false;
        hideLoadingState();
        updateStatistics();
        applyFilters();
    }
}

function updateStatistics() {
    const total = currentPrompts.length;
    const favorites = currentPrompts.filter(p => p.is_favorite).length;
    const totalViews = currentPrompts.reduce((sum, p) => sum + (p.usage_count || 0), 0);

    // Update Hero Stats
    const totalCountEl = document.getElementById('totalCount');
    if (totalCountEl) totalCountEl.textContent = total;

    const favCountEl = document.getElementById('favCount');
    if (favCountEl) favCountEl.textContent = favorites;

    const viewCountEl = document.getElementById('viewCount');
    if (viewCountEl) viewCountEl.textContent = totalViews;

    // Update Header Badge
    const headerBadge = document.getElementById('totalCountHeader');
    if (headerBadge) headerBadge.textContent = `${total} Saved`;
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
            (p.title || '').toLowerCase().includes(query) ||
            (p.content || '').toLowerCase().includes(query) ||
            (p.description || '').toLowerCase().includes(query) ||
            (p.tags || []).some(tag => tag.toLowerCase().includes(query))
        );
    }

    // Apply category filter
    if (category !== 'all') {
        prompts = prompts.filter(p => p.category === category);
    }

    // Apply favorites filter
    if (showFavoritesOnly) {
        prompts = prompts.filter(p => p.is_favorite);
    }

    // Apply sorting
    const [sortBy, order] = sortValue.split('-');
    prompts.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'date') {
            comparison = new Date(a.created_at) - new Date(b.created_at);
        } else if (sortBy === 'views') {
            comparison = (a.usage_count || 0) - (b.usage_count || 0);
        } else if (sortBy === 'alphabetical') {
            comparison = (a.title || '').localeCompare(b.title || '');
        }
        return order === 'desc' ? -comparison : comparison;
    });

    filteredPrompts = prompts;
    renderLibrary();
}

function toggleFavoritesOnly() {
    showFavoritesOnly = !showFavoritesOnly;
    updateFavoriteButtonState();
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
            const btn = emptyState.querySelector('button');
            if (btn) btn.style.display = 'none';
        } else {
            // Actually empty
            emptyState.querySelector('h2').textContent = 'No Saved Prompts Yet';
            emptyState.querySelector('p').textContent = 'Start saving your favorite AI conversations from the chat page to build your personal knowledge library.';
            const btn = emptyState.querySelector('button');
            if (btn) btn.style.display = 'inline-flex';
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
    card.className = 'prompt-card-modern';
    card.onclick = () => openDetailModal(prompt._id);

    // Format date
    const date = new Date(prompt.created_at);
    const timeAgo = getTimeAgo(date);

    // Truncate content for preview
    const contentText = prompt.content || '';
    const contentPreview = contentText.substring(0, 150) + (contentText.length > 150 ? '...' : '');
    const titleText = prompt.title || 'Untitled';

    // Category style
    const category = prompt.category || 'general';
    const tagClass = `tag-${category.toLowerCase()}`;

    card.innerHTML = `
        <div class="card-header">
            <span class="category-tag ${tagClass}">${category}</span>
            <div class="fav-icon ${prompt.is_favorite ? 'active' : ''}" onclick="toggleFavorite(event, '${prompt._id}')">
                <svg viewBox="0 0 24 24" fill="${prompt.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="20" height="20">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            </div>
        </div>
        
        <h3 class="card-title">${escapeHtml(titleText)}</h3>
        <p class="card-preview">${escapeHtml(contentPreview)}</p>
        
        <div class="card-footer">
            <div class="card-stats">
                <div class="card-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>${timeAgo}</span>
                </div>
                <div class="card-stat">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span>${prompt.usage_count || 0}</span>
                </div>
            </div>
            
            <div class="footer-actions">
                <button class="card-action-btn" onclick="exportPrompt(event, '${prompt._id}')" title="Export">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </button>
                <button class="card-action-btn delete-btn" onclick="deletePrompt(event, '${prompt._id}')" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;

    return card;
}

// ====== DETAIL MODAL ======

async function openDetailModal(promptId) {
    const prompt = currentPrompts.find(p => p._id === promptId);
    if (!prompt) return;

    currentDetailId = promptId;

    // Increment view count on backend
    await incrementViewCount(promptId);

    // Populate modal
    document.getElementById('detailPrompt').textContent = prompt.title || 'Untitled';

    // Render content with markdown
    const contentHtml = marked.parse(prompt.content || '');
    document.getElementById('detailResponse').innerHTML = contentHtml;

    // Apply syntax highlighting to code blocks
    document.querySelectorAll('#detailResponse pre code').forEach((block) => {
        hljs.highlightElement(block);
    });

    // Prepare metadata
    const date = new Date(prompt.created_at);

    // Show modal
    const modal = document.getElementById('detailModal');
    const metaSection = modal.querySelector('.detail-meta');
    if (metaSection) {
        metaSection.innerHTML = `
            <p><strong>Category:</strong> ${prompt.category || 'general'}</p>
            <p><strong>Saved:</strong> ${date.toLocaleString()}</p>
            <p><strong>Views:</strong> ${prompt.usage_count || 0}</p>
            ${prompt.description ? `<p><strong>Description:</strong> ${prompt.description}</p>` : ''}
        `;
    }

    modal.classList.add('active');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
    currentDetailId = null;
}

async function incrementViewCount(promptId) {
    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');
        if (!token) return;

        await fetch(`${API_BASE_URL}/api/library/prompts/${promptId}/view`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Update local state
        const prompt = currentPrompts.find(p => p._id === promptId);
        if (prompt) {
            prompt.usage_count = (prompt.usage_count || 0) + 1;
        }
    } catch (error) {
        console.error('Failed to increment view count:', error);
    }
}

// ====== ACTIONS ======

async function toggleFavorite(event, promptId) {
    event.stopPropagation();
    const prompt = currentPrompts.find(p => p._id === promptId);
    if (!prompt) return;

    const newFavoriteState = !prompt.is_favorite;

    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');
        if (!token) {
            showError('Please log in to update favorites');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/library/prompts/${promptId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                is_favorite: newFavoriteState
            })
        });

        if (!response.ok) {
            showError('Failed to update favorite status');
            return;
        }

        // Update local state
        prompt.is_favorite = newFavoriteState;
        applyFilters();
        showToast(newFavoriteState ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showError('Network error');
    }
}

function copyPrompt(event, promptId) {
    event.stopPropagation();
    const prompt = currentPrompts.find(p => p._id === promptId);
    if (!prompt) return;

    const text = `${prompt.title}\n\n${prompt.content}`;
    copyToClipboard(text);
}

function exportPrompt(event, promptId) {
    event.stopPropagation();
    const prompt = currentPrompts.find(p => p._id === promptId);
    if (!prompt) return;

    const data = {
        title: prompt.title,
        content: prompt.content,
        description: prompt.description,
        category: prompt.category,
        tags: prompt.tags,
        savedAt: new Date(prompt.created_at).toISOString()
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

async function deletePrompt(event, promptId) {
    if (event) event.stopPropagation();

    DialogSystem.show('delete_general', async () => {
        try {
            const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');
            if (!token) {
                showError('Please log in to delete prompts');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/library/prompts/${promptId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                showError('Failed to delete prompt');
                return;
            }

            // Remove from local state
            currentPrompts = currentPrompts.filter(p => p._id !== promptId);
            updateStatistics();
            applyFilters();
            showToast('Prompt deleted', 'success');
        } catch (error) {
            console.error('Error deleting prompt:', error);
            showError('Network error');
        }
    });
}

// ====== DETAIL MODAL ACTIONS ======

function copyDetailResponse() {
    const prompt = currentPrompts.find(p => p._id === currentDetailId);
    if (!prompt) return;

    copyToClipboard(prompt.content);
}

function exportDetailPrompt() {
    if (!currentDetailId) return;
    exportPrompt(new Event('click'), currentDetailId);
}

async function deleteDetailPrompt() {
    if (!currentDetailId) return;

    await deletePrompt(new Event('click'), currentDetailId);
    closeDetailModal();
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

async function clearAllPrompts() {
    if (currentPrompts.length === 0) {
        showToast('No prompts to clear', 'warning');
        return;
    }

    if (!confirm(`Are you sure you want to delete all ${currentPrompts.length} saved prompts? This cannot be undone.`)) {
        return;
    }

    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');
        if (!token) {
            showError('Please log in to delete prompts');
            return;
        }

        // Delete all prompts one by one
        const deletePromises = currentPrompts.map(prompt =>
            fetch(`${API_BASE_URL}/api/library/prompts/${prompt._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
        );

        await Promise.all(deletePromises);

        currentPrompts = [];
        updateStatistics();
        applyFilters();
        showToast('All prompts cleared', 'success');
    } catch (error) {
        console.error('Error clearing prompts:', error);
        showError('Failed to clear all prompts');
    }
}

// ====== UI STATE FUNCTIONS ======

function showLoadingState() {
    const grid = document.getElementById('libraryGrid');
    const emptyState = document.getElementById('emptyState');

    grid.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
            <p style="color: var(--text-secondary);">Loading your saved prompts...</p>
        </div>
    `;

    // Add spinner animation if not already present
    if (!document.getElementById('spinner-style')) {
        const style = document.createElement('style');
        style.id = 'spinner-style';
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

function hideLoadingState() {
    const emptyState = document.getElementById('emptyState');
    if (!emptyState) return;

    emptyState.innerHTML = `
        <div class="empty-icon-glow">📭</div>
        <h2>No Saved Prompts Yet</h2>
        <p>Start saving your favorite AI conversations from the chat page to build your personal knowledge library.</p>
        <button class="modern-cta-btn" 
                style="background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 12px 32px; border-radius: 12px; border: none; font-weight: 600; cursor: pointer; margin-top: 1.5rem;"
                onclick="window.location.href='chat.html'">
            Go to Chat
        </button>
    `;
    // Ensure display is correct in case it was hidden
    emptyState.style.display = 'flex';
}

function showError(message) {
    showToast(message, 'error');
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
    // The backend sends UTC timestamps in ISO format
    // JavaScript's new Date() correctly parses ISO strings to local time equivalent
    // We compare timestamps (which are timezone-agnostic) for accuracy
    const now = new Date();
    const timestamp = typeof date === 'string' ? new Date(date) : date;

    // Calculate difference in milliseconds
    // Both dates are now JavaScript Date objects which internally store UTC timestamps
    const diff = now - timestamp;
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

console.log('📚 Library App initialized (Backend API version)');
