export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export async function requestWakeLock(app) {
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

export function releaseWakeLock(app) {
  if (app.state.timer.wakeLock) {
    app.state.timer.wakeLock.release();
    app.state.timer.wakeLock = null;
  }
}

