// ====== PROFILE PAGE JAVASCRIPT ======
// Interactive functionality for the profile page

const API_BASE_URL = 'http://localhost:8000';

// State
let isEditMode = false;
let userData = {
    name: 'User Name',
    email: 'user@example.com',
    bio: 'AI enthusiast | Lifelong learner',
    avatar: 'U',
    memberSince: 'January 2024',
    subscriptionTier: 'Free Plan'
};

let stats = {
    totalChats: 0,
    savedPrompts: 0,
    streakDays: 0,
    timeSpent: 0
};

// ====== INITIALIZATION ======

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserProfile();
    loadUserStats();
    loadActivityFeed();
    applyThemePreferences();
    updateUI();
});

// ====== LOAD USER DATA ======

async function loadUserProfile() {
    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        if (!token) {
            // Guest mode - use default data
            userData.name = 'Guest User';
            userData.email = 'guest@universe.ai';
            userData.bio = 'Welcome to UniVerse AI!';
            updateUI();
            return;
        }

        // Validate token and get user info
        const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            userData.name = data.full_name || data.email.split('@')[0];
            userData.email = data.email;
            userData.subscriptionTier = data.subscription_tier || 'Free Plan';
            userData.avatar = userData.name.charAt(0).toUpperCase();

            // Get additional user data from localStorage
            const session = JSON.parse(localStorage.getItem('universe_session') || '{}');
            if (session.loginTime) {
                const memberDate = new Date(session.loginTime);
                userData.memberSince = memberDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                });
            }

            // Load saved profile data from preferences
            const prefsResponse = await fetch(`${API_BASE_URL}/api/user/preferences`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (prefsResponse.ok) {
                const prefs = await prefsResponse.json();
                if (prefs.profile) {
                    // Use saved name if available, otherwise use email-based name
                    if (prefs.profile.name) {
                        userData.name = prefs.profile.name;
                        userData.avatar = prefs.profile.name.charAt(0).toUpperCase();
                    }
                    if (prefs.profile.bio) {
                        userData.bio = prefs.profile.bio;
                    }
                    // Load saved avatar image
                    if (prefs.profile.avatar) {
                        const avatarEl = document.querySelector('.avatar');
                        if (avatarEl) {
                            avatarEl.style.backgroundImage = `url(${prefs.profile.avatar})`;
                            avatarEl.style.backgroundSize = 'cover';
                            avatarEl.style.backgroundPosition = 'center';
                            const avatarText = avatarEl.querySelector('.avatar-text');
                            if (avatarText) {
                                avatarText.style.display = 'none';
                            }
                        }
                    }
                    // Load saved banner image
                    if (prefs.profile.banner) {
                        const bannerEl = document.getElementById('profileBanner');
                        if (bannerEl) {
                            bannerEl.style.backgroundImage = `url(${prefs.profile.banner})`;
                            bannerEl.style.backgroundSize = 'cover';
                            bannerEl.style.backgroundPosition = 'center';
                        }
                    }
                }
            }
        }

        updateUI();
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Failed to load profile data', 'error');
    }
}

async function loadUserStats() {
    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        if (!token) {
            // Use localStorage stats for guests
            const guestStats = JSON.parse(localStorage.getItem('universe-analytics') || '{}');
            stats.totalChats = guestStats.totalChats || 0;
            stats.savedPrompts = 0;
            stats.streakDays = 0;
            stats.timeSpent = 0;
            updateStatsUI();
            return;
        }

        // Load chat history count
        const chatResponse = await fetch(`${API_BASE_URL}/api/chat/history?limit=1000`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (chatResponse.ok) {
            const chatData = await chatResponse.json();
            stats.totalChats = chatData.history?.length || 0;
        }

        // Load saved prompts count
        const promptsResponse = await fetch(`${API_BASE_URL}/api/library/prompts?limit=1000`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (promptsResponse.ok) {
            const promptsData = await promptsResponse.json();
            stats.savedPrompts = promptsData.prompts?.length || 0;
        }

        // Calculate streak (from localStorage analytics)
        const analytics = JSON.parse(localStorage.getItem('universe-analytics') || '{}');
        stats.streakDays = calculateStreak(analytics.dailyUsage || {});
        stats.timeSpent = calculateTimeSpent(analytics);

        updateStatsUI();
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function calculateStreak(dailyUsage) {
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let currentDate = new Date();

    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (dailyUsage[dateStr]) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

function calculateTimeSpent(analytics) {
    // Estimate based on total messages (average 2 minutes per message)
    const totalMessages = analytics.totalMessages || 0;
    return Math.round((totalMessages * 2) / 60); // Convert to hours
}

function loadActivityFeed() {
    // This would load from backend in production
    // For now, showing static data
    console.log('Activity feed loaded');
}

// ====== UPDATE UI ======

function updateUI() {
    // Update profile display
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('userBio').textContent = userData.bio;
    document.getElementById('memberSince').textContent = userData.memberSince;
    document.getElementById('subscriptionTier').textContent = userData.subscriptionTier;

    // Update avatar
    const avatarText = document.querySelector('.avatar-text');
    if (avatarText) {
        avatarText.textContent = userData.avatar;
    }
}

function updateStatsUI() {
    document.getElementById('totalChats').textContent = stats.totalChats;
    document.getElementById('savedPrompts').textContent = stats.savedPrompts;
    document.getElementById('streakDays').textContent = stats.streakDays;
    document.getElementById('timeSpent').textContent = stats.timeSpent + 'h';
}

// ====== EDIT MODE ======

function toggleEditMode() {
    isEditMode = !isEditMode;

    const displayMode = document.getElementById('displayMode');
    const editMode = document.getElementById('editMode');
    const editBtn = document.getElementById('editProfileBtn');
    const bannerEditBtn = document.getElementById('bannerEditBtn');
    const avatarEditBtn = document.getElementById('avatarEditBtn');

    if (isEditMode) {
        // Enter edit mode
        displayMode.classList.add('hidden');
        editMode.classList.remove('hidden');
        bannerEditBtn.classList.remove('hidden');
        avatarEditBtn.classList.remove('hidden');

        // Populate edit fields
        document.getElementById('editName').value = userData.name;
        document.getElementById('editBio').value = userData.bio;

        editBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            Save
        `;
    } else {
        // Exit edit mode
        displayMode.classList.remove('hidden');
        editMode.classList.add('hidden');
        bannerEditBtn.classList.add('hidden');
        avatarEditBtn.classList.add('hidden');

        editBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
        `;
    }
}

async function saveProfile() {
    try {
        const newName = document.getElementById('editName').value.trim();
        const newBio = document.getElementById('editBio').value.trim();

        if (!newName) {
            showToast('Name cannot be empty', 'warning');
            return;
        }

        // Update local data
        userData.name = newName;
        userData.bio = newBio;
        userData.avatar = newName.charAt(0).toUpperCase();

        // Save to backend
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        if (token) {
            const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profile: {
                        name: newName,
                        bio: newBio
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save profile');
            }
        } else {
            // Save to localStorage for guests
            localStorage.setItem('universe_guest_profile', JSON.stringify(userData));
        }

        toggleEditMode();
        updateUI();
        showToast('Profile updated successfully!', 'success');
    } catch (error) {
        console.error('Error saving profile:', error);
        showToast('Failed to save profile', 'error');
    }
}

function cancelEdit() {
    toggleEditMode();
}

// ====== AVATAR & BANNER ======

async function changeAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showToast('Image size must be less than 2MB', 'warning');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file', 'warning');
            return;
        }

        try {
            showToast('Uploading avatar...', 'info');

            // Convert to base64
            const base64 = await fileToBase64(file);

            // Update UI immediately
            const avatarEl = document.querySelector('.avatar');
            if (avatarEl) {
                avatarEl.style.backgroundImage = `url(${base64})`;
                avatarEl.style.backgroundSize = 'cover';
                avatarEl.style.backgroundPosition = 'center';
                avatarEl.querySelector('.avatar-text').style.display = 'none';
            }

            // Save to backend
            const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');
            if (token) {
                const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        profile: {
                            avatar: base64
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to save avatar');
                }

                showToast('Avatar updated successfully!', 'success');
            } else {
                // Save to localStorage for guests
                const guestProfile = JSON.parse(localStorage.getItem('universe_guest_profile') || '{}');
                guestProfile.avatar = base64;
                localStorage.setItem('universe_guest_profile', JSON.stringify(guestProfile));
                showToast('Avatar updated!', 'success');
            }
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showToast('Failed to upload avatar', 'error');
        }
    };
    input.click();
}

async function changeBanner() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image size must be less than 5MB', 'warning');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file', 'warning');
            return;
        }

        try {
            showToast('Uploading banner...', 'info');

            // Convert to base64
            const base64 = await fileToBase64(file);

            // Update UI immediately
            const bannerEl = document.getElementById('profileBanner');
            if (bannerEl) {
                bannerEl.style.backgroundImage = `url(${base64})`;
                bannerEl.style.backgroundSize = 'cover';
                bannerEl.style.backgroundPosition = 'center';
            }

            // Save to backend
            const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');
            if (token) {
                const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        profile: {
                            banner: base64
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to save banner');
                }

                showToast('Banner updated successfully!', 'success');
            } else {
                // Save to localStorage for guests
                const guestProfile = JSON.parse(localStorage.getItem('universe_guest_profile') || '{}');
                guestProfile.banner = base64;
                localStorage.setItem('universe_guest_profile', JSON.stringify(guestProfile));
                showToast('Banner updated!', 'success');
            }
        } catch (error) {
            console.error('Error uploading banner:', error);
            showToast('Failed to upload banner', 'error');
        }
    };
    input.click();
}

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ====== THEME ======

function changeTheme() {
    const theme = document.getElementById('themeSelect').value;
    applyTheme(theme);

    // Save to backend if authenticated
    const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');
    if (token) {
        fetch(`${API_BASE_URL}/api/user/preferences`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                theme: { mode: theme }
            })
        }).catch(err => console.error('Failed to save theme:', err));
    }
}

function applyTheme(theme) {
    const root = document.documentElement;
    const themes = {
        'blue-black': { primary: '#2563eb', secondary: '#3b82f6', light: '#60a5fa' },
        'purple-black': { primary: '#7c3aed', secondary: '#8b5cf6', light: '#a78bfa' },
        'green-black': { primary: '#059669', secondary: '#10b981', light: '#34d399' }
    };

    const colors = themes[theme] || themes['blue-black'];
    root.style.setProperty('--primary-blue', colors.primary);
    root.style.setProperty('--secondary-blue', colors.secondary);
    root.style.setProperty('--light-blue', colors.light);
}

async function applyThemePreferences() {
    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        if (!token) {
            applyTheme('blue-black');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.theme && data.theme.mode) {
                document.getElementById('themeSelect').value = data.theme.mode;
                applyTheme(data.theme.mode);
            }

            if (data.model && data.model.default_model) {
                document.getElementById('modelSelect').value = data.model.default_model;
            }
        }
    } catch (error) {
        console.error('Error loading theme:', error);
        applyTheme('blue-black');
    }
}

// ====== ACCOUNT ACTIONS ======

async function exportData() {
    try {
        showToast('Preparing your data...', 'info');

        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        const exportData = {
            profile: userData,
            stats: stats,
            exportDate: new Date().toISOString()
        };

        if (token) {
            // Fetch all user data
            const [chats, prompts, prefs] = await Promise.all([
                fetch(`${API_BASE_URL}/api/chat/history?limit=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => r.ok ? r.json() : null),

                fetch(`${API_BASE_URL}/api/library/prompts?limit=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => r.ok ? r.json() : null),

                fetch(`${API_BASE_URL}/api/user/preferences`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => r.ok ? r.json() : null)
            ]);

            exportData.chats = chats?.history || [];
            exportData.prompts = prompts?.prompts || [];
            exportData.preferences = prefs || {};
        }

        // Create and download file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `universe-ai-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Data exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showToast('Failed to export data', 'error');
    }
}

function changePassword() {
    showToast('Password change coming soon!', 'info');
    // In production, this would open a modal for password change
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        showToast('Account deletion coming soon!', 'info');
        // In production, this would handle account deletion
    }
}

// ====== TOAST NOTIFICATIONS ======

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 1rem;
        animation: slideInRight 0.3s ease-out;
    `;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🎨 Profile page initialized');
