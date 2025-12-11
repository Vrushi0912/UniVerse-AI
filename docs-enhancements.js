/*========================================
  DOCUMENTATION PAGE INTERACTIVE JAVASCRIPT
  Scroll Animations, Progress Bar, Live States
  ========================================*/

(function () {
    'use strict';

    // ============================================
    // SCROLL PROGRESS BAR
    // ============================================
    function initScrollProgress() {
        // Create progress bar element
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress-bar';
        progressBar.style.width = '0%';
        document.body.appendChild(progressBar);

        // Update progress on scroll
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollProgress = (scrollTop / scrollHeight) * 100;
            progressBar.style.width = scrollProgress + '%';
        });
    }

    // ============================================
    // NAVBAR SCROLL STATE
    // ============================================
    function initNavbarScroll() {
        const navbar = document.querySelector('.navbar');

        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // ============================================
    // SCROLL REVEAL ANIMATION
    // ============================================
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.feature-card');

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal', 'active');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });
    }

    // ============================================
    // CARD IN-VIEWPORT HIGHLIGHT
    // ============================================
    function initCardViewport() {
        const cards = document.querySelectorAll('.feature-card');

        const viewportObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-viewport');
                } else {
                    entry.target.classList.remove('in-viewport');
                }
            });
        }, {
            threshold: 0.5
        });

        cards.forEach(card => {
            viewportObserver.observe(card);
        });
    }

    // ============================================
    // CARD CLICK ACTIVE STATE
    // ============================================
    function initCardClickState() {
        const cards = document.querySelectorAll('.feature-card');

        cards.forEach(card => {
            card.addEventListener('click', function () {
                // Remove active from all cards
                cards.forEach(c => c.classList.remove('active'));
                // Add active to clicked card
                this.classList.add('active');

                // Auto-remove after 2 seconds
                setTimeout(() => {
                    this.classList.remove('active');
                }, 2000);
            });
        });
    }

    // ============================================
    // SMOOTH SCROLL TO TOP
    // ============================================
    function initScrollToTop() {
        // Create scroll to top button
        const scrollBtn = document.createElement('button');
        scrollBtn.innerHTML = '↑';
        scrollBtn.className = 'scroll-to-top';
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #06b6d4, #3b82f6);
            border: none;
            border-radius: 50%;
            color: white;
            font-size: 24px;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(6, 182, 212, 0.4);
        `;

        document.body.appendChild(scrollBtn);

        // Show/hide button on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 500) {
                scrollBtn.style.opacity = '1';
                scrollBtn.style.visibility = 'visible';
            } else {
                scrollBtn.style.opacity = '0';
                scrollBtn.style.visibility = 'hidden';
            }
        });

        // Scroll to top on click
        scrollBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });

        // Hover effect
        scrollBtn.addEventListener('mouseenter', () => {
            scrollBtn.style.transform = 'translateY(-5px)';
            scrollBtn.style.boxShadow = '0 8px 30px rgba(6, 182, 212, 0.6)';
        });

        scrollBtn.addEventListener('mouseleave', () => {
            scrollBtn.style.transform = 'translateY(0)';
            scrollBtn.style.boxShadow = '0 4px 20px rgba(6, 182, 212, 0.4)';
        });
    }

    // ============================================
    // SECTION INDICATOR DOTS
    // ============================================
    function initSectionIndicator() {
        const cards = document.querySelectorAll('.feature-card');

        // Only create on desktop
        if (window.innerWidth > 768) {
            const indicator = document.createElement('div');
            indicator.className = 'section-indicator';
            document.body.appendChild(indicator);

            // Create dots for each section
            cards.forEach((card, index) => {
                const dot = document.createElement('div');
                dot.className = 'section-indicator-dot';
                dot.dataset.section = index;
                indicator.appendChild(dot);

                // Click to scroll to section
                dot.addEventListener('click', () => {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });

            // Update active dot on scroll
            const dotObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const index = Array.from(cards).indexOf(entry.target);
                        const dots = document.querySelectorAll('.section-indicator-dot');
                        dots.forEach(d => d.classList.remove('active'));
                        if (dots[index]) {
                            dots[index].classList.add('active');
                        }
                    }
                });
            }, {
                threshold: 0.5
            });

            cards.forEach(card => {
                dotObserver.observe(card);
            });
        }
    }

    // ============================================
    // ENHANCED LINK INTERACTIONS
    // ============================================
    function initLinkInteractions() {
        const links = document.querySelectorAll('a:not(.nav-menu a)');

        links.forEach(link => {
            link.addEventListener('mouseenter', function () {
                this.style.transition = 'all 0.3s';
            });
        });
    }

    // ============================================
    // KEYBOARD NAVIGATION ENHANCEMENT
    // ============================================
    function initKeyboardNav() {
        document.addEventListener('keydown', (e) => {
            // Alt + T: Scroll to top
            if (e.altKey && e.key === 't') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // Alt + B: Scroll to bottom
            if (e.altKey && e.key === 'b') {
                e.preventDefault();
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth'
                });
            }
        });
    }

    // ============================================
    // PERFORMANCE: REDUCE MOTION FOR ACCESSIBILITY
    // ============================================
    function respectMotionPreference() {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        if (prefersReducedMotion.matches) {
            // Disable animations
            document.documentElement.style.setProperty('--animation-duration', '0.01ms');
            const style = document.createElement('style');
            style.textContent = `
                * {
                    animation-duration: 0.01ms !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ============================================
    // INITIALIZE ALL FEATURES
    // ============================================
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeAll);
        } else {
            initializeAll();
        }
    }

    function initializeAll() {
        initScrollProgress();
        initNavbarScroll();
        initScrollReveal();
        initCardViewport();
        initCardClickState();
        initScrollToTop();
        initSectionIndicator();
        initLinkInteractions();
        initKeyboardNav();
        respectMotionPreference();

        console.log('✨ UniVerse AI Documentation: Premium Enhancements Loaded');
    }

    // Start initialization
    init();

})();
