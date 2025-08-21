import PushNotificationManager from './PushNotificationManager.js';

export default class SMAManager {
  constructor(db, elements, showToast) {
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

  getFrequencyText(sma) {
    switch (sma.frequency) {
      case 'monthly': return 'Monthly';
      case 'weekly': return 'Weekly';
      case 'daily': return 'Daily';
      case 'multiple': return `${sma.timesPerDay}x daily`;
      default: return sma.frequency;
    }
  }

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

  hideSMAModal() {
    this.elements.smaModal.style.display = 'none';
    this.currentEditingSMA = null;
  }

  updateFrequencyOptions() {
    const frequency = this.elements.smaFrequency.value;
    this.elements.timesPerDayGroup.style.display = frequency === 'multiple' ? 'block' : 'none';
    this.elements.reminderWindowsGroup.style.display = (frequency === 'daily' || frequency === 'multiple') ? 'block' : 'none';
  }

  async saveSMA() {
    const name = this.elements.smaName.value.trim();
    const frequency = this.elements.smaFrequency.value;
    const timesPerDay = parseInt(this.elements.smaTimesPerDay.value);
    const notificationsEnabled = this.elements.smaNotifications.checked;
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

  hasNotificationPermission() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

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

  editSMA(smaId) {
    const sma = this.smas.find(s => s.id === smaId);
    if (sma) this.showSMAModal(sma);
  }

  async deleteSMA(smaId) {
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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

