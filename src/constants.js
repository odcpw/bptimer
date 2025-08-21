/**
 * constants.js - Application constants and configuration values
 * 
 * Centralized location for all magic numbers and configuration constants
 * used throughout the application. This improves maintainability and
 * makes the codebase more readable and LLM-friendly.
 * 
 * @module constants
 */

// Timer constants
export const TIMER_TICK_INTERVAL_MS = 1000;
export const TIMER_DEFAULT_DURATION_SEC = 1800; // 30 minutes
export const DEBOUNCE_SAVE_DELAY_MS = 1000;
export const DEBOUNCE_STATS_DELAY_MS = 300;

// UI constants  
export const TOAST_DURATION_MS = 5000;
export const TOAST_FADE_DURATION_MS = 300;
export const SPLASH_SCREEN_DURATION_MS = 3000;

// Storage constants
export const DATABASE_VERSION = 3;
export const MAX_STORED_SESSIONS = 1000;
export const MAX_RECENT_SESSIONS = 10;

// Duration constraints (in minutes)
export const MIN_SESSION_DURATION_MIN = 5;
export const MAX_SESSION_DURATION_MIN = 120;
export const DURATION_INCREMENT_MIN = 5;

// Wake lock timeout
export const WAKE_LOCK_TIMEOUT_MS = 15000;

// Animation durations
export const FADE_ANIMATION_MS = 300;

// Conversion constants
export const SECONDS_PER_MINUTE = 60;
export const MS_PER_SECOND = 1000;