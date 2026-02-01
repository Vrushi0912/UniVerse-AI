/**
 * Modern Dialog System - UniVerse AI
 * Handles dynamic creation and management of application dialogs.
 */

const DialogSystem = (() => {
    // 1. Dialog Definitions
    const dialogMessages = {
        // --- Critical Actions ---
        delete_general: {
            title: "Are you sure?",
            message: "This item will be permanently deleted and cannot be recovered.",
            primary: "Yes, Delete",
            secondary: "Cancel",
            type: "danger",
            icon: "⚠️"
        },
        delete_all: {
            title: "Delete all items?",
            message: "You are about to delete ALL saved items. This action cannot be undone.",
            primary: "Delete All",
            secondary: "Cancel",
            type: "danger",
            icon: "🔥"
        },
        delete_post: {
            title: "Delete this post?",
            message: "This post will be removed permanently. This action cannot be undone.",
            primary: "Delete Post",
            secondary: "Keep It",
            type: "danger",
            icon: "🗑️"
        },
        delete_file: {
            title: "Remove file?",
            message: "You are about to remove this file. Do you want to continue?",
            primary: "Remove",
            secondary: "Cancel",
            type: "danger",
            icon: "📂"
        },
        logout: {
            title: "Signing out?",
            message: "You are about to log out of your account. We'll miss you!",
            primary: "Log Out",
            secondary: "Stay Logged In",
            icon: "👋"
        },
        exit_unsaved: {
            title: "Leave without saving?",
            message: "You have unsaved changes that will be lost if you leave now.",
            primary: "Leave Page",
            secondary: "Stay & Save",
            type: "warning",
            icon: "💾"
        },

        // --- Success States ---
        form_success: {
            title: "Success!",
            message: "Your information has been submitted successfully. We'll be in touch soon.",
            primary: "Done",
            icon: "✅"
        },
        save_success: {
            title: "Changes Saved",
            message: "Your changes have been successfully saved.",
            primary: "Continue",
            icon: "💾"
        },
        conversation_saved: {
            title: "Saved to Library!",
            message: "Your conversation has been saved. Would you like to view it now?",
            primary: "View Library",
            secondary: "Stay Here",
            icon: "📚"
        },
        upload_success: {
            title: "Upload Complete",
            message: "Your file has been uploaded successfully.",
            primary: "Done",
            secondary: "View File",
            icon: "📤"
        },
        payment_success: {
            title: "Payment Successful!",
            message: "Thank you for your purchase. A confirmation email is on its way.",
            primary: "Continue",
            secondary: "View Receipt",
            icon: "🎉"
        },
        newsletter_success: {
            title: "You're Subscribed!",
            message: "Thanks for joining! Look out for our latest updates in your inbox.",
            primary: "Great!",
            icon: "📬"
        },

        // --- Error/Warning States ---
        form_failed: {
            title: "Something went wrong",
            message: "We couldn't submit your form. Please check your connection and try again.",
            primary: "Try Again",
            secondary: "Close",
            type: "warning",
            icon: "❌"
        },
        no_internet: {
            title: "Connection Lost",
            message: "It looks like you're offline. Please check your internet connection.",
            primary: "Retry",
            secondary: "Dismiss",
            type: "warning",
            icon: "🌐"
        },
        server_error: {
            title: "We hit a snag",
            message: "Our servers are having a little trouble right now. Please try again in a few minutes.",
            primary: "Refresh Page",
            secondary: "Go Home",
            type: "danger",
            icon: "🔧"
        },
        not_found: {
            title: "Page Not Found",
            message: "We couldn't find the page you're looking for. It might have been moved or deleted.",
            primary: "Go Home",
            secondary: "Go Back",
            icon: "🔍"
        },
        unauthorized: {
            title: "Access Denied",
            message: "You don't have permission to view this page. Please log in or contact support.",
            primary: "Log In",
            secondary: "Go Back",
            type: "warning",
            icon: "🔒"
        },
        permission_req: {
            title: "Permission Needed",
            message: "We need access to your device features to provide the best experience.",
            primary: "Allow Access",
            secondary: "Not Now",
            icon: "⚙️"
        },
        invalid_input: {
            title: "Check your info",
            message: "Some fields look incorrect or are missing. Please review and try again.",
            primary: "OK, I'll Fix It",
            type: "warning",
            icon: "✏️"
        },
        upload_failed: {
            title: "Upload Failed",
            message: "We couldn't upload your file. Please check the file size and type, then try again.",
            primary: "Try Again",
            secondary: "Cancel",
            type: "warning",
            icon: "⚠️"
        },
        payment_failed: {
            title: "Payment Declined",
            message: "We couldn't process your payment. Please check your details or try a different card.",
            primary: "Try Again",
            secondary: "Cancel",
            type: "danger",
            icon: "💳"
        },
        newsletter_failed: {
            title: "Subscription Failed",
            message: "We couldn't sign you up right now. Please try again later.",
            primary: "Try Again",
            secondary: "Close",
            icon: "⚠️"
        },

        // --- Interactive ---
        save_confirm: {
            title: "Save changes?",
            message: "Do you want to save the changes you made?",
            primary: "Save Changes",
            secondary: "Discard",
            icon: "💾"
        },
        unsaved_warning: {
            title: "Unsaved changes",
            message: "You made changes that haven't been saved yet.",
            primary: "Save & Continue",
            secondary: "Discard Changes",
            type: "warning",
            icon: "⚠️"
        },

        // --- Loading ---
        loading: {
            title: "Just a moment",
            message: "We're getting everything ready for you.",
            primary: null, // No buttons for loading
            icon: "⏳"
        }
    };

    // 2. Initialization & DOM Setup
    let overlay = null;
    let dialogContainer = null;
    let primaryBtn = null;
    let secondaryBtn = null;
    let currentCallbacks = {};

    function init() {
        if (document.getElementById('dialog-overlay')) return; // Already exists

        // Create HTML structure
        const overlayEl = document.createElement('div');
        overlayEl.id = 'dialog-overlay';
        overlayEl.className = 'custom-dialog-overlay';

        overlayEl.innerHTML = `
            <div class="custom-dialog" role="dialog" aria-modal="true">
                <div class="custom-dialog-icon" id="dialog-icon"></div>
                <h3 id="dialog-title"></h3>
                <p id="dialog-message"></p>
                <div class="custom-dialog-actions">
                    <button id="dialog-secondary" class="custom-dialog-btn secondary"></button>
                    <button id="dialog-primary" class="custom-dialog-btn primary"></button>
                </div>
            </div>
        `;

        document.body.appendChild(overlayEl);

        // Cache references
        overlay = overlayEl;
        dialogContainer = overlayEl.querySelector('.custom-dialog');
        primaryBtn = overlayEl.querySelector('#dialog-primary');
        secondaryBtn = overlayEl.querySelector('#dialog-secondary');
        const titleEl = overlayEl.querySelector('#dialog-title');
        const messageEl = overlayEl.querySelector('#dialog-message');
        const iconEl = overlayEl.querySelector('#dialog-icon');

        // Event Listeners
        primaryBtn.addEventListener('click', () => {
            hide();
            if (currentCallbacks.onConfirm) currentCallbacks.onConfirm();
        });

        secondaryBtn.addEventListener('click', () => {
            hide();
            if (currentCallbacks.onCancel) currentCallbacks.onCancel();
        });

        // Close on backdrop click (optional, maybe not for critical actions)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // Determine if we should allow closing by clicking outside
                // For now, let's treat it as 'cancel'
                hide();
                if (currentCallbacks.onCancel) currentCallbacks.onCancel();
            }
        });
    }

    // 3. Public Methods
    function show(key, onConfirm, onCancel) {
        if (!overlay) init();

        const config = dialogMessages[key];
        if (!config) {
            console.warn(`Dialog type "${key}" not found.`);
            return;
        }

        // Setup Content
        const titleEl = overlay.querySelector('#dialog-title');
        const messageEl = overlay.querySelector('#dialog-message');
        const iconEl = overlay.querySelector('#dialog-icon');

        titleEl.textContent = config.title;
        messageEl.textContent = config.message;
        iconEl.textContent = config.icon || '';

        // Setup Buttons
        if (config.primary) {
            primaryBtn.textContent = config.primary;
            primaryBtn.style.display = 'inline-block';
        } else {
            primaryBtn.style.display = 'none';
        }

        if (config.secondary) {
            secondaryBtn.textContent = config.secondary;
            secondaryBtn.style.display = 'inline-block';
        } else {
            secondaryBtn.style.display = 'none';
        }

        // Setup Styling Classes
        dialogContainer.className = 'custom-dialog'; // Reset
        if (config.type) {
            dialogContainer.classList.add(config.type);
        }

        // Store callbacks
        currentCallbacks = { onConfirm, onCancel };

        // Show
        overlay.classList.add('active');
    }

    function hide() {
        if (overlay) overlay.classList.remove('active');
        currentCallbacks = {};
    }

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        show,
        hide
    };
})();

// Example Usage Global Helper
// window.DialogSystem.show('delete_post', () => console.log('Deleted!'));
