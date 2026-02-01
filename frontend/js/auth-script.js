// Authentication System for UniVerse AI
const API_BASE_URL = 'http://localhost:8000';

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

    fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                alert('❌ Login failed: ' + (data.error || 'Invalid credentials'));
                return;
            }
            const token = data.token;
            // universe_session retained for UI display purposes (name/email)
            const session = {
                userId: data.user_id,
                email: email,
                name: null, // user info can be fetched via /api/auth/validate if needed
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
        .catch((err) => {
            console.error(err);
            // Ensure nothing is stored if backend is down
            localStorage.removeItem('universe_session');
            localStorage.removeItem('universe_token');
            sessionStorage.removeItem('universe_session');
            sessionStorage.removeItem('universe_token');
            alert('❌ Network Error: Server is unavailable. Please check your connection or try again later.');
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

    fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: name })
    })
        .then(r => r.json())
        .then(data => {
            if (data.error) {
                alert('❌ Registration failed: ' + (data.error || 'User already exists'));
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
            // Only store on successful response
            localStorage.setItem('universe_session', JSON.stringify(session));
            localStorage.setItem('universe_token', token);
            localStorage.setItem('universe_show_welcome', 'true');
            window.location.href = 'chat.html';
        })
        .catch((err) => {
            console.error(err);
            localStorage.removeItem('universe_session');
            localStorage.removeItem('universe_token');
            alert('❌ Network Error: Server is unavailable. Please check your connection or try again later.');
        });
}

// Continue as Guest
function continueAsGuest() {
    localStorage.removeItem('universe_guest_count');
    window.location.href = 'chat.html';
}

// Google Login
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
    fetch(`${API_BASE_URL}/api/auth/google`, {
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

// Validate Session on Load
document.addEventListener('DOMContentLoaded', async () => {
    // Check for token
    const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

    if (token) {
        try {
            // Verify with backend
            const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.valid) {
                    console.log('✅ Session active');
                    // Update session info if needed
                    // user is authenticated, redirect to app if we are on auth page
                    // (Assuming auth-script.js is mainly used by auth.html)
                    window.location.href = 'chat.html';
                }
            } else {
                console.warn('⚠️ Session expired or invalid');
                // Clear invalid session
                localStorage.removeItem('universe_token');
                localStorage.removeItem('universe_session');
                sessionStorage.removeItem('universe_token');
                sessionStorage.removeItem('universe_session');
                // Stay on auth page
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // On network error, maybe do nothing or allow retry?
            // For now, assume secure default (don't redirect)
        }
    }
});
