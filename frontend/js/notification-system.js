/**
 * Enhanced Notification System
 * Beautiful toast notifications with multiple types and animations
 */

class NotificationSystem {
    constructor() {
        this.container = this.createContainer();
        this.notifications = [];
    }

    createContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 3000, options = {}) {
        const notification = this.createNotification(message, type, options);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(notification), duration);
        }

        return notification;
    }

    createNotification(message, type, options) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = this.getIcon(type);
        const hasAction = options.action && options.actionLabel;

        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">
                ${options.title ? `<div class="notification-title">${options.title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            ${hasAction ? `<button class="notification-action">${options.actionLabel}</button>` : ''}
            <button class="notification-close">✕</button>
        `;

        // Event listeners
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.dismiss(notification));

        if (hasAction) {
            const actionBtn = notification.querySelector('.notification-action');
            actionBtn.addEventListener('click', () => {
                options.action();
                this.dismiss(notification);
            });
        }

        return notification;
    }

    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️',
            loading: '⏳'
        };
        return icons[type] || icons.info;
    }

    dismiss(notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 300);
    }

    success(message, options = {}) {
        return this.show(message, 'success', 3000, options);
    }

    error(message, options = {}) {
        return this.show(message, 'error', 4000, options);
    }

    warning(message, options = {}) {
        return this.show(message, 'warning', 3500, options);
    }

    info(message, options = {}) {
        return this.show(message, 'info', 3000, options);
    }

    loading(message, options = {}) {
        return this.show(message, 'loading', 0, options);
    }

    clearAll() {
        this.notifications.forEach(notification => this.dismiss(notification));
    }
}

// CSS Styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
    }

    .notification {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 16px;
        min-width: 320px;
        max-width: 420px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        pointer-events: all;
        backdrop-filter: blur(10px);
    }

    .notification.show {
        opacity: 1;
        transform: translateX(0);
    }

    .notification.hide {
        opacity: 0;
        transform: translateX(400px);
    }

    .notification-icon {
        font-size: 24px;
        flex-shrink: 0;
    }

    .notification-content {
        flex: 1;
        min-width: 0;
    }

    .notification-title {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text-primary);
        margin-bottom: 4px;
    }

    .notification-message {
        font-size: 0.85rem;
        color: var(--text-secondary);
        word-wrap: break-word;
    }

    .notification-action {
        background: var(--primary-blue);
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .notification-action:hover {
        background: var(--primary-purple);
        transform: scale(1.05);
    }

    .notification-close {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        flex-shrink: 0;
    }

    .notification-close:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
    }

    /* Type-specific styles */
    .notification-success {
        border-left: 4px solid #10b981;
    }

    .notification-error {
        border-left: 4px solid #ef4444;
    }

    .notification-warning {
        border-left: 4px solid #f59e0b;
    }

    .notification-info {
        border-left: 4px solid #3b82f6;
    }

    .notification-loading {
        border-left: 4px solid #8b5cf6;
    }

    .notification-loading .notification-icon {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
        .notification-container {
            right: 10px;
            left: 10px;
            top: 10px;
        }

        .notification {
            min-width: 0;
            max-width: 100%;
        }
    }
`;

document.head.appendChild(notificationStyles);

// Initialize and export
const notify = new NotificationSystem();
window.notify = notify;

// Helper functions
window.showSuccess = (message, options) => notify.success(message, options);
window.showError = (message, options) => notify.error(message, options);
window.showWarning = (message, options) => notify.warning(message, options);
window.showInfo = (message, options) => notify.info(message, options);
window.showLoading = (message, options) => notify.loading(message, options);
