/**
 * DataManager.js - Data persistence and management operations
 * 
 * Handles all data operations including session management, favorites,
 * import/export functionality, and local storage operations.
 * Provides a centralized interface for data persistence across the app.
 * 
 * @module DataManager
 */

import { add, clear } from './db.js';

/**
 * DataManager class handles all data persistence operations
 * Manages sessions, favorites, and import/export functionality
 */
export default class DataManager {
    /**
     * Initialize DataManager with database and UI references
     * @param {IDBDatabase} db - IndexedDB database instance
     * @param {Function} showToast - Toast notification function
     * @param {Object} stats - Statistics module reference
     */
    constructor(db, showToast, stats) {
        this.db = db;
        this.showToast = showToast;
        this.stats = stats;
        this.favorites = this.loadFavoritesFromStorage();
    }

    /**
     * Load favorites from localStorage
     * @returns {Array} Array of favorite session configurations
     */
    loadFavoritesFromStorage() {
        try {
            return JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch (error) {
            console.error('Failed to load favorites:', error);
            return [];
        }
    }

    /**
     * Save current session configuration as a favorite
     * @param {string} name - Name for the favorite session
     * @param {Array} practices - List of practices
     * @param {number} duration - Session duration in seconds
     * @param {string} posture - Meditation posture
     * @returns {Object|null} Created favorite object or null if failed
     */
    saveFavorite(name, practices, duration, posture) {
        if (!practices || practices.length === 0) {
            this.showToast('Please add practices first', 'error');
            return null;
        }

        const favorite = {
            id: Date.now(),
            name: name || `Session ${new Date().toLocaleDateString()}`,
            practices: [...practices],
            duration: duration,
            posture: posture
        };

        this.favorites.push(favorite);
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        
        this.showToast('Saved as favorite!', 'success');
        return favorite;
    }

    /**
     * Get all saved favorites
     * @returns {Array} Array of favorite sessions
     */
    getFavorites() {
        return this.favorites;
    }

    /**
     * Get a specific favorite by ID
     * @param {number} id - Favorite ID
     * @returns {Object|undefined} Favorite object or undefined
     */
    getFavorite(id) {
        return this.favorites.find(f => f.id === id);
    }

    /**
     * Delete a favorite session
     * @param {number} id - Favorite ID to delete
     * @returns {boolean} True if deleted, false otherwise
     */
    deleteFavorite(id) {
        const initialLength = this.favorites.length;
        this.favorites = this.favorites.filter(f => f.id !== id);
        
        if (this.favorites.length < initialLength) {
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            return true;
        }
        return false;
    }

    /**
     * Save completed session to IndexedDB or localStorage
     * @param {Object} session - Session data to save
     * @returns {Promise<void>}
     */
    async saveSession(session) {
        if (this.db) {
            try {
                await add(this.db, 'sessions', session);
            } catch (error) {
                console.error('Failed to save to IndexedDB:', error);
                this.saveSessionToLocalStorage(session);
            }
        } else {
            this.saveSessionToLocalStorage(session);
        }
        
        // Maintain list of last 10 sessions for quick access
        const recentSessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
        recentSessions.unshift(session);
        if (recentSessions.length > 10) {
            recentSessions.pop();
        }
        localStorage.setItem('recentSessions', JSON.stringify(recentSessions));
    }

    /**
     * Save session to localStorage as fallback storage
     * Maintains maximum of 1000 sessions to avoid storage quota issues
     * @param {Object} session - Session data to save
     */
    saveSessionToLocalStorage(session) {
        const sessions = JSON.parse(localStorage.getItem('allSessions') || '[]');
        sessions.push(session);
        // Prevent localStorage quota exceeded errors
        if (sessions.length > 1000) {
            sessions.shift();
        }
        localStorage.setItem('allSessions', JSON.stringify(sessions));
    }

    /**
     * Get recent sessions from localStorage
     * @returns {Array} Array of recent sessions (max 10)
     */
    getRecentSessions() {
        return JSON.parse(localStorage.getItem('recentSessions') || '[]');
    }

    /**
     * Retrieve all sessions from storage
     * @returns {Promise<Array>} All session records
     */
    async getAllSessions() {
        if (this.db && this.stats) {
            return await this.stats.getSessionsFromIndexedDB(new Date(0));
        } else {
            return JSON.parse(localStorage.getItem('allSessions') || '[]');
        }
    }

    /**
     * Export all session data and favorites to JSON file
     * Creates timestamped backup file for download
     * @returns {Promise<void>}
     */
    async exportData() {
        try {
            const sessions = await this.getAllSessions();
            const data = {
                version: 2,
                exportDate: new Date().toISOString(),
                sessions: sessions,
                favorites: this.favorites
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meditation-timer-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Failed to export data', 'error');
        }
    }

    /**
     * Import session data from JSON backup file
     * Merges imported data with existing sessions and favorites
     * @param {File} file - File to import
     * @returns {Promise<boolean>} True if import successful
     */
    async importData(file) {
        if (!file) return false;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.version || !data.sessions) {
                throw new Error('Invalid backup file');
            }
            
            // Add imported sessions to database
            if (this.db) {
                for (const session of data.sessions) {
                    await add(this.db, 'sessions', session);
                }
            } else {
                // Merge imported sessions with existing localStorage data
                const existingSessions = JSON.parse(localStorage.getItem('allSessions') || '[]');
                const merged = [...existingSessions, ...data.sessions];
                localStorage.setItem('allSessions', JSON.stringify(merged));
            }
            
            // Merge imported favorites, avoiding duplicates by name
            if (data.favorites) {
                const existingFavorites = new Set(this.favorites.map(f => f.name));
                const newFavorites = data.favorites.filter(f => !existingFavorites.has(f.name));
                this.favorites = [...this.favorites, ...newFavorites];
                localStorage.setItem('favorites', JSON.stringify(this.favorites));
            }
            
            this.showToast('Data imported successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            this.showToast('Error importing data: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Reset all session data and statistics
     * Clears IndexedDB and localStorage after double confirmation
     * @returns {Promise<boolean>} True if reset successful
     */
    async resetAllData() {
        try {
            // Clear IndexedDB session data
            if (this.db) {
                await clear(this.db, 'sessions');
            }
            
            // Clear localStorage data
            localStorage.removeItem('favorites');
            localStorage.removeItem('recentSessions');
            localStorage.removeItem('allSessions');
            localStorage.removeItem('timerDuration');
            localStorage.removeItem('appState');
            
            // Reset internal state
            this.favorites = [];
            
            this.showToast('All data has been reset successfully.', 'success');
            return true;
        } catch (error) {
            console.error('Reset failed:', error);
            this.showToast('Error resetting data: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Save app state to localStorage
     * @param {Object} state - State object to save
     */
    saveAppState(state) {
        try {
            localStorage.setItem('appState', JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save app state:', error);
        }
    }

    /**
     * Load app state from localStorage
     * @returns {Object|null} Saved app state or null
     */
    loadAppState() {
        try {
            return JSON.parse(localStorage.getItem('appState') || 'null');
        } catch (error) {
            console.error('Failed to load app state:', error);
            return null;
        }
    }

    /**
     * Save last used duration
     * @param {number} duration - Duration in seconds
     */
    saveLastDuration(duration) {
        localStorage.setItem('lastDuration', duration.toString());
    }

    /**
     * Get last used duration
     * @returns {number} Duration in seconds (default 1800 = 30 minutes)
     */
    getLastDuration() {
        const saved = localStorage.getItem('lastDuration');
        return saved ? parseInt(saved, 10) : 1800;
    }
}