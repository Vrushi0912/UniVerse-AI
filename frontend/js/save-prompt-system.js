// ====== SAVE PROMPT SYSTEM MODULE ======
// Handles saving, retrieving, and managing prompt-response pairs

class SavePromptSystem {
    constructor() {
        this.storageKey = 'universe_saved_prompts';
        this.suggestionKey = 'universe_prompt_suggestions';
        this.init();
    }

    init() {
        // Ensure storage is initialized
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.suggestionKey)) {
            localStorage.setItem(this.suggestionKey, JSON.stringify({}));
        }
    }

    /**
     * Generate unique ID for saved prompt
     */
    generateId() {
        return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Save a prompt-response pair
     * @param {string} prompt - The user's prompt
     * @param {string} response - The AI's response
     * @param {object} metadata - Additional metadata (model, timestamp, etc.)
     * @returns {object} The saved entry with ID
     */
    savePrompt(prompt, response, metadata = {}) {
        const savedPrompts = this.getAllPrompts();

        // Check for duplicates
        const existingPrompt = savedPrompts.find(p =>
            p.prompt.trim().toLowerCase() === prompt.trim().toLowerCase()
        );

        if (existingPrompt) {
            console.log('Duplicate prompt detected, updating existing entry');
            return this.updatePrompt(existingPrompt.id, { response, ...metadata });
        }

        const entry = {
            id: this.generateId(),
            prompt: prompt.trim(),
            response: response.trim(),
            savedAt: Date.now(),
            model: metadata.model || 'unknown',
            tags: this.extractTags(prompt),
            category: this.categorizePrompt(prompt),
            favorite: false,
            viewCount: 0,
            ...metadata
        };

        savedPrompts.unshift(entry); // Add to beginning
        localStorage.setItem(this.storageKey, JSON.stringify(savedPrompts));

        // Update suggestion index
        this.updateSuggestionIndex(entry);

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('promptSaved', { detail: entry }));

        return entry;
    }

    /**
     * Update an existing prompt entry
     */
    updatePrompt(id, updates) {
        const savedPrompts = this.getAllPrompts();
        const index = savedPrompts.findIndex(p => p.id === id);

        if (index === -1) return null;

        savedPrompts[index] = {
            ...savedPrompts[index],
            ...updates,
            updatedAt: Date.now()
        };

        localStorage.setItem(this.storageKey, JSON.stringify(savedPrompts));
        window.dispatchEvent(new CustomEvent('promptUpdated', { detail: savedPrompts[index] }));

        return savedPrompts[index];
    }

    /**
     * Get all saved prompts
     */
    getAllPrompts() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch (e) {
            console.error('Error loading saved prompts:', e);
            return [];
        }
    }

    /**
     * Get a specific prompt by ID
     */
    getPromptById(id) {
        const prompts = this.getAllPrompts();
        return prompts.find(p => p.id === id);
    }

    /**
     * Delete a prompt
     */
    deletePrompt(id) {
        let savedPrompts = this.getAllPrompts();
        savedPrompts = savedPrompts.filter(p => p.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(savedPrompts));
        window.dispatchEvent(new CustomEvent('promptDeleted', { detail: { id } }));
        return true;
    }

    /**
     * Toggle favorite status
     */
    toggleFavorite(id) {
        const savedPrompts = this.getAllPrompts();
        const index = savedPrompts.findIndex(p => p.id === id);

        if (index === -1) return null;

        savedPrompts[index].favorite = !savedPrompts[index].favorite;
        localStorage.setItem(this.storageKey, JSON.stringify(savedPrompts));

        return savedPrompts[index];
    }

    /**
     * Increment view count
     */
    incrementViewCount(id) {
        const savedPrompts = this.getAllPrompts();
        const index = savedPrompts.findIndex(p => p.id === id);

        if (index === -1) return;

        savedPrompts[index].viewCount = (savedPrompts[index].viewCount || 0) + 1;
        localStorage.setItem(this.storageKey, JSON.stringify(savedPrompts));
    }

    /**
     * Search prompts by keyword
     */
    searchPrompts(query) {
        if (!query || query.trim() === '') {
            return this.getAllPrompts();
        }

        const lowerQuery = query.toLowerCase().trim();
        const prompts = this.getAllPrompts();

        return prompts.filter(p =>
            p.prompt.toLowerCase().includes(lowerQuery) ||
            p.response.toLowerCase().includes(lowerQuery) ||
            p.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
            p.category.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * Filter prompts by criteria
     */
    filterPrompts(criteria) {
        let prompts = this.getAllPrompts();

        // Filter by category
        if (criteria.category && criteria.category !== 'all') {
            prompts = prompts.filter(p => p.category === criteria.category);
        }

        // Filter favorites
        if (criteria.favorites) {
            prompts = prompts.filter(p => p.favorite);
        }

        // Filter by date range
        if (criteria.dateFrom) {
            prompts = prompts.filter(p => p.savedAt >= criteria.dateFrom);
        }
        if (criteria.dateTo) {
            prompts = prompts.filter(p => p.savedAt <= criteria.dateTo);
        }

        // Filter by tags
        if (criteria.tags && criteria.tags.length > 0) {
            prompts = prompts.filter(p =>
                criteria.tags.some(tag => p.tags.includes(tag))
            );
        }

        return prompts;
    }

    /**
     * Sort prompts
     */
    sortPrompts(prompts, sortBy = 'date', order = 'desc') {
        const sorted = [...prompts];

        switch (sortBy) {
            case 'date':
                sorted.sort((a, b) => order === 'desc' ? b.savedAt - a.savedAt : a.savedAt - b.savedAt);
                break;
            case 'views':
                sorted.sort((a, b) => order === 'desc' ? b.viewCount - a.viewCount : a.viewCount - b.viewCount);
                break;
            case 'alphabetical':
                sorted.sort((a, b) => {
                    const aPrompt = a.prompt.toLowerCase();
                    const bPrompt = b.prompt.toLowerCase();
                    return order === 'desc' ? bPrompt.localeCompare(aPrompt) : aPrompt.localeCompare(bPrompt);
                });
                break;
        }

        return sorted;
    }

    /**
     * Extract tags from prompt
     */
    extractTags(prompt) {
        const tags = [];
        const keywords = {
            code: ['code', 'program', 'function', 'algorithm', 'debug', 'script', 'python', 'javascript', 'java', 'c++'],
            explain: ['explain', 'what is', 'how does', 'tell me about', 'understand'],
            create: ['create', 'generate', 'make', 'build', 'design', 'write'],
            learning: ['learn', 'tutorial', 'teach', 'lesson', 'study', 'course'],
            math: ['calculate', 'solve', 'equation', 'math', 'formula', 'compute']
        };

        const lowerPrompt = prompt.toLowerCase();

        for (const [tag, words] of Object.entries(keywords)) {
            if (words.some(word => lowerPrompt.includes(word))) {
                tags.push(tag);
            }
        }

        return tags.length > 0 ? tags : ['general'];
    }

    /**
     * Categorize prompt automatically
     */
    categorizePrompt(prompt) {
        const lowerPrompt = prompt.toLowerCase();

        if (/code|program|function|script|debug|python|javascript|java|c\+\+/.test(lowerPrompt)) {
            return 'programming';
        }
        if (/explain|what is|how does|understand|tell me/.test(lowerPrompt)) {
            return 'explanation';
        }
        if (/calculate|solve|equation|math|formula/.test(lowerPrompt)) {
            return 'math';
        }
        if (/create|generate|write|compose|make/.test(lowerPrompt)) {
            return 'creative';
        }
        if (/learn|tutorial|teach|study|course/.test(lowerPrompt)) {
            return 'learning';
        }

        return 'general';
    }

    /**
     * Get statistics
     */
    getStatistics() {
        const prompts = this.getAllPrompts();

        const categories = {};
        prompts.forEach(p => {
            categories[p.category] = (categories[p.category] || 0) + 1;
        });

        return {
            total: prompts.length,
            favorites: prompts.filter(p => p.favorite).length,
            categories: categories,
            totalViews: prompts.reduce((sum, p) => sum + (p.viewCount || 0), 0),
            mostViewed: prompts.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))[0] || null
        };
    }

    /**
     * Update suggestion index for AI-powered suggestions
     */
    updateSuggestionIndex(entry) {
        const suggestions = JSON.parse(localStorage.getItem(this.suggestionKey) || '{}');

        // Create simple keyword index
        const words = entry.prompt.toLowerCase().split(/\s+/);
        words.forEach(word => {
            if (word.length > 3) { // Only index words longer than 3 chars
                if (!suggestions[word]) {
                    suggestions[word] = [];
                }
                if (!suggestions[word].includes(entry.id)) {
                    suggestions[word].push(entry.id);
                }
            }
        });

        localStorage.setItem(this.suggestionKey, JSON.stringify(suggestions));
    }

    /**
     * Get suggestions based on current prompt
     */
    getSuggestions(currentPrompt, limit = 5) {
        const suggestions = JSON.parse(localStorage.getItem(this.suggestionKey) || '{}');
        const words = currentPrompt.toLowerCase().split(/\s+/);
        const promptIds = new Set();

        // Find prompts with matching keywords
        words.forEach(word => {
            if (word.length > 3 && suggestions[word]) {
                suggestions[word].forEach(id => promptIds.add(id));
            }
        });

        // Get full prompt objects
        const prompts = this.getAllPrompts();
        const matchedPrompts = Array.from(promptIds)
            .map(id => prompts.find(p => p.id === id))
            .filter(p => p !== undefined);

        // Sort by view count and return top results
        return matchedPrompts
            .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            .slice(0, limit);
    }

    /**
     * Export all prompts as JSON
     */
    exportToJSON() {
        const prompts = this.getAllPrompts();
        const data = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            prompts: prompts
        };

        return JSON.stringify(data, null, 2);
    }

    /**
     * Import prompts from JSON
     */
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const currentPrompts = this.getAllPrompts();

            // Merge prompts, avoiding duplicates
            data.prompts.forEach(newPrompt => {
                const exists = currentPrompts.some(p => p.id === newPrompt.id);
                if (!exists) {
                    currentPrompts.push(newPrompt);
                }
            });

            localStorage.setItem(this.storageKey, JSON.stringify(currentPrompts));
            return { success: true, imported: data.prompts.length };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    /**
     * Clear all saved prompts
     */
    clearAll() {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
        localStorage.setItem(this.suggestionKey, JSON.stringify({}));
        window.dispatchEvent(new CustomEvent('promptsCleared'));
        return true;
    }
}

// Disable legacy local storage system
// window.SavePromptSystem = new SavePromptSystem();

// console.log('✅ Save Prompt System initialized');
console.log('⚠️ Legacy SavePromptSystem disabled (using Backend API instead)');
