export default class PushNotificationManager {
  constructor(showToast) {
    this.showToast = showToast;
    this.workerUrl = 'https://bptimer-sma-worker.mail-12b.workers.dev';
    this.vapidPublicKey = 'BPYlMr-dC9cqX8W-tMBShBbus2vWmOdb6cRNVsJ5i4Kp1S9dBl7epLvM19e_apKRsarJGfgBhiRgiTlMLQ7bbFk';
    this.userId = this.generateUserId();
  }

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

  async updateSchedules(smas) {
    const schedules = smas
      .filter(sma => sma.notificationsEnabled)
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

  generateNotificationTimes(sma) {
    const times = [];
    const timeWindows = {
      morning: { start: 6, end: 10 },
      midday: { start: 10, end: 14 },
      afternoon: { start: 14, end: 18 },
      evening: { start: 18, end: 22 }
    };
    switch (sma.frequency) {
      case 'monthly': times.push('09:00'); break;
      case 'weekly': times.push('10:00'); break;
      case 'daily': times.push('09:00'); break;
      case 'multiple': {
        const selected = sma.reminderWindows?.length ? sma.reminderWindows : ['morning','midday','afternoon','evening'];
        const tpd = sma.timesPerDay || 3;
        for (let i = 0; i < tpd; i++) {
          const windowKey = selected[i % selected.length];
          const w = timeWindows[windowKey];
          const hour = w.start + Math.floor(Math.random() * (w.end - w.start));
          const minute = Math.floor(Math.random() * 60);
          times.push(`${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}`);
        }
        break;
      }
    }
    return times.sort();
  }

  generateUserId() {
    let userId = localStorage.getItem('sma-user-id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('sma-user-id', userId);
    }
    return userId;
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }
}

