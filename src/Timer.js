import { formatTime, requestWakeLock } from './timerUtils.js';

export default class TimerController {
  constructor({ app, state, elements, onStart, onComplete }) {
    this.app = app;
    this.state = state; // expects app.state.timer reference
    this.el = elements;
    this.onStart = onStart || (() => {});
    this.onComplete = onComplete || (() => {});
    this.intervalId = null;
  }

  updateDisplay() {
    if (!this.el?.timerDisplay) return;
    this.el.timerDisplay.textContent = formatTime(this.state.elapsed);
  }

  start() {
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.startTime = Date.now() - (this.state.elapsed * 1000);

    // UI updates
    if (this.el?.startBtn) this.el.startBtn.style.display = 'none';
    if (this.el?.pauseBtn) this.el.pauseBtn.style.display = 'inline-block';
    if (this.el?.stopBtn) this.el.stopBtn.style.display = 'inline-block';
    if (this.el?.sessionInfo) this.el.sessionInfo.style.display = 'block';
    if (this.el?.timerDisplay) this.el.timerDisplay.classList.add('running');

    // Allow app to update practice UI
    this.onStart();

    // Wake lock
    requestWakeLock(this.app);

    // Tick
    this.clearTick();
    this.intervalId = setInterval(() => {
      this.state.elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
      this.updateDisplay();
      if (this.state.elapsed >= this.state.duration) {
        this.onComplete();
      }
    }, 1000);
  }

  pause() {
    this.state.isPaused = true;
    this.state.isRunning = false;
    this.clearTick();
    if (this.el?.timerDisplay) this.el.timerDisplay.classList.remove('running');
    if (this.el?.pauseBtn) {
      this.el.pauseBtn.textContent = 'Resume';
      this.el.pauseBtn.onclick = () => this.resume();
    }
  }

  resume() {
    this.state.isPaused = false;
    this.state.isRunning = true;
    this.state.startTime = Date.now() - (this.state.elapsed * 1000);
    if (this.el?.timerDisplay) this.el.timerDisplay.classList.add('running');
    if (this.el?.pauseBtn) {
      this.el.pauseBtn.textContent = 'Pause';
      this.el.pauseBtn.onclick = () => this.pause();
    }
    this.clearTick();
    this.intervalId = setInterval(() => {
      this.state.elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
      this.updateDisplay();
      if (this.state.elapsed >= this.state.duration) {
        this.onComplete();
      }
    }, 1000);
  }

  stop() {
    if (confirm('Stop current session?')) {
      this.onComplete();
    }
  }

  reset() {
    this.state.elapsed = 0;
    this.state.isRunning = false;
    this.state.isPaused = false;
    this.state.startTime = null;
    this.state.currentPracticeIndex = 0;
    this.state.selectedPractices = [];
    if (this.el?.timerDisplay) this.el.timerDisplay.classList.remove('running');
    this.updateDisplay();
    if (this.el?.startBtn) this.el.startBtn.style.display = 'inline-block';
    if (this.el?.pauseBtn) this.el.pauseBtn.style.display = 'none';
    if (this.el?.stopBtn) this.el.stopBtn.style.display = 'none';
    if (this.el?.sessionInfo) this.el.sessionInfo.style.display = 'none';
    if (this.el?.pauseBtn) {
      this.el.pauseBtn.textContent = 'Pause';
      this.el.pauseBtn.onclick = () => this.pause();
    }
  }

  clearTick() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

