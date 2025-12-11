// Authentication System for UniVerse AI

// Show/Hide Forms
function showLogin() {
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('signupForm').classList.add('hidden');
}

function showSignup() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}

// Handle Login
function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                // Backend declined; try local fallback
                fallbackLogin(email, password);
                return;
            }
            const token = data.token;
            const session = {
                userId: data.user_id,
                email: email,
                name: null,
                loginTime: Date.now(),
                rememberMe: rememberMe
            };
            if (rememberMe) {
                localStorage.setItem('universe_session', JSON.stringify(session));
                localStorage.setItem('universe_token', token);
            } else {
                sessionStorage.setItem('universe_session', JSON.stringify(session));
                sessionStorage.setItem('universe_token', token);
            }
            localStorage.setItem('universe_show_welcome', 'true');
            window.location.href = 'chat.html';
        })
        .catch(() => {
            // Network/server unavailable; try local fallback
            fallbackLogin(email, password);
        });
}

// Handle Signup
function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupPasswordConfirm').value;

    // Validation
    if (password !== confirmPassword) {
        alert('❌ Passwords do not match!');
        return;
    }

    if (password.length < 6) {
        alert('❌ Password must be at least 6 characters long!');
        return;
    }

    fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: name })
    })
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                // Backend says exists; attempt login fallback
                fallbackLogin(email, password);
                return;
            }
            const token = data.token;
            const session = {
                userId: data.user_id,
                email: email,
                name: name,
                loginTime: Date.now(),
                rememberMe: true
            };
            localStorage.setItem('universe_session', JSON.stringify(session));
            localStorage.setItem('universe_token', token);
            localStorage.setItem('universe_show_welcome', 'true');
            window.location.href = 'chat.html';
        })
        .catch(() => {
            // Network/server unavailable; use local fallback signup
            fallbackSignup(name, email, password);
        });
}

async function hashPassword(password) {
    const enc = new TextEncoder();
    const data = enc.encode(password);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function fallbackSignup(name, email, password) {
    const users = JSON.parse(localStorage.getItem('universe_users') || '[]');
    if (users.some(u => u.email === email)) {
        alert('❌ This email is already registered locally. Please login.');
        return;
    }
    const hash = await hashPassword(password);
    const newUser = {
        id: 'user_' + Date.now(),
        name,
        email,
        password_hash: hash,
        createdAt: Date.now(),
        lastLogin: null,
        avatar: getInitials(name)
    };
    users.push(newUser);
    localStorage.setItem('universe_users', JSON.stringify(users));
    const session = {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        loginTime: Date.now(),
        rememberMe: true
    };
    localStorage.setItem('universe_session', JSON.stringify(session));
    localStorage.setItem('universe_show_welcome', 'true');
    window.location.href = 'chat.html';
}

async function fallbackLogin(email, password) {
    const users = JSON.parse(localStorage.getItem('universe_users') || '[]');
    const user = users.find(u => u.email === email);
    if (!user) {
        alert('❌ Account not found locally. Please sign up.');
        return;
    }
    const hash = await hashPassword(password);
    if (user.password_hash !== hash) {
        alert('❌ Incorrect password (local).');
        return;
    }
    const session = {
        userId: user.id,
        email: user.email,
        name: user.name,
        loginTime: Date.now(),
        rememberMe: true
    };
    localStorage.setItem('universe_session', JSON.stringify(session));
    localStorage.setItem('universe_show_welcome', 'true');
    window.location.href = 'chat.html';
}

// Continue as Guest
function continueAsGuest() {
    // Clear any existing guest count to reset
    // User gets fresh 5 prompts each time they click "Continue as Guest"
    localStorage.removeItem('universe_guest_count');

    // Redirect to chat in guest mode
    window.location.href = 'chat.html';
}

// Google Login (Placeholder - requires Google OAuth setup)
function getGoogleClientId() {
    return localStorage.getItem('GOOGLE_CLIENT_ID');
}

function loginWithGoogle() {
    const cid = getGoogleClientId() || prompt('Enter your Google OAuth Client ID');
    if (!cid) {
        alert('Google Client ID is required to continue.');
        return;
    }
    localStorage.setItem('GOOGLE_CLIENT_ID', cid);
    if (!window.google || !google.accounts || !google.accounts.id) {
        alert('Google Identity script not loaded. Please ensure internet connection.');
        return;
    }
    google.accounts.id.initialize({
        client_id: cid,
        callback: handleGoogleCredential
    });
    google.accounts.id.prompt();
}

function handleGoogleCredential(response) {
    const credential = response.credential;
    if (!credential) {
        alert('No Google credential received.');
        return;
    }
    fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
    })
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                alert('❌ Google authentication failed.');
                return;
            }
            const token = data.token;
            const session = {
                userId: data.user_id,
                email: 'google_user',
                name: 'Google User',
                loginTime: Date.now(),
                rememberMe: true
            };
            localStorage.setItem('universe_session', JSON.stringify(session));
            localStorage.setItem('universe_token', token);
            localStorage.setItem('universe_show_welcome', 'true');
            window.location.href = 'chat.html';
        })
        .catch(() => alert('❌ Network error during Google login.'));
}

// Helper Functions
function getInitials(name) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem('universe_session') || sessionStorage.getItem('universe_session');

    if (session) {
        const user = JSON.parse(session);
        // Redirect if session is valid (less than 7 days old)
        if (Date.now() - user.loginTime < 7 * 24 * 60 * 60 * 1000) {
            window.location.href = 'chat.html';
        }
    }
});
