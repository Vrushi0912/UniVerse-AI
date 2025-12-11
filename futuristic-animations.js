/*========================================
  FUTURISTIC AI ANIMATIONS FOR UNIVERSE AI
  Premium Next-Gen Interactive Enhancements
  ========================================*/

(function () {
    'use strict';

    /* ============================================
       ANIMATED PARTICLE BACKGROUND
       ============================================ */

    function createParticleBackground() {
        // Check if already exists
        if (document.querySelector('.ai-particles-bg')) return;

        const particleBg = document.createElement('div');
        particleBg.className = 'ai-particles-bg';
        document.body.appendChild(particleBg);

        const particleCount = window.innerWidth > 768 ? 50 : 20;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'ai-particle';

            // Random positioning
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';

            // Random animation delay and duration
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';

            // Random movement direction (CSS variables)
            particle.style.setProperty('--tx', (Math.random() * 200 - 100) + 'px');
            particle.style.setProperty('--ty', (Math.random() * 200 - 100) + 'px');

            // Random size
            const size = Math.random() * 3 + 1;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';

            particleBg.appendChild(particle);
        }
    }

    /* ============================================
       RIPPLE CLICK EFFECT
       ============================================ */

    function createRipple(e) {
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();

        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';

        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /* ============================================
       ENHANCED HOVER GLOW EFFECTS
       ============================================ */

    function enhanceFeatureCards() {
        const featureItems = document.querySelectorAll('.feature-item');

        featureItems.forEach(item => {
            item.addEventListener('mouseenter', function (e) {
                this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });

            item.addEventListener('mousemove', function (e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;

                const rotateX = deltaY * 5;
                const rotateY = -deltaX * 5;

                this.style.transform = `translateY(-8px) scale(1.02) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });

            item.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0) scale(1) perspective(1000px) rotateX(0deg) rotateY(0deg)';
            });
        });
    }

    /* ============================================
       PROMPT CARDS INTERACTIVE HOVER
       ============================================ */

    function enhancePromptCards() {
        const promptCards = document.querySelectorAll('.prompt-card');

        promptCards.forEach(card => {
            card.addEventListener('mousemove', function (e) {
                const rect = this.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;

                const rotateX = deltaY * 3;
                const rotateY = -deltaX * 3;

                this.style.transform = `translateY(-4px) scale(1.02) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });

            card.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0) scale(1) perspective(1000px) rotateX(0deg) rotateY(0deg)';
            });
        });
    }

    /* ============================================
       WELCOME TITLE DATA ATTRIBUTE
       ============================================ */

    function enhanceWelcomeTitle() {
        const welcomeTitle = document.querySelector('.welcome-content h1');
        if (welcomeTitle) {
            welcomeTitle.setAttribute('data-text', welcomeTitle.textContent);
        }
    }

    /* ============================================
       DYNAMIC SIDEBAR GLOW ON SCROLL
       ============================================ */

    function addSidebarScrollGlow() {
        const sidebar = document.querySelector('.sidebar');
        const historySection = document.querySelector('.history-section');

        if (historySection) {
            historySection.addEventListener('scroll', function () {
                const scrollPercentage = (this.scrollTop / (this.scrollHeight - this.clientHeight)) * 100;

                const glowIntensity = Math.min(scrollPercentage / 100, 0.3);

                if (sidebar) {
                    sidebar.style.boxShadow = `4px 0 ${30 + scrollPercentage}px rgba(37, 99, 235, ${glowIntensity})`;
                }
            });
        }
    }

    /* ============================================
       SEND BUTTON PULSE ON TEXT INPUT
       ============================================ */

    function addSendButtonReaction() {
        const textInput = document.getElementById('userInput');
        const sendBtn = document.getElementById('sendBtn');

        if (textInput && sendBtn) {
            textInput.addEventListener('input', function () {
                if (this.value.trim().length > 0) {
                    sendBtn.style.animation = 'neonPulse 2s ease-in-out infinite';
                } else {
                    sendBtn.style.animation = '';
                }
            });
        }
    }

    /* ============================================
       TYPING INDICATOR WITH DOTS
       ============================================ */

    function createTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            .typing-indicator {
                display: flex;
                gap: 0.5rem;
                padding: 1rem;
                justify-content: center;
            }
            .typing-dot {
                width: 8px;
                height: 8px;
                background: linear-gradient(135deg, #3b82f6, #60a5fa);
                border-radius: 50%;
                animation: typingDotBounce 1.4s infinite ease-in-out;
                box-shadow: 0 0 10px rgba(96, 165, 250, 0.6);
            }
            .typing-dot:nth-child(1) {
                animation-delay: -0.32s;
            }
            .typing-dot:nth-child(2) {
                animation-delay: -0.16s;
            }
            @keyframes typingDotBounce {
                0%, 80%, 100% {
                    transform: scale(0);
                    opacity: 0.5;
                }
                40% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
        `;

        if (!document.querySelector('style[data-typing-indicator]')) {
            style.setAttribute('data-typing-indicator', 'true');
            document.head.appendChild(style);
        }

        return indicator;
    }

    /* ============================================
       SMOOTH SCROLL TO BOTTOM ENHANCEMENT
       ============================================ */

    function enhanceSmoothScroll() {
        const chatContainer = document.getElementById('chatContainer');

        if (chatContainer) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length > 0) {
                        chatContainer.scrollTo({
                            top: chatContainer.scrollHeight,
                            behavior: 'smooth'
                        });
                    }
                });
            });

            observer.observe(chatContainer, {
                childList: true,
                subtree: true
            });
        }
    }

    /* ============================================
       NAVIGATION ACTIVE STATE MANAGEMENT
       ============================================ */

    function manageNavActiveState() {
        const navButtons = document.querySelectorAll('.nav-btn');

        navButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                navButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }

    /* ============================================
       INPUT AREA FOCUS ANIMATION
       ============================================ */

    function enhanceInputFocusAnimation() {
        const textarea = document.querySelector('.input-container textarea');
        const inputContainer = document.querySelector('.input-container');

        if (textarea && inputContainer) {
            let focusTimeout;

            textarea.addEventListener('focus', function () {
                clearTimeout(focusTimeout);
                inputContainer.classList.add('focused');

                // Add subtle shake effect
                inputContainer.style.animation = 'none';
                setTimeout(() => {
                    inputContainer.style.animation = 'inputFocusPulse 0.5s ease';
                }, 10);
            });

            textarea.addEventListener('blur', function () {
                focusTimeout = setTimeout(() => {
                    inputContainer.classList.remove('focused');
                }, 200);
            });

            // Add CSS animation
            const style = document.createElement('style');
            style.textContent = `
                @keyframes inputFocusPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.005); }
                    100% { transform: scale(1); }
                }
            `;
            if (!document.querySelector('style[data-input-focus]')) {
                style.setAttribute('data-input-focus', 'true');
                document.head.appendChild(style);
            }
        }
    }

    /* ============================================
       ATTACH RIPPLE TO ALL BUTTONS
       ============================================ */

    function attachRippleToButtons() {
        const buttons = document.querySelectorAll(
            '.new-chat-btn, .nav-btn, .send-btn, .header-btn, ' +
            '.voice-btn, .attachment-btn, .photo-btn, .prompt-card, ' +
            '.feature-item, .history-item'
        );

        buttons.forEach(btn => {
            btn.addEventListener('click', createRipple);
        });
    }

    /* ============================================
       LOGO ICON INTERACTION
       ============================================ */

    function enhanceLogoInteraction() {
        const logoIcon = document.querySelector('.logo-icon');

        if (logoIcon) {
            logoIcon.addEventListener('mouseenter', function () {
                this.style.transform = 'scale(1.2) rotate(360deg)';
                this.style.transition = 'transform 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            });

            logoIcon.addEventListener('mouseleave', function () {
                this.style.transform = 'scale(1) rotate(0deg)';
            });

            logoIcon.addEventListener('click', function () {
                this.style.animation = 'none';
                setTimeout(() => {
                    this.style.animation = 'logoGlow 3s ease-in-out infinite';
                }, 10);
            });
        }
    }

    /* ============================================
       INITIALIZE ALL ENHANCEMENTS
       ============================================ */

    function initializeEnhancements() {
        console.log('🌌 UniVerse AI: Initializing futuristic enhancements...');

        // Create particle background
        createParticleBackground();

        // Enhance UI elements
        enhanceFeatureCards();
        enhancePromptCards();
        enhanceWelcomeTitle();

        // Add interactive features
        addSidebarScrollGlow();
        addSendButtonReaction();
        enhanceSmoothScroll();
        manageNavActiveState();
        enhanceInputFocusAnimation();

        // Attach ripple effects
        attachRippleToButtons();

        // Logo interaction
        enhanceLogoInteraction();

        console.log('✨ UniVerse AI: Enhancements loaded successfully!');
    }

    /* ============================================
       AUTO-INITIALIZE ON DOM READY
       ============================================ */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEnhancements);
    } else {
        initializeEnhancements();
    }

    // Re-apply enhancements on dynamic content changes
    const observer = new MutationObserver((mutations) => {
        let shouldReInit = false;

        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && (
                        node.classList.contains('feature-item') ||
                        node.classList.contains('prompt-card') ||
                        node.classList.contains('history-item')
                    )) {
                        shouldReInit = true;
                    }
                });
            }
        });

        if (shouldReInit) {
            enhanceFeatureCards();
            enhancePromptCards();
            attachRippleToButtons();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Export typing indicator creator for external use
    window.createAITypingIndicator = createTypingIndicator;

})();
