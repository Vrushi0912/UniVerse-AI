/**
 * Theme Manager - Advanced Dark/Light Mode Toggle
 * Handles theme switching with smooth transitions and persistence
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemPreference();
        this.themeColors = {
            light: {
                '--bg-primary': '#ffffff',
                '--bg-secondary': '#f8f9fa',
                '--card-bg': '#ffffff',
                '--text-primary': '#1a1a1a',
                '--text-secondary': '#666666',
                '--border-color': '#e0e0e0',
                '--primary-blue': '#0066cc',
                '--primary-purple': '#7c3aed',
                '--accent-cyan': '#06b6d4',
                '--shadow-color': 'rgba(0, 0, 0, 0.1)'
            },
            dark: {
                '--bg-primary': '#0a0a0a',
                '--bg-secondary': '#141414',
                '--card-bg': '#1a1a1a',
                '--text-primary': '#ffffff',
                '--text-secondary': '#999999',
                '--border-color': '#2a2a2a',
                '--primary-blue': '#3b82f6',
                '--primary-purple': '#a78bfa',
                '--accent-cyan': '#22d3ee',
                '--shadow-color': 'rgba(0, 0, 0, 0.3)'
            }
        };
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        // this.createToggleButton(); // Disabled as per user request
        this.listenForSystemChanges();
    }

    getSystemPreference() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    getStoredTheme() {
        return localStorage.getItem('universe-theme');
    }

    applyTheme(theme) {
        const colors = this.themeColors[theme];
        const root = document.documentElement;

        // Add transition class
        root.classList.add('theme-transitioning');

        // Apply colors
        Object.entries(colors).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Update data attribute
        root.setAttribute('data-theme', theme);

        // Store preference
        localStorage.setItem('universe-theme', theme);
        this.currentTheme = theme;

        // Remove transition class after animation
        setTimeout(() => {
            root.classList.remove('theme-transitioning');
        }, 300);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.updateToggleButton();
    }

    createToggleButton() {
        // Check if button already exists
        if (document.getElementById('themeToggle')) return;

        const button = document.createElement('button');
        button.id = 'themeToggle';
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Toggle theme');
        button.setAttribute('title', 'Toggle dark/light mode');

        this.updateToggleButtonContent(button);

        button.addEventListener('click', () => this.toggleTheme());

        // Add to navbar or create floating button
        const navbar = document.querySelector('.navbar .nav-container');
        if (navbar) {
            navbar.appendChild(button);
        } else {
            document.body.appendChild(button);
        }
    }

    updateToggleButton() {
        const button = document.getElementById('themeToggle');
        if (button) {
            this.updateToggleButtonContent(button);
        }
    }

    updateToggleButtonContent(button) {
        const isDark = this.currentTheme === 'dark';
        button.innerHTML = `
            <svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${isDark ?
                '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' :
                '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
            }
            </svg>
        `;
    }

    listenForSystemChanges() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // Only auto-switch if user hasn't set preference
            if (!localStorage.getItem('universe-theme')) {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
}

// CSS styles for theme toggle
const themeStyles = document.createElement('style');
themeStyles.textContent = `
    :root {
        transition: none;
    }

    .theme-transitioning,
    .theme-transitioning * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
    }

    .theme-toggle-btn {
        position: relative;
        width: 40px;
        height: 40px;
        border: none;
        background: var(--card-bg);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);
        margin-left: auto;
    }

    .theme-toggle-btn:hover {
        background: var(--bg-secondary);
        transform: scale(1.1);
    }

    .theme-toggle-btn:active {
        transform: scale(0.95);
    }

    .theme-icon {
        width: 20px;
        height: 20px;
        color: var(--text-primary);
        transition: transform 0.3s ease;
    }

    .theme-toggle-btn:hover .theme-icon {
        transform: rotate(20deg);
    }

    /* Floating button for pages without navbar */
    body:not(:has(.navbar)) .theme-toggle-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        box-shadow: 0 4px 12px var(--shadow-color);
    }
`;

document.head.appendChild(themeStyles);

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other scripts
window.ThemeManager = themeManager;
