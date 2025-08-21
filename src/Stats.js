/**
 * Stats.js - Statistics processing and visualization
 * 
 * Handles session data analysis and chart generation for meditation statistics.
 * Processes session history from IndexedDB to create various visualizations
 * including calendar views, practice distributions, category trends, and
 * time analysis charts using Chart.js.
 * 
 * Key responsibilities:
 * - Load and process session data from storage
 * - Generate statistics for different time periods
 * - Create interactive charts and calendar views
 * - Handle Chart.js loading with offline fallback
 * - Optimize rendering for large datasets
 * 
 * @module Stats
 */
export default class Stats {
  /**
   * Initialize statistics module with app dependencies
   * @param {Object} app - Main app instance with state and elements
   * @param {Function} getCategoryForPractice - Function to map practices to categories
   * @param {Object} categoryColors - Color mapping for practice categories
   */
  constructor(app, getCategoryForPractice, categoryColors) {
    // Validate constructor parameters
    if (!app || typeof app !== 'object') {
      throw new Error('Stats: app instance is required');
    }
    if (typeof getCategoryForPractice !== 'function') {
      throw new Error('Stats: getCategoryForPractice must be a function');
    }
    if (!categoryColors || typeof categoryColors !== 'object') {
      throw new Error('Stats: categoryColors object is required');
    }
    
    this.app = app;
    this.getCategoryForPractice = getCategoryForPractice;
    this.CATEGORY_COLORS = categoryColors;
    this.chartLoaded = false;
  }

  /**
   * Set statistics content area to display loading, offline, or empty state
   * @param {string} state - Display state ('loading', 'offline', 'empty')
   * @returns {void}
   */
  setStatsContent(state) {
    const content = this.app.elements.statsContent;
    content.innerHTML = '';
    if (state === 'loading') {
      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      const text = document.createElement('p');
      text.textContent = 'Loading statistics...';
      content.appendChild(spinner);
      content.appendChild(text);
    } else if (state === 'offline') {
      const message = document.createElement('p');
      message.className = 'empty-message';
      message.textContent = 'Unable to load charts offline';
      content.appendChild(message);
    } else if (state === 'empty') {
      const message = document.createElement('p');
      message.className = 'empty-message';
      message.textContent = 'No sessions in this period';
      content.appendChild(message);
    }
  }

    /**
   * Load and display statistics for current time period
   * Fetches data from IndexedDB and generates visualizations
   * @returns {Promise<void>}
   */
  async loadStatistics() {
    this.setStatsContent('loading');
    if (!this.chartLoaded) {
      try {
        await this.loadChartJS();
        this.chartLoaded = true;
      } catch (e) {
        this.app.showToast('Failed to load charts. Check your connection.', 'error');
        this.setStatsContent('offline');
        return;
      }
    }
    const sessions = await this.getSessionsForPeriod(this.app.state.app.selectedPeriod);
    if (sessions.length === 0) {
      this.setStatsContent('empty');
      return;
    }
    const statsData = this.processStatisticsData(sessions);
    this.app.clearElement(this.app.elements.statsContent);
    requestAnimationFrame(() => {
      this.createCalendarViewOptimized(statsData.sessionsByDate, this.app.state.app.selectedPeriod);
      this.createPracticeDistributionOptimized(statsData.practiceCounts);
      this.createCategoryTrendChartOptimized(statsData.dateData);
      this.createPostureChartOptimized(statsData.postureCounts, sessions.length);
      this.createTimeChartOptimized(statsData.durationsByDate);
    });
  }

  /**
   * Process raw session data into statistics for visualization
   * Aggregates sessions by date, practice, category, and posture
   * @param {Array<Object>} sessions - Array of session objects from database
   * @returns {Object} Processed statistics data for chart generation
   */
  processStatisticsData(sessions) {
    const sessionsByDate = {};
    const practiceCounts = {};
    const dateData = {};
    const postureCounts = { Sitting: 0, Walking: 0, Standing: 0, Lying: 0 };
    const durationsByDate = {};
    sessions.forEach(session => {
      const dateString = new Date(session.date).toDateString();
      const localeDateString = new Date(session.date).toLocaleDateString();
      if (!sessionsByDate[dateString]) sessionsByDate[dateString] = [];
      sessionsByDate[dateString].push(session);
      if (!durationsByDate[localeDateString]) durationsByDate[localeDateString] = [];
      durationsByDate[localeDateString].push(Math.floor(session.duration / 60));
      if (session.posture && postureCounts.hasOwnProperty(session.posture)) {
        postureCounts[session.posture]++;
      }
      const practices = session.practices || [session.practice];
      if (!dateData[localeDateString]) {
        dateData[localeDateString] = {
          mindfulness: 0, compassion: 0, sympatheticJoy: 0, equanimity: 0, wiseReflection: 0, total: 0
        };
      }
      practices.forEach(practice => {
        if (practice) {
          practiceCounts[practice] = (practiceCounts[practice] || 0) + 1;
          const category = this.getCategoryForPractice(practice);
          dateData[localeDateString][category] = (dateData[localeDateString][category] || 0) + 1;
          dateData[localeDateString].total += 1;
        }
      });
    });
    return { sessionsByDate, practiceCounts, dateData, postureCounts, durationsByDate };
  }

  /**
   * Dynamically load Chart.js library from CDN or cache
   * Chart.js is cached by service worker during first load, so this works offline
   * @returns {Promise<void>} Resolves when Chart.js is loaded and ready
   */
  async loadChartJS() {
    if (window.Chart) return;
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    return new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async getSessionsForPeriod(period) {
    const now = new Date();
    let startDate = new Date();
    switch (period) {
      case 'week': startDate.setDate(now.getDate() - 7); break;
      case 'fortnight': startDate.setDate(now.getDate() - 14); break;
      case 'month': startDate.setMonth(now.getMonth() - 1); break;
    }
    if (this.app.state.app.db) {
      return await this.getSessionsFromIndexedDB(startDate);
    } else {
      return this.getSessionsFromLocalStorage(startDate);
    }
  }

  async getSessionsFromIndexedDB(startDate) {
    return new Promise((resolve) => {
      const tx = this.app.state.app.db.transaction(['sessions'], 'readonly');
      const store = tx.objectStore('sessions');
      const index = store.index('date');
      const range = IDBKeyRange.lowerBound(startDate.toISOString());
      const req = index.getAll(range);
      req.onsuccess = (e) => resolve(e.target.result || []);
      req.onerror = () => resolve([]);
    });
  }

  getSessionsFromLocalStorage(startDate) {
    const allSessions = JSON.parse(localStorage.getItem('allSessions') || '[]');
    return allSessions.filter(session => new Date(session.date) >= startDate);
  }

  createCalendarViewOptimized(sessionsByDate, period) {
    const card = document.createElement('div');
    card.className = 'stats-card';
    const title = document.createElement('h4');
    title.textContent = `Calendar View (${period})`;
    card.appendChild(title);
    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const labels = Object.keys(sessionsByDate).sort((a, b) => new Date(a) - new Date(b));
    const data = labels.map(date => sessionsByDate[date].length);
    new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Sessions', data, backgroundColor: '#00d4aa' }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
    this.app.elements.statsContent.appendChild(card);
  }

  createPracticeDistributionOptimized(practiceCounts) {
    const card = document.createElement('div');
    card.className = 'stats-card';
    const title = document.createElement('h4');
    title.textContent = 'Practice Distribution';
    card.appendChild(title);
    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const labels = Object.keys(practiceCounts);
    const data = Object.values(practiceCounts);
    new Chart(ctx, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: ['#06b6d4','#ec4899','#f59e0b','#8b5cf6','#10b981'] }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
    this.app.elements.statsContent.appendChild(card);
  }

  createCategoryTrendChartOptimized(dateData) {
    const card = document.createElement('div');
    card.className = 'stats-card';
    const title = document.createElement('h4');
    title.textContent = 'Category Trends';
    card.appendChild(title);
    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const labels = Object.keys(dateData).sort((a, b) => new Date(a) - new Date(b));
    const categories = ['mindfulness','compassion','sympatheticJoy','equanimity','wiseReflection'];
    const datasets = categories.map(cat => ({
      label: cat,
      data: labels.map(d => (dateData[d] && dateData[d][cat]) || 0),
      borderColor: this.CATEGORY_COLORS[cat],
      fill: false,
      tension: 0.2
    }));
    new Chart(ctx, { type: 'line', data: { labels, datasets }, options: { responsive: true, maintainAspectRatio: false } });
    this.app.elements.statsContent.appendChild(card);
  }

  createPostureChartOptimized(postureCounts, totalSessions) {
    const card = document.createElement('div');
    card.className = 'stats-card';
    const title = document.createElement('h4');
    title.textContent = 'Posture Breakdown';
    card.appendChild(title);
    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const labels = Object.keys(postureCounts);
    const data = Object.values(postureCounts);
    new Chart(ctx, {
      type: 'pie',
      data: { labels, datasets: [{ data, backgroundColor: ['#0ea5e9','#10b981','#f59e0b','#64748b'] }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
    this.app.elements.statsContent.appendChild(card);
  }

  createTimeChartOptimized(durationsByDate) {
    const card = document.createElement('div');
    card.className = 'stats-card';
    const title = document.createElement('h4');
    title.textContent = 'Average Duration';
    card.appendChild(title);
    const canvas = document.createElement('canvas');
    card.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const labels = Object.keys(durationsByDate).sort((a, b) => new Date(a) - new Date(b));
    const avgDurations = labels.map(d => {
      const arr = durationsByDate[d] || [];
      return arr.length ? Math.round(arr.reduce((a,b)=>a+b,0)/arr.length) : 0;
    });
    new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Average Duration (minutes)', data: avgDurations, borderColor: '#4a5568', tension: 0.1 }] },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
    this.app.elements.statsContent.appendChild(card);
  }
}

