/*========================================
  ABOUT PAGE INTERACTIVE ANIMATIONS
  Premium AI Product Showcase JavaScript
  ========================================*/

(function () {
    'use strict';

    /* ============================================
       NAVBAR SCROLL EFFECT
       ============================================ */

    function initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        let lastScrollTop = 0;

        window.addEventListener('scroll', function () {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            lastScrollTop = scrollTop;
        });
    }

    /* ============================================
       SCROLL REVEAL ANIMATION
       ============================================ */

    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.feature-card');

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -100px 0px'
        });

        revealElements.forEach((element, index) => {
            element.classList.add('reveal');
            element.style.animationDelay = `${index * 0.15}s`;
            revealObserver.observe(element);
        });
    }

    /* ============================================
       FLOATING PARTICLES ENHANCEMENT
       ============================================ */

    function createFloatingParticles() {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'floating-particles';
        particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        `;

        const particleCount = window.innerWidth > 768 ? 30 : 15;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const size = Math.random() * 4 + 1;
            const left = Math.random() * 100;
            const animationDuration = Math.random() * 20 + 15;
            const delay = Math.random() * 5;

            const colors = [
                'rgba(6, 182, 212, 0.4)',
                'rgba(59, 130, 246, 0.3)',
                'rgba(139, 92, 246, 0.3)',
                'rgba(96, 165, 250, 0.4)'
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                left: ${left}%;
                bottom: -10px;
                box-shadow: 0 0 ${size * 3}px ${color};
                animation: floatUp ${animationDuration}s linear ${delay}s infinite;
            `;

            particleContainer.appendChild(particle);
        }

        document.body.appendChild(particleContainer);

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes floatUp {
                0% {
                    transform: translateY(0) translateX(0);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /* ============================================
       CARD HOVER 3D TILT EFFECT
       ============================================ */

    function initCardTiltEffect() {
        const cards = document.querySelectorAll('.feature-card');

        cards.forEach(card => {
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

                this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.01)`;
            });

            card.addEventListener('mouseleave', function () {
                this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
            });
        });
    }

    /* ============================================
       ANIMATED LIST ITEMS
       ============================================ */

    function animateListItems() {
        const listItems = document.querySelectorAll('.feature-card li');

        listItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            item.style.transition = `all 0.5s ease ${index * 0.1}s`;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateX(0)';
                    }
                });
            }, { threshold: 0.5 });

            observer.observe(item);
        });
    }

    /* ============================================
       SMOOTH SCROLL FOR INTERNAL LINKS
       ============================================ */

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /* ============================================
       ENHANCED LOGO INTERACTION
       ============================================ */

    function enhanceLogoInteraction() {
        const logo = document.querySelector('.logo');
        const logoIcon = document.querySelector('.logo-icon');

        if (logo && logoIcon) {
            logo.addEventListener('click', function () {
                logoIcon.style.animation = 'none';
                setTimeout(() => {
                    logoIcon.style.animation = 'logoGlow 3s ease-in-out infinite';
                }, 10);
            });
        }
    }

    /* ============================================
       PARALLAX SCROLL EFFECT
       ============================================ */

    function initParallaxEffect() {
        const hero = document.querySelector('.section-title');

        if (hero) {
            window.addEventListener('scroll', function () {
                const scrolled = window.pageYOffset;
                const parallax = scrolled * 0.5;

                hero.style.transform = `translateY(${parallax}px)`;
                hero.style.opacity = 1 - (scrolled / 500);
            });
        }
    }

    /* ============================================
       EMOJI ICON ANIMATION
       ============================================ */

    function animateEmojiIcons() {
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;

        document.querySelectorAll('.feature-card h2, .feature-card h3').forEach(heading => {
            const text = heading.textContent;
            const emojis = text.match(emojiRegex);

            if (emojis && emojis.length > 0) {
                heading.addEventListener('mouseenter', function () {
                    const emoji = this.textContent.match(emojiRegex)[0];
                    const span = document.createElement('span');
                    span.textContent = emoji;
                    span.style.cssText = `
                        display: inline-block;
                        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    `;

                    this.innerHTML = this.textContent.replace(emoji, span.outerHTML);

                    setTimeout(() => {
                        const emojiSpan = this.querySelector('span');
                        if (emojiSpan) {
                            emojiSpan.style.transform = 'scale(1.3) rotate(360deg)';
                        }
                    }, 10);
                });
            }
        });
    }

    /* ============================================
       TECHNOLOGY STACK HOVER EFFECT
       ============================================ */

    function enhanceTechStack() {
        const techItems = document.querySelectorAll('.feature-card > div > p');

        techItems.forEach(item => {
            item.addEventListener('mouseenter', function () {
                this.style.transform = 'translateX(10px) scale(1.02)';
                this.style.boxShadow = '0 8px 25px rgba(6, 182, 212, 0.3)';
            });

            item.addEventListener('mouseleave', function () {
                this.style.transform = 'translateX(0) scale(1)';
                this.style.boxShadow = '0 4px 15px rgba(6, 182, 212, 0.2)';
            });
        });
    }

    /* ============================================
       TYPING EFFECT FOR HERO TITLE
       ============================================ */

    function initTypingEffect() {
        const heroTitle = document.querySelector('h1.section-title');

        if (heroTitle && window.innerWidth > 768) {
            const text = heroTitle.textContent;
            heroTitle.textContent = '';
            heroTitle.style.opacity = '1';

            let index = 0;

            function type() {
                if (index < text.length) {
                    heroTitle.textContent += text.charAt(index);
                    index++;
                    setTimeout(type, 100);
                }
            }

            setTimeout(type, 500);
        }
    }

    /* ============================================
       INITIALIZE ALL ENHANCEMENTS
       ============================================ */

    function init() {
        console.log('🌌 About Page: Initializing futuristic enhancements...');

        // Core animations
        initNavbarScroll();
        initScrollReveal();
        createFloatingParticles();

        // Interactive effects
        initCardTiltEffect();
        animateListItems();
        initSmoothScroll();
        enhanceLogoInteraction();

        // Advanced effects
        initParallaxEffect();
        animateEmojiIcons();
        enhanceTechStack();

        // Typing effect (optional - can be disabled)
        // initTypingEffect();

        console.log('✨ About Page: Enhancements loaded successfully!');
    }

    /* ============================================
       AUTO-INITIALIZE ON DOM READY
       ============================================ */

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ============================================
       PERFORMANCE MONITORING
       ============================================ */

    window.addEventListener('load', function () {
        const perfData = performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`📊 Page Load Time: ${pageLoadTime}ms`);
    });

})();
