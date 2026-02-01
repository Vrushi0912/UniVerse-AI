/**
 * Command Palette - Quick Actions Menu (Cmd+K / Ctrl+K)
 * Provides fast navigation and quick task execution
 */

class CommandPalette {
    constructor() {
        this.isOpen = false;
        this.commands = this.initializeCommands();
        this.filteredCommands = [...this.commands];
        this.selectedIndex = 0;
        this.init();
    }

    init() {
        this.createPalette();
        this.attachEventListeners();
    }

    initializeCommands() {
        return [
            // Navigation
            { id: 'nav-home', icon: '🏠', label: 'Go to Home', action: () => window.location.href = 'index.html', category: 'Navigation' },
            { id: 'nav-chat', icon: '💬', label: 'Go to Chat', action: () => window.location.href = 'chat.html', category: 'Navigation' },
            { id: 'nav-library', icon: '📚', label: 'Go to Library', action: () => window.location.href = 'library.html', category: 'Navigation' },
            { id: 'nav-about', icon: 'ℹ️', label: 'Go to About', action: () => window.location.href = 'about.html', category: 'Navigation' },
            { id: 'nav-docs', icon: '📖', label: 'Go to Documentation', action: () => window.location.href = 'docs.html', category: 'Navigation' },

            // Chat Actions
            { id: 'chat-new', icon: '➕', label: 'New Chat', action: () => this.executeIfExists('startNewChat'), category: 'Chat' },
            { id: 'chat-clear', icon: '🗑️', label: 'Clear Chat', action: () => this.executeIfExists('clearCurrentChat'), category: 'Chat' },
            { id: 'chat-save', icon: '💾', label: 'Save to Library', action: () => this.executeIfExists('saveChatToLibrary'), category: 'Chat' },
            { id: 'chat-export', icon: '📥', label: 'Export Chat', action: () => this.executeIfExists('exportChat'), category: 'Chat' },

            // Settings
            { id: 'settings-open', icon: '⚙️', label: 'Open Settings', action: () => this.executeIfExists('toggleSettings'), category: 'Settings' },
            { id: 'theme-toggle', icon: '🌓', label: 'Toggle Theme', action: () => window.ThemeManager?.toggleTheme(), category: 'Settings' },

            // AI Features
            { id: 'voice-toggle', icon: '🎙️', label: 'Toggle Voice Input', action: () => this.executeIfExists('toggleVoiceInput'), category: 'AI Features' },
            { id: 'teacher-mode', icon: '👨‍🏫', label: 'AI Teacher Mode', action: () => this.executeIfExists('openTeacher'), category: 'AI Features' },

            // Library Actions
            { id: 'library-search', icon: '🔍', label: 'Search Library', action: () => this.executeIfExists('searchLibrary'), category: 'Library' },
            { id: 'prompt-save', icon: '📝', label: 'Save Current Prompt', action: () => this.executeIfExists('saveCurrentPrompt'), category: 'Library' },

            // Help
            { id: 'help-shortcuts', icon: '⌨️', label: 'Keyboard Shortcuts', action: () => this.showShortcuts(), category: 'Help' },
            { id: 'help-docs', icon: '❓', label: 'View Documentation', action: () => window.location.href = 'docs.html', category: 'Help' },
        ];
    }

    createPalette() {
        const palette = document.createElement('div');
        palette.id = 'commandPalette';
        palette.className = 'command-palette hidden';
        palette.innerHTML = `
            <div class="command-palette-backdrop" onclick="commandPalette.close()"></div>
            <div class="command-palette-content">
                <div class="command-palette-header">
                    <input 
                        type="text" 
                        id="commandInput" 
                        placeholder="Type a command or search..."
                        autocomplete="off"
                        spellcheck="false"
                    />
                    <span class="command-palette-hint">Esc to close</span>
                </div>
                <div class="command-palette-body" id="commandList"></div>
            </div>
        `;
        document.body.appendChild(palette);
        this.renderCommands();
    }

    attachEventListeners() {
        // Keyboard shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Search input
        const input = document.getElementById('commandInput');
        if (input) {
            input.addEventListener('input', (e) => this.handleSearch(e.target.value));
            input.addEventListener('keydown', (e) => this.handleKeyNavigation(e));
        }
    }

    handleSearch(query) {
        const lowerQuery = query.toLowerCase();
        this.filteredCommands = this.commands.filter(cmd =>
            cmd.label.toLowerCase().includes(lowerQuery) ||
            cmd.category.toLowerCase().includes(lowerQuery)
        );
        this.selectedIndex = 0;
        this.renderCommands();
    }

    handleKeyNavigation(e) {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1);
                this.renderCommands();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
                this.renderCommands();
                break;
            case 'Enter':
                e.preventDefault();
                this.executeCommand(this.filteredCommands[this.selectedIndex]);
                break;
        }
    }

    renderCommands() {
        const list = document.getElementById('commandList');
        if (!list) return;

        if (this.filteredCommands.length === 0) {
            list.innerHTML = '<div class="command-empty">No commands found</div>';
            return;
        }

        // Group by category
        const grouped = {};
        this.filteredCommands.forEach(cmd => {
            if (!grouped[cmd.category]) grouped[cmd.category] = [];
            grouped[cmd.category].push(cmd);
        });

        let html = '';
        let globalIndex = 0;

        Object.entries(grouped).forEach(([category, cmds]) => {
            html += `<div class="command-category">${category}</div>`;
            cmds.forEach(cmd => {
                const isSelected = globalIndex === this.selectedIndex;
                html += `
                    <div class="command-item ${isSelected ? 'selected' : ''}" 
                         onclick="commandPalette.executeCommand(commandPalette.commands.find(c => c.id === '${cmd.id}'))"
                         data-index="${globalIndex}">
                        <span class="command-icon">${cmd.icon}</span>
                        <span class="command-label">${cmd.label}</span>
                    </div>
                `;
                globalIndex++;
            });
        });

        list.innerHTML = html;

        // Scroll to selected
        const selected = list.querySelector('.command-item.selected');
        if (selected) {
            selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    executeCommand(command) {
        if (!command) return;
        this.close();
        setTimeout(() => command.action(), 100);
    }

    executeIfExists(functionName) {
        if (typeof window[functionName] === 'function') {
            window[functionName]();
        }
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        const palette = document.getElementById('commandPalette');
        if (palette) {
            palette.classList.remove('hidden');
            this.isOpen = true;
            setTimeout(() => {
                document.getElementById('commandInput')?.focus();
            }, 100);
        }
    }

    close() {
        const palette = document.getElementById('commandPalette');
        if (palette) {
            palette.classList.add('hidden');
            this.isOpen = false;
            document.getElementById('commandInput').value = '';
            this.filteredCommands = [...this.commands];
            this.selectedIndex = 0;
        }
    }

    showShortcuts() {
        const shortcuts = `
            <h3>⌨️ Keyboard Shortcuts</h3>
            <ul style="list-style: none; padding: 0;">
                <li><kbd>Ctrl/Cmd + K</kbd> - Open Command Palette</li>
                <li><kbd>Esc</kbd> - Close dialogs</li>
                <li><kbd>Ctrl/Cmd + Enter</kbd> - Send message (in chat)</li>
                <li><kbd>Ctrl/Cmd + /</kbd> - Toggle sidebar</li>
            </ul>
        `;

        if (typeof DialogSystem !== 'undefined') {
            DialogSystem.show('info', shortcuts, 'Keyboard Shortcuts');
        } else {
            alert(shortcuts.replace(/<[^>]*>/g, '\n'));
        }
    }
}

// CSS Styles
const commandPaletteStyles = document.createElement('style');
commandPaletteStyles.textContent = `
    .command-palette {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
    }

    .command-palette.hidden {
        display: none;
    }

    .command-palette-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease;
    }

    .command-palette-content {
        position: relative;
        width: 90%;
        max-width: 600px;
        background: var(--card-bg);
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        animation: slideDown 0.3s ease;
        border: 1px solid var(--border-color);
    }

    .command-palette-header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    #commandInput {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 1rem;
        color: var(--text-primary);
        font-family: inherit;
    }

    #commandInput::placeholder {
        color: var(--text-secondary);
    }

    .command-palette-hint {
        font-size: 0.75rem;
        color: var(--text-secondary);
        padding: 0.25rem 0.5rem;
        background: var(--bg-secondary);
        border-radius: 4px;
    }

    .command-palette-body {
        max-height: 400px;
        overflow-y: auto;
        padding: 0.5rem 0;
    }

    .command-category {
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 0.5rem;
    }

    .command-category:first-child {
        margin-top: 0;
    }

    .command-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .command-item:hover,
    .command-item.selected {
        background: var(--bg-secondary);
    }

    .command-icon {
        font-size: 1.2rem;
        width: 24px;
        text-align: center;
    }

    .command-label {
        flex: 1;
        color: var(--text-primary);
        font-size: 0.9rem;
    }

    .command-empty {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
    }

    kbd {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 0.875rem;
        font-family: monospace;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

document.head.appendChild(commandPaletteStyles);

// Initialize command palette
const commandPalette = new CommandPalette();
window.commandPalette = commandPalette;
