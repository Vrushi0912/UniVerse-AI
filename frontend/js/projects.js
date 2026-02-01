// ====== PROJECTS PAGE JAVASCRIPT ======
// Comprehensive Project Management System

const API_BASE_URL = 'http://localhost:8000';

// State
let currentView = 'grid';
let projects = [];
let currentProject = null;
let isEditing = false;

// ====== INITIALIZATION ======

document.addEventListener('DOMContentLoaded', async () => {
    await loadProjects();
    updateStats();
    switchView('grid');
    applyThemePreferences();
});

// ====== API FUNCTIONS ======

async function loadProjects() {
    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        if (!token) {
            // Load from localStorage for guests
            projects = JSON.parse(localStorage.getItem('universe_projects') || '[]');
            renderProjects();
            return;
        }

        // Load from backend
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            projects = data.projects || [];
        } else {
            // Fallback to localStorage
            projects = JSON.parse(localStorage.getItem('universe_projects') || '[]');
        }

        renderProjects();
    } catch (error) {
        console.error('Error loading projects:', error);
        projects = JSON.parse(localStorage.getItem('universe_projects') || '[]');
        renderProjects();
    }
}

async function saveProjectToBackend(project) {
    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        if (!token) {
            // Save to localStorage for guests
            saveToLocalStorage(project);
            return true;
        }

        const url = project.id ? `${API_BASE_URL}/api/projects/${project.id}` : `${API_BASE_URL}/api/projects`;
        const method = project.id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(project)
        });

        if (response.ok) {
            const data = await response.json();
            return data.project || true;
        } else {
            throw new Error('Failed to save project');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        // Fallback to localStorage
        saveToLocalStorage(project);
        return true;
    }
}

function saveToLocalStorage(project) {
    if (!project.id) {
        project.id = Date.now().toString();
    }

    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
        projects[index] = project;
    } else {
        projects.push(project);
    }

    localStorage.setItem('universe_projects', JSON.stringify(projects));
}

async function deleteProjectFromBackend(projectId) {
    try {
        const token = localStorage.getItem('universe_token') || sessionStorage.getItem('universe_token');

        if (!token) {
            // Delete from localStorage
            projects = projects.filter(p => p.id !== projectId);
            localStorage.setItem('universe_projects', JSON.stringify(projects));
            return true;
        }

        const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            return true;
        } else {
            throw new Error('Failed to delete project');
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        // Fallback to localStorage
        projects = projects.filter(p => p.id !== projectId);
        localStorage.setItem('universe_projects', JSON.stringify(projects));
        return true;
    }
}

// ====== VIEW SWITCHING ======

function switchView(view) {
    currentView = view;

    // Update button states
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === view) {
            btn.classList.add('active');
        }
    });

    // Update view visibility
    document.querySelectorAll('.projects-grid, .projects-list, .kanban-board').forEach(el => {
        el.classList.remove('active-view');
    });

    const viewMap = {
        'grid': document.getElementById('gridView'),
        'list': document.getElementById('listView'),
        'kanban': document.getElementById('kanbanView')
    };

    if (viewMap[view]) {
        viewMap[view].classList.add('active-view');
    }

    renderProjects();
}

// ====== RENDER FUNCTIONS ======

function renderProjects() {
    const gridView = document.getElementById('gridView');
    const listView = document.getElementById('listView');
    const emptyState = document.getElementById('emptyState');

    // Show/hide empty state
    if (projects.length === 0) {
        emptyState.classList.remove('hidden');
        gridView.innerHTML = '';
        listView.innerHTML = '';
        renderKanban();
        updateStats();
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    // Render based on current view
    if (currentView === 'grid') {
        renderGridView();
    } else if (currentView === 'list') {
        renderListView();
    } else if (currentView === 'kanban') {
        renderKanban();
    }

    updateStats();
}

function renderGridView() {
    const gridView = document.getElementById('gridView');
    gridView.innerHTML = '';

    projects.forEach(project => {
        const card = createProjectCard(project);
        gridView.appendChild(card);
    });
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.onclick = () => viewProjectDetails(project.id);

    const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    const createdDate = new Date(project.created_at || Date.now());

    card.innerHTML = `
        <div class="project-header">
            <div>
                <h3 class="project-title">${escapeHtml(project.name)}</h3>
            </div>
            <div class="project-actions" onclick="event.stopPropagation()">
                <div class="action-icon" onclick="editProject('${project.id}')" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </div>
                <div class="action-icon" onclick="confirmDelete('${project.id}')" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </div>
            </div>
        </div>
        ${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ''}
        <div class="project-meta">
            <span class="status-badge ${project.status || 'planning'}">${formatStatus(project.status || 'planning')}</span>
            <span class="priority-badge ${project.priority || 'medium'}">${project.priority || 'Medium'}</span>
        </div>
        ${tags.length > 0 ? `
            <div class="project-tags">
                ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
        ` : ''}
        <div class="project-footer">
            <span class="project-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                ${createdDate.toLocaleDateString()}
            </span>
        </div>
    `;

    return card;
}

function renderListView() {
    const listView = document.getElementById('listView');
    listView.innerHTML = '';

    projects.forEach(project => {
        const item = createListItem(project);
        listView.appendChild(item);
    });
}

function createListItem(project) {
    const item = document.createElement('div');
    item.className = 'project-list-item';
    item.onclick = () => viewProjectDetails(project.id);

    const createdDate = new Date(project.created_at || Date.now());

    item.innerHTML = `
        <div class="list-item-main">
            <h3 class="list-item-title">${escapeHtml(project.name)}</h3>
            <p class="list-item-desc">${escapeHtml(project.description || 'No description')}</p>
        </div>
        <span class="status-badge ${project.status || 'planning'}">${formatStatus(project.status || 'planning')}</span>
        <span class="priority-badge ${project.priority || 'medium'}">${project.priority || 'Medium'}</span>
        <span class="project-date">${createdDate.toLocaleDateString()}</span>
    `;

    return item;
}

function renderKanban() {
    const statuses = ['planning', 'in-progress', 'completed', 'on-hold'];

    statuses.forEach(status => {
        const column = document.getElementById(`${toCamelCase(status)}Column`);
        const count = document.getElementById(`${toCamelCase(status)}Count`);

        const statusProjects = projects.filter(p => (p.status || 'planning') === status);
        count.textContent = statusProjects.length;

        column.innerHTML = '';
        statusProjects.forEach(project => {
            const card = createKanbanCard(project);
            column.appendChild(card);
        });
    });
}

function createKanbanCard(project) {
    const card = document.createElement('div');
    card.className = 'kanban-card';
    card.draggable = true;
    card.dataset.id = project.id;
    card.onclick = () => viewProjectDetails(project.id);

    card.ondragstart = (e) => {
        e.dataTransfer.setData('projectId', project.id);
        e.target.style.opacity = '0.5';
    };

    card.ondragend = (e) => {
        e.target.style.opacity = '1';
    };

    card.innerHTML = `
        <h4 class="kanban-card-title">${escapeHtml(project.name)}</h4>
        ${project.description ? `<p class="kanban-card-desc">${escapeHtml(project.description)}</p>` : ''}
        <div class="project-meta">
            <span class="priority-badge ${project.priority || 'medium'}">${project.priority || 'Medium'}</span>
        </div>
    `;

    return card;
}

// Enable drag and drop for kanban
document.addEventListener('DOMContentLoaded', () => {
    const columns = document.querySelectorAll('.column-content');

    columns.forEach(column => {
        column.ondragover = (e) => {
            e.preventDefault();
            column.style.background = 'rgba(37, 99, 235, 0.05)';
        };

        column.ondragleave = () => {
            column.style.background = '';
        };

        column.ondrop = async (e) => {
            e.preventDefault();
            column.style.background = '';

            const projectId = e.dataTransfer.getData('projectId');
            const newStatus = column.parentElement.dataset.status;

            const project = projects.find(p => p.id === projectId);
            if (project) {
                project.status = newStatus;
                project.updated_at = new Date().toISOString();
                await saveProjectToBackend(project);
                await loadProjects();
            }
        };
    });
});

// ====== PROJECT CRUD ======

function openNewProjectModal() {
    isEditing = false;
    currentProject = null;
    document.getElementById('modalTitle').textContent = 'New Project';
    document.getElementById('saveButtonText').textContent = 'Create Project';
    document.getElementById('projectForm').reset();
    document.getElementById('projectModal').classList.add('active');
}

function editProject(projectId) {
    isEditing = true;
    currentProject = projects.find(p => p.id === projectId);

    if (!currentProject) return;

    document.getElementById('modalTitle').textContent = 'Edit Project';
    document.getElementById('saveButtonText').textContent = 'Save Changes';

    // Populate form
    document.getElementById('projectName').value = currentProject.name || '';
    document.getElementById('projectStatus').value = currentProject.status || 'planning';
    document.getElementById('projectPriority').value = currentProject.priority || 'medium';
    document.getElementById('projectDescription').value = currentProject.description || '';
    document.getElementById('projectTechnology').value = currentProject.technology || '';
    document.getElementById('projectDeadline').value = currentProject.deadline || '';
    document.getElementById('projectTags').value = currentProject.tags || '';
    document.getElementById('projectNotes').value = currentProject.notes || '';

    document.getElementById('projectModal').classList.add('active');
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
    document.getElementById('projectForm').reset();
    currentProject = null;
    isEditing = false;
}

async function saveProject(event) {
    event.preventDefault();

    const project = {
        id: isEditing ? currentProject.id : null,
        name: document.getElementById('projectName').value.trim(),
        status: document.getElementById('projectStatus').value,
        priority: document.getElementById('projectPriority').value,
        description: document.getElementById('projectDescription').value.trim(),
        technology: document.getElementById('projectTechnology').value.trim(),
        deadline: document.getElementById('projectDeadline').value,
        tags: document.getElementById('projectTags').value.trim(),
        notes: document.getElementById('projectNotes').value.trim(),
        created_at: isEditing ? currentProject.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        const result = await saveProjectToBackend(project);

        if (result) {
            showToast(isEditing ? 'Project updated successfully!' : 'Project created successfully!', 'success');
            closeProjectModal();
            await loadProjects();
        } else {
            throw new Error('Failed to save');
        }
    } catch (error) {
        console.error('Error saving project:', error);
        showToast('Failed to save project', 'error');
    }
}

function confirmDelete(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
        deleteProject(projectId);
    }
}

async function deleteProject(projectId) {
    try {
        await deleteProjectFromBackend(projectId);
        showToast('Project deleted successfully', 'success');
        await loadProjects();
    } catch (error) {
        console.error('Error deleting project:', error);
        showToast('Failed to delete project', 'error');
    }
}

// ====== PROJECT DETAILS ======

function viewProjectDetails(projectId) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    currentProject = project;

    const tags = project.tags ? project.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    const createdDate = new Date(project.created_at || Date.now());
    const updatedDate = new Date(project.updated_at || project.created_at || Date.now());

    const detailsHtml = `
        <div class="project-details">
            <h2 style="margin-bottom: 1.5rem; color: var(--text-primary);">${escapeHtml(project.name)}</h2>
            
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
                <span class="status-badge ${project.status || 'planning'}">${formatStatus(project.status || 'planning')}</span>
                <span class="priority-badge ${project.priority || 'medium'}">${project.priority || 'Medium'} Priority</span>
            </div>
            
            ${project.description ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Description</h3>
                    <p style="color: var(--text-primary);">${escapeHtml(project.description)}</p>
                </div>
            ` : ''}
            
            ${project.technology ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Technology Stack</h3>
                    <p style="color: var(--text-primary);">${escapeHtml(project.technology)}</p>
                </div>
            ` : ''}
            
            ${project.deadline ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Deadline</h3>
                    <p style="color: var(--text-primary);">${new Date(project.deadline).toLocaleDateString()}</p>
                </div>
            ` : ''}
            
            ${tags.length > 0 ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Tags</h3>
                    <div class="project-tags">
                        ${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            ${project.notes ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Notes</h3>
                    <p style="color: var(--text-primary); white-space: pre-wrap;">${escapeHtml(project.notes)}</p>
                </div>
            ` : ''}
            
            <div style="padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                <p style="color: var(--text-muted); font-size: 0.875rem;">Created: ${createdDate.toLocaleString()}</p>
                <p style="color: var(--text-muted); font-size: 0.875rem;">Updated: ${updatedDate.toLocaleString()}</p>
            </div>
        </div>
    `;

    document.getElementById('projectDetails').innerHTML = detailsHtml;
    document.getElementById('detailsModal').classList.add('active');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('active');
    currentProject = null;
}

function editCurrentProject() {
    if (currentProject) {
        closeDetailsModal();
        editProject(currentProject.id);
    }
}

function deleteCurrentProject() {
    if (currentProject) {
        closeDetailsModal();
        confirmDelete(currentProject.id);
    }
}

// ====== SEARCH & FILTER ======

function searchProjects() {
    const query = document.getElementById('projectSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = projects;

    // Apply search
    if (query) {
        filtered = filtered.filter(p =>
            (p.name || '').toLowerCase().includes(query) ||
            (p.description || '').toLowerCase().includes(query) ||
            (p.tags || '').toLowerCase().includes(query) ||
            (p.technology || '').toLowerCase().includes(query)
        );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(p => (p.status || 'planning') === statusFilter);
    }

    // Temporarily replace projects array for rendering
    const originalProjects = projects;
    projects = filtered;
    renderProjects();
    projects = originalProjects;
}

function filterProjects() {
    searchProjects();
}

function sortProjects() {
    const sortBy = document.getElementById('sortBy').value;

    switch (sortBy) {
        case 'recent':
            projects.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
            break;
        case 'oldest':
            projects.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            break;
        case 'name':
            projects.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'priority':
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            projects.sort((a, b) => priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium']);
            break;
    }

    renderProjects();
}

// ====== STATS ======

function updateStats() {
    document.getElementById('totalProjects').textContent = projects.length;
    document.getElementById('activeProjects').textContent = projects.filter(p => p.status === 'in-progress').length;
    document.getElementById('completedProjects').textContent = projects.filter(p => p.status === 'completed').length;
    document.getElementById('onHoldProjects').textContent = projects.filter(p => p.status === 'on-hold').length;
}

// ====== UTILITY FUNCTIONS ======

function formatStatus(status) {
    const map = {
        'planning': 'Planning',
        'in-progress': 'In Progress',
        'completed': 'Completed',
        'on-hold': 'On Hold'
    };
    return map[status] || status;
}

function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function applyThemePreferences() {
    // Apply saved theme if available
    const savedTheme = localStorage.getItem('universe_theme');
    if (savedTheme) {
        // Theme application logic here
    }
}

// ====== TOAST NOTIFICATIONS ======

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-left: 4px solid ${type === '  success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        border-radius: 12px;
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: 1rem;
        animation: slideIn 0.3s ease-out;
    `;

    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `
        <span style="font-size: 1.2rem;">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
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

console.log('📁 Projects page initialized');
