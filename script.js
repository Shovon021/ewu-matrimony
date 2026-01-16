// ===== HEADER SCROLL EFFECT =====
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ===== HERO VIDEO CAROUSEL =====
(function initHeroCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');

    if (slides.length === 0) return; // Not on homepage

    let currentSlide = 0;

    function goToSlide(index) {
        // Clean up events on current video
        const currentVideo = slides[currentSlide].querySelector('video');
        if (currentVideo) {
            currentVideo.onended = null; // Remove event listener
            currentVideo.pause();
            currentVideo.currentTime = 0;
        }

        // REMOVE ACTIVE CLASS IMMEDIATELY to trigger text fade out
        slides[currentSlide].classList.remove('active');
        dots[currentSlide]?.classList.remove('active');

        // Update index
        currentSlide = (index + slides.length) % slides.length;

        // Add active class
        slides[currentSlide].classList.add('active');
        dots[currentSlide]?.classList.add('active');

        // Play new video and set up next slide trigger
        const newVideo = slides[currentSlide].querySelector('video');
        if (newVideo) {
            newVideo.currentTime = 0;
            newVideo.play().catch(() => { });

            // KEY FIX: Only advance when video ends
            newVideo.onended = () => nextSlide();
        } else {
            // Fallback for no video: wait 5 seconds then next
            setTimeout(nextSlide, 5000);
        }
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // Event Listeners
    if (nextBtn) nextBtn.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
        // Note: goToSlide sets up the onended/auto logic, so no need to call startAutoPlay
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
    });

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    // Touch/Swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    const carousel = document.getElementById('heroCarousel');
    if (carousel) {
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        if (touchStartX - touchEndX > 50) nextSlide();
        else if (touchEndX - touchStartX > 50) prevSlide();
    }

    // Start first video
    const firstVideo = slides[0]?.querySelector('video');
    if (firstVideo) {
        firstVideo.play().catch(() => { });
        firstVideo.onended = () => nextSlide();
    }

    // Visibility API to pause/resume
    document.addEventListener('visibilitychange', () => {
        const video = slides[currentSlide].querySelector('video');
        if (document.hidden) {
            if (video) video.pause();
        } else {
            if (video) video.play().catch(() => { });
        }
    });
})();

// ===== MOBILE MENU =====
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
const mobileMenuClose = document.getElementById('mobileMenuClose');

function openMobileMenu() {
    mobileMenu.classList.add('active');
    mobileMenuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    mobileMenu.classList.remove('active');
    mobileMenuOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', openMobileMenu);
}

if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
}

if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', closeMobileMenu);
}

// ===== SMOOTH SCROLL =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            closeMobileMenu();
        }
    });
});

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.step-card, .feature-card').forEach(card => {
    observer.observe(card);
});

// ===== FORM VALIDATION HELPERS =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\d\s\-+()]{10,}$/;
    return re.test(phone);
}

function showError(input, message) {
    const formGroup = input.closest('.form-group');
    if (formGroup) {
        const error = formGroup.querySelector('.error-message') || document.createElement('span');
        error.className = 'error-message';
        error.textContent = message;
        if (!formGroup.querySelector('.error-message')) {
            formGroup.appendChild(error);
        }
        input.classList.add('error');
    }
}

function clearError(input) {
    const formGroup = input.closest('.form-group');
    if (formGroup) {
        const error = formGroup.querySelector('.error-message');
        if (error) error.remove();
        input.classList.remove('error');
    }
}

// ===== TAB SWITCHING (for login/register) =====
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(target)?.classList.add('active');
        });
    });
}

initTabs();

// ===== SEARCH FILTERS =====
function initFilters() {
    const filterToggle = document.querySelector('.filter-toggle');
    const filterPanel = document.querySelector('.filter-panel');

    if (filterToggle && filterPanel) {
        filterToggle.addEventListener('click', () => {
            filterPanel.classList.toggle('active');
        });
    }
}

initFilters();

// ===== PASSWORD VISIBILITY TOGGLE =====
function initPasswordToggles() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const input = toggle.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                toggle.textContent = '🙈';
            } else {
                input.type = 'password';
                toggle.textContent = '';
            }
        });
    });
}

initPasswordToggles();

// ===== RANGE SLIDER VALUE DISPLAY =====
function initRangeSliders() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const display = document.getElementById(slider.id + '-value');
        if (display) {
            slider.addEventListener('input', () => {
                display.textContent = slider.value;
            });
        }
    });
}

initRangeSliders();

// ===== PROFILE CARD LIKE/DISLIKE =====
function initProfileActions() {
    document.querySelectorAll('.profile-action').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const action = btn.dataset.action;
            const card = btn.closest('.profile-card');

            if (action === 'like') {
                btn.classList.toggle('liked');
                // Add animation
                card.classList.add('action-feedback');
                setTimeout(() => card.classList.remove('action-feedback'), 300);
            } else if (action === 'message') {
                // Could open a message modal
                alert('Please login to send messages');
            }
        });
    });
}

initProfileActions();

// ===== COUNTER ANIMATION =====
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start).toLocaleString();
        }
    }, 16);
}

// Animate stats on scroll
// Animate stats on scroll
const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    let animated = false;

    const loadStats = async () => {
        if (animated) return;
        animated = true;

        try {
            const res = await fetch('api/public?action=stats');
            const data = await res.json();

            if (data.success && data.stats) {
                const map = {
                    'stat-undergrad': data.stats.undergrad_profiles,
                    'stat-grad': data.stats.grad_profiles,
                    'stat-alumni': data.stats.alumni_profiles,
                    'stat-verified': data.stats.verified_profiles
                };

                Object.keys(map).forEach(id => {
                    const el = document.getElementById(id);
                    if (el) animateCounter(el, map[id] || 0);
                });
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                loadStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statsObserver.observe(statsSection);
}

