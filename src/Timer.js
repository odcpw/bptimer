import { formatTime, requestWakeLock } from './timerUtils.js';
import { TIMER_TICK_INTERVAL_MS, MS_PER_SECOND } from './constants.js';

/**
 * TimerController - Core timer functionality
 * 
 * Manages meditation timer state and operations including:
 * - Start/pause/resume/stop controls
 * - Time tracking and display updates
 * - Wake lock management to prevent screen sleep
 * - Integration with practice progression
 */
export default class TimerController {
  /**
   * Initialize timer controller
   * @param {Object} config - Configuration object
   * @param {Object} config.app - App instance reference
   * @param {Object} config.state - Timer state object
   * @param {Object} config.elements - DOM element references
   * @param {Function} config.onStart - Called when timer starts
   * @param {Function} config.onComplete - Called when timer completes
   */
  constructor({ app, state, elements, onStart, onComplete }) {
    // Validate constructor parameters
    if (!app || typeof app !== 'object') {
      throw new Error('TimerController: app instance is required');
    }
    if (!state || typeof state !== 'object') {
      throw new Error('TimerController: state object is required');
    }
    if (!elements || typeof elements !== 'object') {
      throw new Error('TimerController: elements object is required');
    }
    if (onStart && typeof onStart !== 'function') {
      throw new Error('TimerController: onStart must be a function');
    }
    if (onComplete && typeof onComplete !== 'function') {
      throw new Error('TimerController: onComplete must be a function');
    }
    
    this.app = app;
    this.state = state; // expects app.state.timer reference
    this.el = elements;
    this.onStart = onStart || (() => {});
    this.onComplete = onComplete || (() => {});
    this.intervalId = null;
  }

  /**
   * Update timer display with current elapsed time
   * Safely handles missing DOM elements
   */
  updateDisplay() {
    if (!this.el?.timerDisplay) return;
    this.el.timerDisplay.textContent = formatTime(this.state.elapsed);
  }

  /**
   * Start the meditation timer
   * Updates UI state and begins interval tracking
   */
  start() {
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.startTime = Date.now() - (this.state.elapsed * MS_PER_SECOND);

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
    // Timer tick - update elapsed time and check for completion
    // Uses high-precision timestamps to avoid timing drift over long sessions
    // Math.floor ensures consistent second-based updates regardless of browser timer precision
    this.intervalId = setInterval(() => {
      this.state.elapsed = Math.floor((Date.now() - this.state.startTime) / MS_PER_SECOND);
      this.updateDisplay();
      
      // Check for session completion - triggers bell sound and post-session modal
      if (this.state.elapsed >= this.state.duration) {
        this.onComplete();
      }
    }, TIMER_TICK_INTERVAL_MS);
  }

  /**
   * Pause the running timer
   * Maintains elapsed time for resume functionality
   */
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
    this.state.startTime = Date.now() - (this.state.elapsed * MS_PER_SECOND);
    if (this.el?.timerDisplay) this.el.timerDisplay.classList.add('running');
    if (this.el?.pauseBtn) {
      this.el.pauseBtn.textContent = 'Pause';
      this.el.pauseBtn.onclick = () => this.pause();
    }
    this.clearTick();
    // Timer tick - update elapsed time and check for completion
    // Uses high-precision timestamps to avoid timing drift over long sessions
    // Math.floor ensures consistent second-based updates regardless of browser timer precision
    this.intervalId = setInterval(() => {
      this.state.elapsed = Math.floor((Date.now() - this.state.startTime) / MS_PER_SECOND);
      this.updateDisplay();
      
      // Check for session completion - triggers bell sound and post-session modal
      if (this.state.elapsed >= this.state.duration) {
        this.onComplete();
      }
    }, TIMER_TICK_INTERVAL_MS);
  }

  /**
   * Stop the timer and prepare session data
   * Creates pending session for post-session recording
   */
  stop() {
    if (confirm('Stop current session?')) {
      this.onComplete();
    }
  }

  /**
   * Reset timer to initial state
   * Clears all timing data and updates UI
   */
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

