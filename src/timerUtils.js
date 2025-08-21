/**
 * Format time in seconds to MM:SS display format
 * @param {number} seconds - Time in seconds to format
 * @returns {string} Formatted time string (MM:SS)
 */
export function formatTime(seconds) {
  // Validate input - must be a non-negative number
  if (typeof seconds !== 'number' || seconds < 0 || !isFinite(seconds)) {
    return '00:00';
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Request wake lock to keep screen on during meditation
 * @param {Object} app - App instance with timer state
 * @returns {Promise<void>}
 */
export async function requestWakeLock(app) {
  // Validate app object and required properties
  if (!app || !app.state || !app.state.timer) {
    console.warn('Invalid app object provided to requestWakeLock');
    return;
  }
  
  if ('wakeLock' in navigator) {
    try {
      app.state.timer.wakeLock = await navigator.wakeLock.request('screen');
      app.state.timer.wakeLock.addEventListener('release', () => {
        if (app.state.timer.isRunning && !document.hidden) {
          requestWakeLock(app);
        }
      });
    } catch (err) {
      console.log('Wake lock failed:', err);
    }
  }
}

/**
 * Release wake lock to allow screen to sleep
 * @param {Object} app - App instance with timer state
 */
export function releaseWakeLock(app) {
  // Validate app object and required properties
  if (!app || !app.state || !app.state.timer) {
    console.warn('Invalid app object provided to releaseWakeLock');
    return;
  }
  
  if (app.state.timer.wakeLock) {
    app.state.timer.wakeLock.release();
    app.state.timer.wakeLock = null;
  }
}

