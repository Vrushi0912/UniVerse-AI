/**
 * Analytics Dashboard
 * Visualizes user activity, chat statistics, and usage patterns
 */

class AnalyticsDashboard {
    constructor() {
        this.stats = this.loadStats();
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupEventTracking();
    }

    loadStats() {
        const defaultStats = {
            totalChats: 0,
            totalMessages: 0,
            totalTokens: 0,
            sessionCount: 0,
            lastVisit: Date.now(),
            dailyUsage: {},
            modelUsage: {},
            featureUsage: {}
        };

        const stored = localStorage.getItem('universe-analytics');
        return stored ? { ...defaultStats, ...JSON.parse(stored) } : defaultStats;
    }

    saveStats() {
        localStorage.setItem('universe-analytics', JSON.stringify(this.stats));
    }

    trackPageView() {
        this.stats.sessionCount++;
        this.stats.lastVisit = Date.now();
        this.trackDailyUsage();
        this.saveStats();
    }

    trackDailyUsage() {
        const today = new Date().toISOString().split('T')[0];
        if (!this.stats.dailyUsage[today]) {
            this.stats.dailyUsage[today] = 0;
        }
        this.stats.dailyUsage[today]++;
    }

    trackChatCreated() {
        this.stats.totalChats++;
        this.trackFeature('chat_created');
        this.saveStats();
    }

    trackMessageSent(model = 'unknown') {
        this.stats.totalMessages++;
        this.trackModel(model);
        this.trackFeature('message_sent');
        this.saveStats();
    }

    trackModel(model) {
        if (!this.stats.modelUsage[model]) {
            this.stats.modelUsage[model] = 0;
        }
        this.stats.modelUsage[model]++;
    }

    trackFeature(feature) {
        if (!this.stats.featureUsage[feature]) {
            this.stats.featureUsage[feature] = 0;
        }
        this.stats.featureUsage[feature]++;
    }

    setupEventTracking() {
        // Track specific features
        const features = ['saveChatToLibrary', 'exportChat', 'toggleVoiceInput', 'saveCurrentPrompt'];
        features.forEach(feature => {
            const original = window[feature];
            if (typeof original === 'function') {
                window[feature] = (...args) => {
                    this.trackFeature(feature);
                    return original.apply(window, args);
                };
            }
        });
    }

    showDashboard() {
        const modal = this.createDashboardModal();
        document.body.appendChild(modal);
    }

    createDashboardModal() {
        const modal = document.createElement('div');
        modal.className = 'analytics-modal';
        modal.innerHTML = `
            <div class="analytics-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="analytics-content">
                <div class="analytics-header">
                    <h2>📊 Your Activity Dashboard</h2>
                    <button class="close-btn" onclick="this.closest('.analytics-modal').remove()">✕</button>
                </div>
                <div class="analytics-body">
                    ${this.renderStats()}
                    ${this.renderCharts()}
                </div>
            </div>
        `;
        return modal;
    }

    renderStats() {
        return `
            <div class="analytics-grid">
                <div class="analytics-card">
                    <div class="analytics-icon">💬</div>
                    <div class="analytics-value">${this.stats.totalChats}</div>
                    <div class="analytics-label">Total Chats</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-icon">📨</div>
                    <div class="analytics-value">${this.stats.totalMessages}</div>
                    <div class="analytics-label">Messages Sent</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-icon">🔄</div>
                    <div class="analytics-value">${this.stats.sessionCount}</div>
                    <div class="analytics-label">Sessions</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-icon">🕒</div>
                    <div class="analytics-value">${this.getLastVisit()}</div>
                    <div class="analytics-label">Last Visit</div>
                </div>
            </div>
        `;
    }

    renderCharts() {
        const dailyData = this.getDailyChartData();
        const modelData = this.getModelChartData();

        return `
            <div class="analytics-charts">
                <div class="chart-container">
                    <h3>📈 Daily Activity (Last 7 Days)</h3>
                    <div class="bar-chart">
                        ${dailyData.map(day => `
                            <div class="bar-item">
                                <div class="bar" style="height: ${day.percentage}%">
                                    <span class="bar-value">${day.count}</span>
                                </div>
                                <div class="bar-label">${day.label}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="chart-container">
                    <h3>🤖 Model Usage</h3>
                    <div class="model-list">
                        ${modelData.map(model => `
                            <div class="model-item">
                                <span class="model-name">${model.name}</span>
                                <div class="model-bar-bg">
                                    <div class="model-bar" style="width: ${model.percentage}%"></div>
                                </div>
                                <span class="model-count">${model.count}</span>
                            </div>
                        `).join('')}
                        ${modelData.length === 0 ? '<p style="text-align:center;color:var(--text-secondary);">No data yet</p>' : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getDailyChartData() {
        const last7Days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = this.stats.dailyUsage[dateStr] || 0;

            last7Days.push({
                label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count,
                percentage: 0
            });
        }

        // Calculate percentages
        const max = Math.max(...last7Days.map(d => d.count), 1);
        last7Days.forEach(day => {
            day.percentage = (day.count / max) * 100;
        });

        return last7Days;
    }

    getModelChartData() {
        const models = Object.entries(this.stats.modelUsage)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        const total = models.reduce((sum, m) => sum + m.count, 0);

        return models.map(model => ({
            ...model,
            percentage: total > 0 ? (model.count / total) * 100 : 0
        }));
    }

    getLastVisit() {
        const diff = Date.now() - this.stats.lastVisit;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    }

    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            ...this.stats
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `universe-analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// CSS Styles
const analyticsStyles = document.createElement('style');
analyticsStyles.textContent = `
    .analytics-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .analytics-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
    }

    .analytics-content {
        position: relative;
        width: 90%;
        max-width: 900px;
        max-height: 90vh;
        background: var(--card-bg);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        border: 1px solid var(--border-color);
    }

    .analytics-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%);
    }

    .analytics-header h2 {
        margin: 0;
        color: var(--text-primary);
    }

    .analytics-body {
        padding: 1.5rem;
        overflow-y: auto;
        max-height: calc(90vh - 100px);
    }

    .analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .analytics-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .analytics-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(124, 58, 237, 0.2);
    }

    .analytics-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    .analytics-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--primary-blue);
        margin-bottom: 0.5rem;
    }

    .analytics-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .analytics-charts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
    }

    .chart-container {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
    }

    .chart-container h3 {
        margin: 0 0 1rem 0;
        color: var(--text-primary);
        font-size: 1rem;
    }

    .bar-chart {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 0.5rem;
        height: 200px;
    }

    .bar-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .bar {
        width: 100%;
        background: linear-gradient(180deg, var(--primary-blue) 0%, var(--primary-purple) 100%);
        border-radius: 4px 4px 0 0;
        min-height: 4px;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 0.25rem;
        transition: all 0.3s ease;
    }

    .bar:hover {
        filter: brightness(1.2);
    }

    .bar-value {
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
    }

    .bar-label {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    .model-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .model-item {
        display: grid;
        grid-template-columns: 120px 1fr auto;
        gap: 1rem;
        align-items: center;
    }

    .model-name {
        font-size: 0.875rem;
        color: var(--text-primary);
        font-weight: 500;
    }

    .model-bar-bg {
        height: 24px;
        background: var(--bg-primary);
        border-radius: 12px;
        overflow: hidden;
    }

    .model-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--primary-blue) 0%, var(--primary-purple) 100%);
        transition: width 0.5s ease;
    }

    .model-count {
        font-size: 0.875rem;
        color: var(--text-secondary);
        font-weight: 600;
        min-width: 40px;
        text-align: right;
    }
`;

document.head.appendChild(analyticsStyles);

// Initialize analytics
const analytics = new AnalyticsDashboard();
window.analytics = analytics;

// Expose global functions for tracking
window.trackChatCreated = () => analytics.trackChatCreated();
window.trackMessageSent = (model) => analytics.trackMessageSent(model);
window.showAnalytics = () => analytics.showDashboard();
