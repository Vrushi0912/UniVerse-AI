/*========================================
  DYNAMIC LIVE STATES JAVASCRIPT
  About Page Interactive States
  ========================================*/

(function () {
    'use strict';

    /* ============================================
       PAGE LOADING STATE
       ============================================ */

    function initPageLoading() {
        // Create loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'page-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading UniVerse AI...</div>
        `;
        document.body.insertBefore(loadingOverlay, document.body.firstChild);

        // Remove loading overlay when page is ready
        window.addEventListener('load', function () {
            setTimeout(() => {
                loadingOverlay.classList.add('loaded');
                setTimeout(() => loadingOverlay.remove(), 500);
            }, 800);
        });
    }

    /* ============================================
       SCROLL PROGRESS BAR
       ============================================ */

    function initScrollProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress-bar';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', function () {
            const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = (window.pageYOffset / windowHeight) * 100;
            progressBar.style.width = scrolled + '%';
        });
    }

    /* ============================================
       ACTIVE VIEWPORT TRACKING
       ============================================ */

    function initViewportTracking() {
        const cards = document.querySelectorAll('.feature-card');

        const viewportObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Remove from all cards
                    cards.forEach(card => card.classList.remove('in-viewport'));
                    // Add to current card
                    entry.target.classList.add('in-viewport');
                }
            });
        }, {
            threshold: 0.5
        });

        cards.forEach(card => viewportObserver.observe(card));
    }

    /* ============================================
       NAV ACTIVE STATE DOT
       ============================================ */

    function initNavActiveDot() {
        const navLinks = document.querySelectorAll('.nav-menu a');

        navLinks.forEach(link => {
            if (link.classList.contains('active')) {
                link.setAttribute('data-tooltip', 'Current Page');
            }
        });
    }

    /* ============================================
       CARD CLICK STATE
       ============================================ */

    function initCardClickState() {
        const cards = document.querySelectorAll('.feature-card');

        cards.forEach(card => {
            card.addEventListener('click', function () {
                // Remove active from all
                cards.forEach(c => c.classList.remove('active'));
                // Add to clicked card
                this.classList.add('active');

                // Remove after 2 seconds
                setTimeout(() => {
                    this.classList.remove('active');
                }, 2000);
            });
        });
    }

    /* ============================================
       NOTIFICATION SYSTEM
       ============================================ */

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /* ============================================
       WELCOME NOTIFICATION
       ============================================ */

    function showWelcomeNotification() {
        setTimeout(() => {
            showNotification('✨ Welcome to UniVerse AI About Page!', 'success');
        }, 1500);
    }

    /* ============================================
       LOGO INTERACTION
       ============================================ */

    function enhanceLogoInteraction() {
        const logo = document.querySelector('.logo');

        if (logo) {
            logo.style.cursor = 'pointer';
            logo.setAttribute('data-tooltip', 'UniVerse AI Home');

            logo.addEventListener('click', function (e) {
                e.preventDefault();
                showNotification('🌌 Navigating to home...', 'info');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            });
        }
    }

    /* ============================================
       SMOOTH HASH NAVIGATION
       ============================================ */

    function initHashNavigation() {
        if (window.location.hash) {
            const target = document.querySelector(window.location.hash);
            if (target) {
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth' });
                    target.classList.add('active');
                    setTimeout(() => target.classList.remove('active'), 2000);
                }, 1000);
            }
        }
    }

    /* ============================================
       SECTION HEADINGS - ADD STATUS INDICATORS
       ============================================ */

    function enhanceSectionHeadings() {
        const headings = document.querySelectorAll('.feature-card h2');

        headings.forEach((heading, index) => {
            // Add status indicator to first heading
            if (index === 0) {
                const indicator = document.createElement('span');
                indicator.className = 'status-indicator';
                indicator.setAttribute('data-tooltip', 'Live Section');
                heading.insertBefore(indicator, heading.firstChild);
            }
        });
    }

    /* ============================================
       INTERACTIVE TOOLTIPS
       ============================================ */

    function addTooltips() {
        // Add tooltips to nav links
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            const text = link.textContent.trim();
            if (!link.hasAttribute('data-tooltip')) {
                link.setAttribute('data-tooltip', `Go to ${text}`);
            }
        });

        // Add tooltip to logo icon
        const logoIcon = document.querySelector('.logo-icon');
        if (logoIcon) {
            logoIcon.setAttribute('data-tooltip', 'AI Universe');
        }
    }

    /* ============================================
       CARD LOADING SIMULATION (Demo)
       ============================================ */

    function simulateCardLoading() {
        const cards = document.querySelectorAll('.feature-card');

        // Add click listener to simulate loading
        cards.forEach((card, index) => {
            const heading = card.querySelector('h2, h3');
            if (heading && index === 0) {
                heading.style.cursor = 'pointer';
                heading.setAttribute('data-tooltip', 'Click to refresh');

                heading.addEventListener('click', function (e) {
                    e.stopPropagation();
                    card.classList.add('loading');

                    setTimeout(() => {
                        card.classList.remove('loading');
                        showNotification('✓ Content refreshed', 'success');
                    }, 1500);
                });
            }
        });
    }

    /* ============================================
       TECHNOLOGY STACK - HOVER STATES
       ============================================ */

    function enhanceTechStack() {
        const techItems = document.querySelectorAll('.feature-card .features-grid > div');

        techItems.forEach(item => {
            item.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });

            item.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    /* ============================================
       FOOTER - ADD NEW BADGE
       ============================================ */

    function enhanceFooter() {
        const footer = document.querySelector('.footer');
        const footerText = footer.querySelector('p');

        if (footerText) {
            // Add "Live" badge
            const badge = document.createElement('span');
            badge.className = 'new-badge';
            badge.textContent = 'Live';
            badge.style.marginLeft = '1rem';
            footerText.appendChild(badge);
        }
    }

    /* ============================================
       PERFORMANCE MONITORING
       ============================================ */

    function monitorPerformance() {
        window.addEventListener('load', function () {
            const perfData = performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

            console.log('%c✨ Page Performance', 'color: #06b6d4; font-weight: bold; font-size: 14px');
            console.log(`⚡ Load Time: ${pageLoadTime}ms`);
            console.log(`🎯 DOM Ready: ${perfData.domContentLoadedEventEnd - perfData.navigationStart}ms`);

            // Show notification if page loaded fast
            if (pageLoadTime < 2000) {
                setTimeout(() => {
                    showNotification('⚡ Fast load detected!', 'success');
                }, 2000);
            }
        });
    }

    /* ============================================
       SCROLL DIRECTION DETECTION
       ============================================ */

    function detectScrollDirection() {
        let lastScrollTop = 0;
        const navbar = document.querySelector('.navbar');

        window.addEventListener('scroll', function () {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > lastScrollTop) {
                // Scrolling down
                navbar.style.transform = 'translateY(0)';
            } else {
                // Scrolling up
                navbar.style.transform = 'translateY(0)';
            }

            lastScrollTop = scrollTop;
        }, false);
    }

    /* ============================================
       LIST ITEMS - ADD LIVE INDICATORS
       ============================================ */

    function enhanceListItems() {
        const lists = document.querySelectorAll('.feature-card ul');

        lists.forEach(list => {
            const items = list.querySelectorAll('li');

            // Add interactive state to first 2 items
            items.forEach((item, index) => {
                if (index < 2) {
                    item.style.cursor = 'pointer';
                    item.setAttribute('data-tooltip', 'Click to expand');

                    item.addEventListener('click', function () {
                        this.style.color = '#06b6d4';
                        this.style.transform = 'translateX(10px)';

                        setTimeout(() => {
                            this.style.color = '';
                            this.style.transform = 'translateX(0)';
                        }, 500);
                    });
                }
            });
        });
    }

    /* ============================================
       INITIALIZE ALL DYNAMIC STATES
       ============================================ */

    function init() {
        console.log('%c🌌 UniVerse AI - About Page', 'color: #06b6d4; font-weight: bold; font-size: 16px');
        console.log('%cInitializing dynamic live states...', 'color: #60a5fa');

        // Core states
        initPageLoading();
        initScrollProgress();
        initViewportTracking();
        initNavActiveDot();

        // Interactive states
        initCardClickState();
        showWelcomeNotification();
        enhanceLogoInteraction();
        initHashNavigation();

        // Enhanced features
        enhanceSectionHeadings();
        addTooltips();
        simulateCardLoading();
        enhanceTechStack();
        enhanceFooter();
        enhanceListItems();

        // Advanced features
        monitorPerformance();
        detectScrollDirection();

        console.log('%c✨ All dynamic states loaded!', 'color: #10b981; font-weight: bold');
    }

    /* ============================================
       AUTO-INITIALIZE
       ============================================ */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose notification function globally
    window.showNotification = showNotification;

})();
