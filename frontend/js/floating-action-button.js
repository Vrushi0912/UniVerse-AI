/**
 * Floating Action Button (FAB) Menu
 * Quick access to key features from any page
 */

class FloatingActionButton {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createFAB();
        this.attachEventListeners();
    }

    createFAB() {
        const fab = document.createElement('div');
        fab.className = 'fab-container';

        // Check if we're on chat page
        const isoChatPage = window.location.pathname.includes('chat.html');

        fab.innerHTML = `
            <div class="fab-menu hidden" id="fabMenu">
                ${isChatPage ? `
                <button class="fab-action" onclick="showAnalytics()" title="Analytics Dashboard">
                    <span class="fab-icon">📊</span>
                    <span class="fab-label">Analytics</span>
                </button>
                ` : ''}
                <button class="fab-action" onclick="commandPalette.open()" title="Command Palette">
                    <span class="fab-icon">⌨️</span>
                    <span class="fab-label">Commands</span>
                </button>
                <button class="fab-action" onclick="window.ThemeManager?.toggleTheme()" title="Toggle Theme">
                    <span class="fab-icon">🌓</span>
                    <span class="fab-label">Theme</span>
                </button>
                <button class="fab-action" onclick="window.location.href='chat.html'" title="Go to Chat">
                    <span class="fab-icon">💬</span>
                    <span class="fab-label">Chat</span>
                </button>
            </div>
            <button class="fab-main" id="fabMain" title="Quick Actions">
                <svg class="fab-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        `;
        document.body.appendChild(fab);
    }

    attachEventListeners() {
        const fabMain = document.getElementById('fabMain');
        const fabMenu = document.getElementById('fabMenu');

        if (fabMain) {
            fabMain.addEventListener('click', () => this.toggle());
        }

        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fab-container') && this.isOpen) {
                this.close();
            }
        });

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        const fabMain = document.getElementById('fabMain');
        const fabMenu = document.getElementById('fabMenu');

        if (fabMain && fabMenu) {
            fabMain.classList.add('active');
            fabMenu.classList.remove('hidden');
            this.isOpen = true;
        }
    }

    close() {
        const fabMain = document.getElementById('fabMain');
        const fabMenu = document.getElementById('fabMenu');

        if (fabMain && fabMenu) {
            fabMain.classList.remove('active');
            fabMenu.classList.add('hidden');
            this.isOpen = false;
        }
    }
}

// CSS Styles
const fabStyles = document.createElement('style');
fabStyles.textContent = `
    .fab-container {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 12px;
    }

    .fab-main {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-purple) 100%);
        border: none;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        position: relative;
        z-index: 10;
    }

    .fab-main:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 30px rgba(124, 58, 237, 0.7);
    }

    .fab-main.active {
        transform: rotate(45deg);
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }

    .fab-icon-svg {
        width: 24px;
        height: 24px;
        color: white;
        transition: transform 0.3s ease;
    }

    .fab-menu {
        display: flex;
        flex-direction: column;
        gap: 10px;
        opacity: 1;
        transform: translateY(0);
        transition: all 0.3s ease;
    }

    .fab-menu.hidden {
        opacity: 0;
        transform: translateY(20px);
        pointer-events: none;
    }

    .fab-action {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        white-space: nowrap;
        animation: fabSlideIn 0.3s ease backwards;
    }

    .fab-action:nth-child(1) { animation-delay: 0.05s; }
    .fab-action:nth-child(2) { animation-delay: 0.1s; }
    .fab-action:nth-child(3) { animation-delay: 0.15s; }
    .fab-action:nth-child(4) { animation-delay: 0.2s; }

    .fab-action:hover {
        transform: translateX(-8px);
        box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
        background: var(--bg-secondary);
    }

    .fab-icon {
        font-size: 20px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .fab-label {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-primary);
    }

    @keyframes fabSlideIn {
        from {
            opacity: 0;
            transform: translateX(30px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
        .fab-container {
            bottom: 20px;
            right: 20px;
        }

        .fab-main {
            width: 48px;
            height: 48px;
        }

        .fab-action {
            padding: 10px 16px;
            font-size: 0.85rem;
        }

        .fab-icon {
            font-size: 18px;
        }
    }

    /* Hide on chat page to avoid interference */
    body.chat-page .fab-container {
        display: none;
    }
`;

document.head.appendChild(fabStyles);

// Initialize FAB
const fab = new FloatingActionButton();
window.fab = fab;
