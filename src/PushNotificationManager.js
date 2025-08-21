/**
 * PushNotificationManager.js - Push notification management for meditation reminders
 * 
 * Handles browser push notification permissions, subscriptions, and scheduling
 * for Special Mindfulness Activities (SMAs). Communicates with a Cloudflare Worker
 * service to manage notification delivery across different frequencies and time windows.
 * 
 * Key responsibilities:
 * - Request and manage browser push notification permissions
 * - Subscribe to push notification service with VAPID authentication
 * - Generate notification schedules based on practice frequency settings
 * - Coordinate with remote worker service for notification delivery
 * - Handle user identification and session persistence
 * 
 * @module PushNotificationManager
 */
export default class PushNotificationManager {
  /**
   * Initialize push notification manager
   * @param {Function} showToast - Toast notification callback function
   */
  constructor(showToast) {
    if (typeof showToast !== 'function' && showToast !== null && showToast !== undefined) {
      throw new Error('showToast must be a function, null, or undefined');
    }
    this.showToast = showToast;
    this.workerUrl = 'https://bptimer-sma-worker.mail-12b.workers.dev';
    this.vapidPublicKey = 'BPYlMr-dC9cqX8W-tMBShBbus2vWmOdb6cRNVsJ5i4Kp1S9dBl7epLvM19e_apKRsarJGfgBhiRgiTlMLQ7bbFk';
    this.userId = this.generateUserId();
  }

  /**
   * Request browser notification permission and subscribe to push service
   * Handles the complete subscription flow including permission requests,
   * service worker registration, and server subscription registration
   * @returns {Promise<boolean>} True if subscription successful, false otherwise
   */
  async requestPermissionAndSubscribe() {
    try {
      if (!('Notification' in window)) throw new Error('Notifications not supported in this browser');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notification permission denied');
      if (!('serviceWorker' in navigator)) throw new Error('Service workers not supported');

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
      }

      const response = await fetch(`${this.workerUrl}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId: this.userId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });
      if (!response.ok) throw new Error(`Subscription failed: ${response.status}`);
      this.showToast && this.showToast('Push notifications enabled successfully', 'success');
      return true;
    } catch (err) {
      console.error('Push notification setup failed:', err);
      this.showToast && this.showToast(`Push notification setup failed: ${err.message}`, 'error');
      return false;
    }
  }

  /**
   * Update notification schedules for enabled SMAs with remote worker service
   * Filters SMAs with notifications enabled and sends schedule data to worker
   * @param {Array<Object>} smas - Array of SMA objects with notification settings
   * @returns {Promise<void>}
   */
  async updateSchedules(smas) {
    if (!Array.isArray(smas)) {
      console.error('updateSchedules: smas must be an array');
      return;
    }
    const schedules = smas
      .filter(sma => sma && typeof sma === 'object' && sma.notificationsEnabled)
      .map(sma => ({
        smaId: sma.id,
        frequency: sma.frequency,
        times: this.generateNotificationTimes(sma),
        dayOfWeek: sma.dayOfWeek || 1,
        timesPerDay: sma.timesPerDay,
        reminderWindows: sma.reminderWindows || ['morning', 'midday', 'afternoon', 'evening']
      }));

    try {
      const res = await fetch(`${this.workerUrl}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, schedules })
      });
      if (!res.ok) throw new Error(`Schedule update failed: ${res.status}`);
      console.log('Notification schedules updated');
    } catch (e) {
      console.error('Failed to update schedules:', e);
      this.showToast && this.showToast('Failed to update notification schedules', 'error');
    }
  }

  /**
   * Generate notification times based on SMA frequency and time window preferences
   * Creates time strings for different reminder frequencies with randomization
   * @param {Object} sma - SMA object with frequency and reminder window settings
   * @param {string} sma.frequency - Frequency type (monthly/weekly/daily/multiple)
   * @param {Array<string>} sma.reminderWindows - Preferred time windows
   * @param {number} sma.timesPerDay - Number of notifications per day (for 'multiple')
   * @returns {Array<string>} Array of time strings in HH:MM format, sorted
   */
  generateNotificationTimes(sma) {
    if (!sma || typeof sma !== 'object') {
      console.error('generateNotificationTimes: sma must be an object');
      return [];
    }
    if (typeof sma.frequency !== 'string') {
      console.error('generateNotificationTimes: sma.frequency must be a string');
      return [];
    }
    const times = [];
    // Time window strategy: Balance user convenience with notification effectiveness
    // Windows align with natural daily rhythm and avoid sleep/meal times
    // 4-hour windows provide enough spread to avoid notification clustering
    const timeWindows = {
      morning: { start: 6, end: 10 },   // Early morning mindfulness, before work rush
      midday: { start: 10, end: 14 },   // Mid-morning to early afternoon
      afternoon: { start: 14, end: 18 }, // Post-lunch to early evening
      evening: { start: 18, end: 22 }   // Evening wind-down, before sleep prep
    };
    switch (sma.frequency) {
      case 'monthly': times.push('09:00'); break;
      case 'weekly': times.push('10:00'); break;
      case 'daily': times.push('09:00'); break;
      case 'multiple': {
        // Smart distribution algorithm for multiple daily reminders
        // Ensures notifications are spread across selected time windows
        // Uses modulo cycling to handle more notifications than windows
        const selected = sma.reminderWindows?.length ? sma.reminderWindows : ['morning','midday','afternoon','evening'];
        const tpd = sma.timesPerDay || 3;
        for (let i = 0; i < tpd; i++) {
          const windowKey = selected[i % selected.length]; // Cycle through windows
          const w = timeWindows[windowKey];
          // Randomization prevents habituation - different times keep practice fresh
          // Random hour within window, random minute for natural unpredictability
          const hour = w.start + Math.floor(Math.random() * (w.end - w.start));
          const minute = Math.floor(Math.random() * 60);
          times.push(`${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`);
        }
        break;
      }
    }
    return times.sort();
  }

  /**
   * Generate or retrieve persistent user ID for notification subscription
   * Creates unique ID if not present, stores in localStorage for persistence
   * @returns {string} Unique user identifier
   */
  generateUserId() {
    let userId = localStorage.getItem('sma-user-id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('sma-user-id', userId);
    }
    return userId;
  }

  /**
   * Convert URL-safe base64 string to Uint8Array for VAPID key usage
   * Handles padding and character replacement for push subscription
   * @param {string} base64String - URL-safe base64 encoded string
   * @returns {Uint8Array} Converted byte array for VAPID authentication
   */
  urlBase64ToUint8Array(base64String) {
    if (typeof base64String !== 'string') {
      throw new Error('urlBase64ToUint8Array: base64String must be a string');
    }
    if (base64String.length === 0) {
      throw new Error('urlBase64ToUint8Array: base64String cannot be empty');
    }
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }
}

