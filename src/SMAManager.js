/**
 * SMAManager.js - Special Mindfulness Activities management
 * 
 * Manages user-defined Special Mindfulness Activities (SMAs) - custom reminders
 * for practicing mindfulness during daily activities like "opening doors mindfully"
 * or "awareness when using water taps". Provides comprehensive CRUD operations
 * and integrates with push notifications for scheduled reminders.
 * 
 * Key responsibilities:
 * - Create, read, update, delete SMA records in IndexedDB
 * - Manage SMA modal interface for user interaction
 * - Handle frequency settings (monthly, weekly, daily, multiple per day)
 * - Configure notification scheduling and reminder time windows
 * - Coordinate with PushNotificationManager for delivery
 * - Validate user input and provide feedback via toast notifications
 * 
 * SMA Structure:
 * - name: User-defined activity description
 * - frequency: Reminder frequency (monthly/weekly/daily/multiple)
 * - timesPerDay: Number of reminders per day (for 'multiple' frequency)
 * - reminderWindows: Time periods for notifications (morning/midday/afternoon/evening)
 * - notificationsEnabled: Whether push notifications are active
 * 
 * @module SMAManager
 */

import PushNotificationManager from './PushNotificationManager.js';

export default class SMAManager {
  /**
   * Initialize SMA manager with database, UI elements, and notification system
   * @param {IDBDatabase} db - IndexedDB database instance
   * @param {Object} elements - DOM element references for SMA interface
   * @param {Function} showToast - Toast notification callback function
   */
  constructor(db, elements, showToast) {
    if (elements && typeof elements !== 'object') {
      throw new Error('SMAManager: elements must be an object');
    }
    if (typeof showToast !== 'function' && showToast !== null && showToast !== undefined) {
      throw new Error('SMAManager: showToast must be a function, null, or undefined');
    }
    this.db = db;
    this.elements = elements;
    this.showToast = showToast;
    this.smas = [];
    this.currentEditingSMA = null;

    // Initialize push notification manager
    this.pushManager = new PushNotificationManager(showToast);

    this.initializeEventListeners();
    this.loadSMAs();
  }

  /**
   * Set up event listeners for SMA interface interactions
   * Handles modal open/close, save/cancel actions, and form changes
   * @returns {void}
   */
  initializeEventListeners() {
    this.elements.addSmaBtn.addEventListener('click', () => this.showSMAModal());
    this.elements.smaModalCloseBtn.addEventListener('click', () => this.hideSMAModal());
    this.elements.cancelSmaBtn.addEventListener('click', () => this.hideSMAModal());
    this.elements.saveSmaBtn.addEventListener('click', () => this.saveSMA());
    this.elements.smaFrequency.addEventListener('change', () => this.updateFrequencyOptions());
    this.elements.smaModal.addEventListener('click', (e) => {
      if (e.target === this.elements.smaModal) {
        this.hideSMAModal();
      }
    });
  }

  /**
   * Load all SMA records from IndexedDB and update the display
   * Handles database errors gracefully and updates the UI list
   * @returns {Promise<void>}
   */
  async loadSMAs() {
    if (!this.db) {
      console.warn('Database not available, SMAs will not persist');
      this.smas = [];
      return;
    }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(['smas'], 'readonly');
        const store = transaction.objectStore('smas');
        const request = store.getAll();
        request.onsuccess = () => {
          this.smas = request.result || [];
          this.renderSMAList();
          resolve();
        };
        request.onerror = () => {
          console.error('Failed to load SMAs:', request.error);
          this.smas = [];
          reject(request.error);
        };
      } catch (error) {
        console.error('Error loading SMAs:', error);
        this.smas = [];
        reject(error);
      }
    });
  }

  /**
   * Render the complete list of SMAs in the UI
   * Shows empty state message if no SMAs exist
   * @returns {void}
   */
  renderSMAList() {
    const listContainer = this.elements.smaList;
    listContainer.innerHTML = '';
    if (this.smas.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-sma-message';
      emptyMessage.innerHTML = `
                <p>No Special Mindfulness Activities yet.</p>
                <p>Add activities like "Opening doors mindfully" or "Awareness of using water taps" to build awareness throughout your day.</p>
            `;
      listContainer.appendChild(emptyMessage);
      return;
    }
    this.smas.forEach(sma => {
      const smaItem = this.createSMAListItem(sma);
      listContainer.appendChild(smaItem);
    });
  }

  /**
   * Create a DOM element for displaying a single SMA in the list
   * Includes edit/delete buttons and formatted activity details
   * @param {Object} sma - SMA object with name, frequency, and notification settings
   * @returns {HTMLDivElement} Configured list item element
   */
  createSMAListItem(sma) {
    const item = document.createElement('div');
    item.className = 'sma-item';
    const frequencyText = this.getFrequencyText(sma);
    const notificationStatus = sma.notificationsEnabled ? 'ON' : 'OFF';
    item.innerHTML = `
            <div class="sma-content">
                <div class="sma-name">${this.escapeHtml(sma.name)}</div>
                <div class="sma-details">${frequencyText} • Notifications ${notificationStatus}</div>
            </div>
            <div class="sma-actions">
                <button class="sma-edit-btn" data-id="${sma.id}">Edit</button>
                <button class="sma-delete-btn" data-id="${sma.id}">Delete</button>
            </div>
        `;
    item.querySelector('.sma-edit-btn').addEventListener('click', () => this.editSMA(sma.id));
    item.querySelector('.sma-delete-btn').addEventListener('click', () => this.deleteSMA(sma.id));
    return item;
  }

  /**
   * Generate human-readable frequency description for SMA display
   * @param {Object} sma - SMA object with frequency settings
   * @param {string} sma.frequency - Frequency type (monthly/weekly/daily/multiple)
   * @param {number} sma.timesPerDay - Times per day for 'multiple' frequency
   * @returns {string} Formatted frequency text
   */
  getFrequencyText(sma) {
    switch (sma.frequency) {
      case 'monthly': return 'Monthly';
      case 'weekly': return 'Weekly';
      case 'daily': return 'Daily';
      case 'multiple': return `${sma.timesPerDay}x daily`;
      default: return sma.frequency;
    }
  }

  /**
   * Display the SMA creation/editing modal with optional pre-filled data
   * Configures form fields for new SMA creation or existing SMA editing
   * @param {Object|null} sma - Existing SMA object for editing, null for new SMA
   * @returns {void}
   */
  showSMAModal(sma = null) {
    this.currentEditingSMA = sma;
    this.elements.smaModalTitle = document.getElementById('smaModalTitle');
    this.elements.smaModalTitle.textContent = sma ? 'Edit Special Mindfulness Activity' : 'Add Special Mindfulness Activity';
    if (sma) {
      this.elements.smaName.value = sma.name;
      this.elements.smaFrequency.value = sma.frequency;
      this.elements.smaTimesPerDay.value = sma.timesPerDay || 3;
      this.elements.smaNotifications.checked = sma.notificationsEnabled;
      const windows = sma.reminderWindows || ['morning'];
      this.elements.smaWindowMorning.checked = windows.includes('morning');
      this.elements.smaWindowMidday.checked = windows.includes('midday');
      this.elements.smaWindowAfternoon.checked = windows.includes('afternoon');
      this.elements.smaWindowEvening.checked = windows.includes('evening');
    } else {
      this.elements.smaName.value = '';
      this.elements.smaFrequency.value = 'daily';
      this.elements.smaTimesPerDay.value = '3';
      this.elements.smaNotifications.checked = true;
      this.elements.smaWindowMorning.checked = true;
      this.elements.smaWindowMidday.checked = false;
      this.elements.smaWindowAfternoon.checked = false;
      this.elements.smaWindowEvening.checked = false;
    }
    this.updateFrequencyOptions();
    this.elements.smaModal.style.display = 'flex';
    this.elements.smaName.focus();
  }

  /**
   * Hide the SMA modal and reset editing state
   * @returns {void}
   */
  hideSMAModal() {
    this.elements.smaModal.style.display = 'none';
    this.currentEditingSMA = null;
  }

  /**
   * Update modal form visibility based on selected frequency option
   * Shows/hides times per day and reminder windows based on frequency
   * @returns {void}
   */
  updateFrequencyOptions() {
    const frequency = this.elements.smaFrequency.value;
    this.elements.timesPerDayGroup.style.display = frequency === 'multiple' ? 'block' : 'none';
    this.elements.reminderWindowsGroup.style.display = (frequency === 'daily' || frequency === 'multiple') ? 'block' : 'none';
  }

  /**
   * Save new or updated SMA to database with validation
   * Handles form data collection, validation, and database operations
   * Updates notification subscriptions after saving
   * @returns {Promise<void>}
   */
  async saveSMA() {
    if (!this.elements || !this.elements.smaName) {
      this.showToast && this.showToast('Form elements not available', 'error');
      return;
    }
    const name = this.elements.smaName.value.trim();
    const frequency = this.elements.smaFrequency.value;
    const timesPerDay = parseInt(this.elements.smaTimesPerDay.value);
    const notificationsEnabled = this.elements.smaNotifications.checked;
    
    // Enhanced validation
    if (!name || typeof name !== 'string') {
      this.showToast('Please enter a valid activity name', 'error'); 
      return; 
    }
    if (!['monthly', 'weekly', 'daily', 'multiple'].includes(frequency)) {
      this.showToast('Please select a valid frequency', 'error'); 
      return; 
    }
    if (frequency === 'multiple' && (isNaN(timesPerDay) || timesPerDay < 1 || timesPerDay > 24)) {
      this.showToast('Times per day must be between 1 and 24', 'error'); 
      return; 
    }
    const reminderWindows = [];
    if (frequency === 'daily' || frequency === 'multiple') {
      if (this.elements.smaWindowMorning.checked) reminderWindows.push('morning');
      if (this.elements.smaWindowMidday.checked) reminderWindows.push('midday');
      if (this.elements.smaWindowAfternoon.checked) reminderWindows.push('afternoon');
      if (this.elements.smaWindowEvening.checked) reminderWindows.push('evening');
    }
    if (!name) { this.showToast('Please enter an activity name', 'error'); return; }
    if (name.length > 100) { this.showToast('Activity name too long (max 100 characters)', 'error'); return; }
    const smaData = {
      name,
      frequency,
      timesPerDay: frequency === 'multiple' ? timesPerDay : undefined,
      reminderWindows,
      notificationsEnabled: Boolean(notificationsEnabled),
      updatedAt: new Date().toISOString()
    };
    if (this.currentEditingSMA) {
      smaData.id = this.currentEditingSMA.id;
      smaData.createdAt = this.currentEditingSMA.createdAt;
      await this.updateSMAInDB(smaData);
    } else {
      smaData.id = 'sma_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      smaData.createdAt = new Date().toISOString();
      await this.addSMAToDB(smaData);
    }
    await this.manageSubscriptionState();
    this.showToast(`SMA ${this.currentEditingSMA ? 'updated' : 'added'} successfully`, 'success');
  }

  /**
   * Manage push notification subscriptions based on SMA notification settings
   * Subscribes to notifications if any SMAs have notifications enabled
   * @returns {Promise<void>}
   */
  async manageSubscriptionState() {
    const smasWithNotifications = this.smas.filter(sma => sma.notificationsEnabled);
    if (smasWithNotifications.length > 0) {
      try {
        const success = await this.pushManager.requestPermissionAndSubscribe();
        if (success) await this.pushManager.updateSchedules(this.smas);
        else this.showToast('Failed to enable notifications', 'error');
      } catch (err) {
        console.error('Subscription management failed:', err);
        this.showToast('Failed to enable notifications', 'error');
      }
    } else {
      await this.pushManager.updateSchedules([]);
    }
  }

  /**
   * Check if browser notification permission is granted
   * @returns {boolean} True if notifications are supported and permitted
   */
  hasNotificationPermission() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Add new SMA record to IndexedDB
   * @param {Object} smaData - Complete SMA object to store
   * @returns {Promise<void>} Resolves when transaction completes
   */
  async addSMAToDB(smaData) {
    if (!this.db) { console.error('No database connection'); return; }
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(['smas'], 'readwrite');
        const store = transaction.objectStore('smas');
        store.add(smaData);
        transaction.oncomplete = () => resolve();
        transaction.onerror = (e) => reject(e.target?.error || e);
      } catch (error) { reject(error); }
    });
  }

  /**
   * Update existing SMA record in IndexedDB
   * @param {Object} smaData - SMA object with updated data
   * @returns {Promise<void>} Resolves when transaction completes
   */
  async updateSMAInDB(smaData) {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['smas'], 'readwrite');
      const store = transaction.objectStore('smas');
      store.put(smaData);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Open edit modal for specified SMA
   * @param {string} smaId - Unique identifier of SMA to edit
   * @returns {void}
   */
  editSMA(smaId) {
    if (!smaId || typeof smaId !== 'string') {
      console.error('editSMA: smaId must be a non-empty string');
      return;
    }
    const sma = this.smas.find(s => s.id === smaId);
    if (sma) this.showSMAModal(sma);
  }

  /**
   * Delete SMA after user confirmation
   * Removes from database and updates notification subscriptions
   * @param {string} smaId - Unique identifier of SMA to delete
   * @returns {Promise<void>}
   */
  async deleteSMA(smaId) {
    if (!smaId || typeof smaId !== 'string') {
      console.error('deleteSMA: smaId must be a non-empty string');
      return;
    }
    const sma = this.smas.find(s => s.id === smaId);
    if (!sma) return;
    if (confirm(`Delete "${sma.name}"?`)) {
      if (this.db) {
        try {
          const transaction = this.db.transaction(['smas'], 'readwrite');
          const store = transaction.objectStore('smas');
          await store.delete(smaId);
        } catch (error) {
          console.error('Failed to delete SMA:', error);
          this.showToast('Failed to delete SMA', 'error');
          return;
        }
      }
      await this.loadSMAs();
      await this.manageSubscriptionState();
      this.showToast('SMA deleted successfully', 'success');
    }
  }

  /**
   * Escape HTML characters in user input for safe display
   * Prevents XSS attacks in SMA name display
   * @param {string} text - Raw text input from user
   * @returns {string} HTML-escaped text safe for innerHTML
   */
  escapeHtml(text) {
    if (typeof text !== 'string') {
      return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

