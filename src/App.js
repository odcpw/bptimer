/**
 * App.js - Main application orchestrator
 * 
 * Coordinates all modules and manages application state.
 * Handles initialization, navigation, and communication between components.
 * Acts as the central hub for the meditation timer application.
 * 
 * @module App
 */

import SMAManager from './SMAManager.js';
import SessionBuilder from './SessionBuilder.js';
import Stats from './Stats.js';
import { formatTime, requestWakeLock, releaseWakeLock } from './timerUtils.js';
import TimerController from './Timer.js';
import { openDB } from './db.js';
import { createCategoryElementFactory } from './utils.js';
import DataManager from './DataManager.js';
import UIManager, { showPracticeInfo } from './UIManager.js';
import { PRACTICE_CONFIG, POSTURES, getPracticeInfo, getCategoryForPractice } from './PracticeConfig.js';
import { 
    TIMER_DEFAULT_DURATION_SEC, 
    DEBOUNCE_SAVE_DELAY_MS, 
    DEBOUNCE_STATS_DELAY_MS,
    SPLASH_SCREEN_DURATION_MS,
    FADE_ANIMATION_MS,
    DURATION_INCREMENT_MIN,
    MIN_SESSION_DURATION_MIN,
    MAX_SESSION_DURATION_MIN,
    SECONDS_PER_MINUTE
} from './constants.js';

/**
 * Main application class that orchestrates all modules
 */
export default class MeditationTimerApp {
    constructor(config = {}) {
        /**
         * Application state divided into two main objects:
         * - timer: Active timer state including duration, elapsed time, practices
         * - app: General app state including view, favorites, database connection
         */
        this.state = {
            timer: {
                duration: TIMER_DEFAULT_DURATION_SEC,
                elapsed: 0,
                interval: null,
                isRunning: false,
                isPaused: false,
                selectedPractice: null,
                selectedPractices: [],
                currentPracticeIndex: 0,
                selectedPosture: 'Sitting',
                startTime: null,
                wakeLock: null,
                pendingSession: null,
                postSessionPractices: [],
                postSessionPosture: 'Sitting'
            },
            app: {
                currentView: 'timer',
                favorites: [],
                expandedCategories: new Set(),
                expandedSubcategories: new Set(),
                selectedPeriod: 'week',
                db: null,
                chartLoaded: false
            }
        };
        
        // Session builder instances for planning and post-session recording
        this.planningSessionBuilder = null;
        this.postSessionBuilder = null;
        
        // Cached DOM element references for performance
        this.elements = {};
        
        // Module instances
        this.dataManager = null;
        this.uiManager = null;
        this.timer = null;
        this.stats = null;
        this.smaManager = null;
        
        // Configuration
        this.practiceConfig = config.practiceConfig || PRACTICE_CONFIG;
        this.postures = config.postures || POSTURES;
        
        // Debounced functions to prevent excessive calls during rapid updates
        this.debouncedSaveState = this.debounce(this.saveState.bind(this), DEBOUNCE_SAVE_DELAY_MS);
        this.debouncedLoadStatistics = this.debounce(() => this.stats && this.stats.loadStatistics(), DEBOUNCE_STATS_DELAY_MS);
    }
    
    /**
     * Initialize the application
     * Sets up database, loads saved state, initializes UI, and registers service worker
     * Shows loading screen until all initialization is complete
     */
    async init() {
        try {
            // Initialize DOM elements first
            this.initializeElements();
            
            // Initialize database
            await this.initializeDatabase();
            
            // Initialize modules
            this.initializeModules();
            
            // Load saved state
            this.loadAppState();
            
            // Initialize UI components
            this.initializeUI();
            
            // Set up event listeners
            this.initializeEventListeners();
            
            // Load recent sessions
            await this.loadRecentSessions();
            
            // Preload bell sound
            this.preloadAudio();
            
            // Register service worker
            await this.registerServiceWorker();
            
            // Show splash screen for specified duration, then hide
            const minSplashTime = SPLASH_SCREEN_DURATION_MS;
            setTimeout(() => {
                this.hideLoadingScreen();
            }, minSplashTime);
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to initialize app. Please refresh.', 'error');
        }
    }
    
    /**
     * Initialize all module instances
     */
    initializeModules() {
        // Initialize UIManager first as other modules depend on it
        this.uiManager = new UIManager(this.elements);
        
        // Bind showToast to this instance for backward compatibility
        this.showToast = this.uiManager.showToast.bind(this.uiManager);
        
        // Initialize DataManager
        this.dataManager = new DataManager(
            this.state.app.db,
            this.showToast,
            null // Stats will be set after initialization
        );
        
        // Initialize Timer
        this.timer = new TimerController({
            el: this.elements,
            state: this.state.timer,
            onTick: this.updateDisplay.bind(this),
            onComplete: () => {
                this.playBellSound();
                this.showPostSessionModal();
            },
            wakeLock: this
        });
        
        // Initialize Stats
        this.stats = new Stats(
            this.state.app.db,
            this.elements,
            this.state.app,
            this.loadChartLibrary.bind(this),
            this.showToast
        );
        
        // Update DataManager with stats reference
        this.dataManager.stats = this.stats;
    }
    
    /**
     * Debounce utility - delays function execution until after wait milliseconds
     * have elapsed since the last time the debounced function was invoked
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    
    // Hide loading screen and show main content
    preloadAudio() {
        const bellSound = document.getElementById('bellSound');
        if (bellSound) {
            bellSound.load();
            bellSound.volume = 0.7;
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainContent = document.getElementById('main-content');
        
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'block';
            mainContent.offsetHeight; // Trigger reflow
            mainContent.style.opacity = '1';
        }, FADE_ANIMATION_MS);
    }
    
    // Initialize DOM element references
    initializeElements() {
        const elementIds = [
            'timerDisplay', 'customDuration', 'startBtn', 'pauseBtn', 'stopBtn',
            'decreaseBtn', 'increaseBtn', 'postureButtons', 'sessionInfo', 'currentPractice',
            'sessionPracticesList', 'recentSessionsList', 'timerView', 'statsView', 'smaView', 'aboutView',
            'favoritesList', 'selectedPractices', 'addPracticeBtn', 'practiceSelector', 'sessionName',
            'saveFavoriteBtn', 'statsContent', 'exportBtn', 'importBtn', 'resetBtn', 'importFile', 'postSessionModal',
            'postSessionSelected', 'postSessionPostures', 'postAddPracticeBtn', 'postPracticeSelector',
            'saveSessionBtn', 'saveTimeOnlyBtn', 'cancelSessionBtn', 'modalCloseBtn', 'togglePlannerBtn', 
            'sessionPlannerContent', 'toastContainer', 'smaList', 'addSmaBtn', 'smaModal', 'smaModalCloseBtn',
            'smaName', 'smaFrequency', 'smaTimesPerDay', 'smaNotifications', 'saveSmaBtn', 'cancelSmaBtn',
            'timesPerDayGroup', 'reminderWindowsGroup', 'smaWindowMorning', 'smaWindowMidday', 
            'smaWindowAfternoon', 'smaWindowEvening', 'practiceInfoModal', 'practiceInfoTitle',
            'practiceInfoContent', 'closePracticeInfoBtn', 'durationLabel'
        ];
        
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }
    
    // Initialize IndexedDB with better error handling
    async initializeDatabase() {
        const db = await openDB('MeditationTimerDB', 3);
        if (!db) {
            console.error('Failed to open database, falling back to localStorage');
            this.state.app.db = null;
        } else {
            this.state.app.db = db;
        }
    }
    
    // Load saved app state
    loadAppState() {
        // Load favorites
        this.state.app.favorites = this.dataManager.getFavorites();
        
        // Load saved duration
        this.state.timer.duration = this.dataManager.getLastDuration();
        
        // Load other app state
        const savedState = this.dataManager.loadAppState();
        if (savedState) {
            if (savedState.timer) {
                Object.assign(this.state.timer, savedState.timer);
            }
            if (savedState.app) {
                this.state.app.selectedPeriod = savedState.app.selectedPeriod || 'week';
            }
        }
    }
    
    /**
     * Initialize UI components including session builders and navigation
     * Creates planning and post-session SessionBuilder instances
     */
    initializeUI() {
        // Initialize SMA Manager
        this.smaManager = new SMAManager(
            this.state.app.db,
            this.elements,
            this.showToast
        );
        
        // Initialize session builders
        this.planningSessionBuilder = new SessionBuilder({
            practices: this.state.timer.selectedPractices,
            posture: this.state.timer.selectedPosture,
            practicesContainer: this.elements.selectedPractices,
            postureContainer: this.elements.postureButtons,
            practiceSelector: this.elements.practiceSelector,
            namespace: 'planning',
            onUpdate: () => {
                this.state.timer.selectedPractices = this.planningSessionBuilder.getPractices();
                this.state.timer.selectedPosture = this.planningSessionBuilder.getPosture();
                this.debouncedSaveState();
            },
            postures: this.postures,
            practiceConfig: this.practiceConfig,
            createCategoryElement: createCategoryElementFactory(getPracticeInfo, showPracticeInfo)
        });
        
        // Load saved session into planning builder
        if (this.state.timer.selectedPractices.length > 0) {
            this.planningSessionBuilder.loadSession(
                this.state.timer.selectedPractices,
                this.state.timer.selectedPosture
            );
        }
        
        // Initialize duration buttons
        this.initializeDurationButtons();
        
        // Initialize navigation tabs
        this.initializeNavigationTabs();
        
        // Load favorites
        this.loadFavorites();
    }
    
    // Initialize event listeners
    initializeEventListeners() {
        // Timer controls
        this.elements.startBtn?.addEventListener('click', () => this.timer.start());
        this.elements.pauseBtn?.addEventListener('click', () => this.timer.pause());
        this.elements.stopBtn?.addEventListener('click', () => {
            if (confirm('Stop current session?')) {
                this.timer.stop();
                this.showPostSessionModal();
            }
        });
        
        // Session planning
        this.elements.saveFavoriteBtn?.addEventListener('click', () => this.saveFavorite());
        this.elements.togglePlannerBtn?.addEventListener('click', () => this.toggleSessionPlanner());
        
        // Post-session modal
        this.elements.saveSessionBtn?.addEventListener('click', () => this.savePostSessionPractices());
        this.elements.saveTimeOnlyBtn?.addEventListener('click', () => this.saveTimeOnly());
        this.elements.cancelSessionBtn?.addEventListener('click', () => this.cancelPostSession());
        this.elements.modalCloseBtn?.addEventListener('click', () => this.cancelPostSession());
        
        // Data management
        this.elements.exportBtn?.addEventListener('click', () => this.exportData());
        this.elements.importBtn?.addEventListener('click', () => this.elements.importFile?.click());
        this.elements.importFile?.addEventListener('change', (e) => this.importData(e));
        this.elements.resetBtn?.addEventListener('click', () => this.resetAllData());
        
        // Period selection for statistics
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.state.app.selectedPeriod = e.target.dataset.period;
                this.debouncedLoadStatistics();
            });
        });
    }
    
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported');
            return;
        }
        
        if (window.location.protocol === 'file:') {
            console.log('Service worker not supported on file:// protocol');
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.register('./service-worker.js');
            console.log('ServiceWorker registered:', registration.scope);
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
        }
    }
    
    /**
     * Save current application state to localStorage
     * Persists timer settings and preferences between sessions
     */
    saveState() {
        const stateToSave = {
            timer: {
                duration: this.state.timer.duration,
                selectedPosture: this.state.timer.selectedPosture,
                selectedPractices: this.state.timer.selectedPractices
            },
            app: {
                selectedPeriod: this.state.app.selectedPeriod
            }
        };
        
        this.dataManager.saveAppState(stateToSave);
    }
    
    /**
     * Initialize duration adjustment buttons (+/- 5 minutes)
     * Updates display and saves duration preference
     */
    initializeDurationButtons() {
        this.setDuration(Math.floor(this.state.timer.duration / SECONDS_PER_MINUTE));
        
        this.elements.decreaseBtn?.addEventListener('click', () => {
            const currentMinutes = Math.floor(this.state.timer.duration / SECONDS_PER_MINUTE);
            const newMinutes = Math.max(MIN_SESSION_DURATION_MIN, currentMinutes - DURATION_INCREMENT_MIN);
            this.setDuration(newMinutes);
        });
        
        this.elements.increaseBtn?.addEventListener('click', () => {
            const currentMinutes = Math.floor(this.state.timer.duration / SECONDS_PER_MINUTE);
            const newMinutes = Math.min(MAX_SESSION_DURATION_MIN, currentMinutes + DURATION_INCREMENT_MIN);
            this.setDuration(newMinutes);
        });
    }
    
    setDuration(minutes) {
        this.state.timer.duration = minutes * SECONDS_PER_MINUTE;
        this.uiManager.updateDurationDisplay(minutes);
        this.dataManager.saveLastDuration(this.state.timer.duration);
        this.debouncedSaveState();
    }
    
    /**
     * Initialize navigation tabs for switching between views
     * Handles tab selection and content visibility
     */
    initializeNavigationTabs() {
        const tabs = document.querySelectorAll('.nav-tab');
        const views = {
            'timer-tab': this.elements.timerView,
            'stats-tab': this.elements.statsView,
            'sma-tab': this.elements.smaView,
            'about-tab': this.elements.aboutView
        };
        
        tabs.forEach(tab => {
            tab.addEventListener('click', async () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                Object.values(views).forEach(view => {
                    if (view) view.style.display = 'none';
                });
                
                const viewId = tab.id;
                if (views[viewId]) {
                    views[viewId].style.display = 'block';
                    
                    if (viewId === 'stats-tab' && this.stats) {
                        await this.loadChartLibrary();
                        await this.stats.loadStatistics();
                    } else if (viewId === 'sma-tab' && this.smaManager) {
                        await this.smaManager.loadSMAs();
                    }
                }
            });
        });
    }
    
    async loadChartLibrary() {
        if (this.state.app.chartLoaded) return;
        
        try {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    this.state.app.chartLoaded = true;
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (e) {
            this.showToast('Failed to load charts. Check your connection.', 'error');
        }
    }
    
    // UI update methods
    updateDisplay() { 
        if (this.timer) this.timer.updateDisplay(); 
    }
    
    playBellSound() {
        const bellSound = document.getElementById('bellSound');
        if (bellSound) {
            bellSound.currentTime = 0;
            bellSound.play().catch(error => {
                console.log('Bell sound play failed:', error);
            });
        }
    }
    
    resetTimer() { 
        if (this.timer) this.timer.reset(); 
    }
    
    /**
     * Update the session practices list display during active timer
     * Shows progress through planned practices with checkmarks
     */
    updateSessionPracticesList() {
        const practices = this.state.timer.selectedPractices;
        if (practices.length === 0) {
            this.elements.sessionPracticesList.style.display = 'none';
            return;
        }
        
        this.elements.sessionPracticesList.style.display = 'block';
        this.uiManager.clearElement(this.elements.sessionPracticesList);
        
        practices.forEach((practice, index) => {
            const item = document.createElement('div');
            item.className = 'session-practice-item';
            
            const check = document.createElement('span');
            check.className = 'practice-check';
            if (index <= this.state.timer.currentPracticeIndex) {
                check.classList.add('completed');
                check.textContent = '✓';
            }
            
            const name = document.createElement('span');
            name.className = 'practice-name';
            name.textContent = practice;
            
            item.appendChild(check);
            item.appendChild(name);
            this.elements.sessionPracticesList.appendChild(item);
        });
    }
    
    /**
     * Toggle session planner visibility
     * Expands/collapses the optional session planning section
     */
    toggleSessionPlanner() {
        const isExpanded = this.elements.togglePlannerBtn.classList.contains('expanded');
        this.elements.sessionPlannerContent.style.display = isExpanded ? 'none' : 'block';
        this.elements.togglePlannerBtn.classList.toggle('expanded', !isExpanded);
    }
    
    /**
     * Save current session configuration as a favorite
     * Validates that practices are selected before saving
     */
    saveFavorite() {
        const name = this.elements.sessionName.value.trim();
        const favorite = this.dataManager.saveFavorite(
            name,
            this.state.timer.selectedPractices,
            this.state.timer.duration,
            this.state.timer.selectedPosture
        );
        
        if (favorite) {
            this.elements.sessionName.value = '';
            this.loadFavorites();
        }
    }
    
    /**
     * Load and display saved favorite sessions
     * Shows empty message if no favorites exist
     */
    loadFavorites() {
        const favorites = this.dataManager.getFavorites();
        this.uiManager.updateFavoritesList(
            favorites,
            (id) => this.loadFavoriteSession(id),
            (id) => this.deleteFavorite(id)
        );
    }
    
    /**
     * Load a favorite session configuration
     * @param {number} id - Favorite session ID
     */
    loadFavoriteSession(id) {
        const favorite = this.dataManager.getFavorite(id);
        if (!favorite) return;
        
        this.state.timer.duration = favorite.duration;
        this.setDuration(Math.floor(favorite.duration / SECONDS_PER_MINUTE));
        
        if (this.planningSessionBuilder) {
            this.planningSessionBuilder.loadSession(favorite.practices, favorite.posture || 'Sitting');
        }
    }
    
    /**
     * Delete a favorite session with confirmation
     * @param {number} id - Favorite session ID to delete
     */
    deleteFavorite(id) {
        if (this.uiManager.confirm('Delete this favorite?')) {
            this.dataManager.deleteFavorite(id);
            this.loadFavorites();
        }
    }
    
    /**
     * Display post-session recording modal
     * Initializes SessionBuilder with planned practices as default
     */
    showPostSessionModal() {
        this.elements.postSessionModal.style.display = 'flex';
        
        const plannedPractices = this.state.timer.pendingSession.plannedPractices || [];
        const currentPosture = this.state.timer.selectedPosture || 'Sitting';
        
        this.postSessionBuilder = new SessionBuilder({
            practices: plannedPractices.length > 0 ? [...plannedPractices] : [],
            posture: currentPosture,
            practicesContainer: this.elements.postSessionSelected,
            postureContainer: this.elements.postSessionPostures,
            practiceSelector: this.elements.postPracticeSelector,
            namespace: 'postsession',
            onUpdate: () => {
                this.state.timer.postSessionPractices = this.postSessionBuilder.getPractices();
                this.state.timer.postSessionPosture = this.postSessionBuilder.getPosture();
            },
            postures: this.postures,
            practiceConfig: this.practiceConfig,
            createCategoryElement: createCategoryElementFactory(getPracticeInfo, showPracticeInfo)
        });
        
        this.state.timer.postSessionPractices = this.postSessionBuilder.getPractices();
        this.state.timer.postSessionPosture = this.postSessionBuilder.getPosture();
    }
    
    /**
     * Save session with user-recorded practices
     * Validates at least one practice is selected
     */
    async savePostSessionPractices() {
        if (this.state.timer.postSessionPractices.length === 0) {
            this.showToast('Please add at least one practice', 'error');
            return;
        }
        
        const session = {
            ...this.state.timer.pendingSession,
            practices: this.state.timer.postSessionPractices,
            posture: this.state.timer.postSessionPosture
        };
        
        await this.saveSession(session);
        
        this.elements.postSessionModal.style.display = 'none';
        this.timer.reset();
        releaseWakeLock(this);
        
        const duration = Math.floor(session.duration / SECONDS_PER_MINUTE);
        const practiceCount = this.state.timer.postSessionPractices.length;
        this.showToast(`Session saved: ${duration} minutes, ${practiceCount} practice${practiceCount > 1 ? 's' : ''}`, 'success');
    }
    
    async saveTimeOnly() {
        const session = {
            ...this.state.timer.pendingSession,
            practices: ['Unspecified'],
            posture: this.state.timer.postSessionPosture || 'Sitting'
        };
        
        await this.saveSession(session);
        
        this.elements.postSessionModal.style.display = 'none';
        this.timer.reset();
        releaseWakeLock(this);
        
        const duration = Math.floor(session.duration / SECONDS_PER_MINUTE);
        this.showToast(`Session time saved: ${duration} minutes`, 'success');
    }
    
    cancelPostSession() {
        if (this.uiManager.confirm('Cancel session? Your timer data will be lost.')) {
            this.elements.postSessionModal.style.display = 'none';
            this.timer.reset();
            releaseWakeLock(this);
        }
    }
    
    /**
     * Save completed session to IndexedDB or localStorage
     * Falls back to localStorage if IndexedDB fails
     * @param {Object} session - Session data to save
     */
    async saveSession(session) {
        await this.dataManager.saveSession(session);
        await this.loadRecentSessions();
    }
    
    /**
     * Load and display up to 5 most recent sessions
     * Shows "Today" for sessions from current date
     */
    async loadRecentSessions() {
        const sessions = this.dataManager.getRecentSessions();
        this.uiManager.updateRecentSessionsList(sessions);
    }
    
    /**
     * Clear all children from an element efficiently
     * @param {HTMLElement} element - Element to clear
     */
    clearElement(element) {
        this.uiManager.clearElement(element);
    }
    
    /**
     * Export all session data and favorites to JSON file
     * Creates timestamped backup file for download
     */
    async exportData() {
        await this.dataManager.exportData();
    }
    
    /**
     * Import session data from JSON backup file
     * Merges imported data with existing sessions and favorites
     * @param {Event} event - File input change event
     */
    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (this.uiManager.confirm('This will merge the imported data with your existing data. Continue?')) {
            const success = await this.dataManager.importData(file);
            if (success) {
                await this.loadRecentSessions();
                this.loadFavorites();
                if (this.stats) {
                    await this.stats.loadStatistics();
                }
            }
        }
        
        event.target.value = '';
    }

    /**
     * Reset all session data and statistics
     * Prompts user for confirmation before clearing IndexedDB and localStorage
     */
    async resetAllData() {
        const confirmed = this.uiManager.confirm(
            'This will permanently delete ALL your session data and statistics. ' +
            'Consider exporting your data first as a backup.\n\n' +
            'This action cannot be undone. Are you sure?'
        );
        
        if (!confirmed) return;
        
        const doubleConfirmed = this.uiManager.confirm(
            'Are you absolutely certain? This will delete everything and cannot be reversed.'
        );
        
        if (!doubleConfirmed) return;
        
        const success = await this.dataManager.resetAllData();
        if (success) {
            this.state.app.favorites = [];
            this.state.app.recentSessions = [];
            
            await this.loadRecentSessions();
            this.loadFavorites();
            if (this.stats) {
                await this.stats.loadStatistics();
            }
        }
    }
}