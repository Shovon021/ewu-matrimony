// =====================================================
// TOAST NOTIFICATION SYSTEM
// Include this in your pages via <script src="components.js">
// =====================================================

// SVG Icons for use throughout the app
const SVG_ICONS = {
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    warning: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    info: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
    edit: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
    logout: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>',
    verified: '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>'
};

class Toast {
    static container = null;

    static init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    static show(type, title, message, duration = 4000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: SVG_ICONS.check,
            error: SVG_ICONS.close,
            warning: SVG_ICONS.warning,
            info: SVG_ICONS.info
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type] || SVG_ICONS.info}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
            <div class="toast-progress"></div>
        `;

        this.container.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);

        return toast;
    }

    static success(title, message = '') {
        return this.show('success', title, message);
    }

    static error(title, message = '') {
        return this.show('error', title, message);
    }

    static warning(title, message = '') {
        return this.show('warning', title, message);
    }

    static info(title, message = '') {
        return this.show('info', title, message);
    }
}

// =====================================================
// DYNAMIC NAVIGATION
// Call updateNav() on page load
// =====================================================

async function updateNav() {
    try {
        const response = await fetch('api/auth/check.php');
        const data = await response.json();

        const navButtons = document.querySelector('.nav-buttons');
        if (!navButtons) return;

        if (data.logged_in) {
            // User is logged in - show user menu
            const initial = data.name ? data.name.charAt(0).toUpperCase() : 'U';
            navButtons.innerHTML = `
                <a href="matches.html" class="btn btn-outline">
                    ${SVG_ICONS.heart} Matches
                </a>
                <div class="nav-dropdown">
                    <div class="nav-avatar">${initial}</div>
                    <div class="nav-dropdown-menu">
                        <a href="profile.html" class="nav-dropdown-item">
                            ${SVG_ICONS.user} My Profile
                        </a>
                        <a href="edit_biodata.html" class="nav-dropdown-item">
                            ${SVG_ICONS.edit} Edit Biodata
                        </a>
                        <a href="matches.html" class="nav-dropdown-item">
                            ${SVG_ICONS.heart} My Matches
                        </a>
                        <div class="nav-dropdown-divider"></div>
                        <a href="#" class="nav-dropdown-item danger" onclick="logout()">
                            ${SVG_ICONS.logout} Logout
                        </a>
                    </div>
                </div>
            `;
        } else {
            // Guest user - show login/signup
            navButtons.innerHTML = `
                <a href="login.html" class="btn btn-outline">Login</a>
                <a href="register.html" class="btn btn-primary">Sign Up</a>
            `;
        }
    } catch (e) {
        console.log('Nav check failed, showing guest nav');
    }
}

async function logout() {
    try {
        await fetch('api/auth/logout.php');
        Toast.success('Logged Out', 'See you again soon!');
        setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (e) {
        window.location.href = 'index.html';
    }
}

// =====================================================
// THEME MANAGER
// =====================================================
// ThemeManager Removed: Dark Mode Disabled Permanently

// =====================================================
// ANIMATION MANAGER
// =====================================================
const AnimationManager = {
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    AnimationManager.init();
});

function calculateCompleteness(formData) {
    const fields = [
        'photo', 'about_me', 'height', 'weight', 'blood_group', 'skin_tone',
        'marital_status', 'education', 'occupation', 'present_address',
        'permanent_address', 'father_name', 'mother_name', 'expectations'
    ];

    let filled = 0;
    fields.forEach(field => {
        if (formData[field] && formData[field].toString().trim() !== '') {
            filled++;
        }
    });

    return Math.round((filled / fields.length) * 100);
}

function updateCompletenessBar(percentage) {
    const bar = document.getElementById('completenessBar');
    const label = document.getElementById('completenessLabel');

    if (bar) {
        bar.style.width = percentage + '%';
    }
    if (label) {
        label.textContent = percentage + '% Complete';

        // Change color based on percentage
        if (percentage < 30) {
            label.style.color = '#ef4444';
        } else if (percentage < 70) {
            label.style.color = '#f59e0b';
        } else {
            label.style.color = '#10b981';
        }
    }
}

// =====================================================
// SKELETON LOADING HELPERS
// =====================================================

function showSkeletonCards(container, count = 6) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        container.innerHTML += `
            <div class="skeleton-card">
                <div class="skeleton-image"></div>
                <div class="skeleton skeleton-text medium"></div>
                <div class="skeleton skeleton-text short"></div>
                <div class="skeleton skeleton-text medium"></div>
            </div>
        `;
    }
}

// =====================================================
// INITIALIZE ON PAGE LOAD
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    // Update navigation based on login state
    updateNav();
});

