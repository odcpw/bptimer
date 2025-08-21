/**
 * BPtimer - Balanced Practice Timer Progressive Web App
 * 
 * Entry point for the meditation timer application.
 * Initializes the main app module when DOM content is loaded.
 * 
 * @module script
 */
'use strict';

import MeditationTimerApp from './src/App.js';
import { PRACTICE_CONFIG, POSTURES } from './src/PracticeConfig.js';

/**
 * Initialize application when DOM content is loaded
 * Creates app instance and makes it globally available for debugging
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new MeditationTimerApp({
        practiceConfig: PRACTICE_CONFIG,
        postures: POSTURES
    });
    
    app.init();
    
    // Expose app instance to window for debugging purposes
    window.meditationApp = app;
});