/**
 * PWA Service Worker Registration
 * Enables offline functionality and app-like experience
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// Install prompt
let deferredPrompt;
const installButton = document.createElement('button');
installButton.id = 'installPWA';
installButton.className = 'install-pwa-btn hidden';
installButton.innerHTML = '📱 Install App';

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.classList.remove('hidden');
});

installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
        console.log('✅ PWA installed');
    }

    deferredPrompt = null;
    installButton.classList.add('hidden');
});

// Add install button to page
document.body.appendChild(installButton);

// PWA styles
const pwaStyles = document.createElement('style');
pwaStyles.textContent = `
    .install-pwa-btn {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-purple) 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 50px;
        cursor: pointer;
        font-weight: 600;
        box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
        z-index: 1000;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .install-pwa-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 30px rgba(124, 58, 237, 0.6);
    }

    .install-pwa-btn.hidden {
        display: none;
    }
`;

document.head.appendChild(pwaStyles);
