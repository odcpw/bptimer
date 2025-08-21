Refactor Plan: Modularize PWA (Phase 1) - COMPLETED ✅

Goals
- Preserve all current behavior during refactor.
- Split by responsibility with a shallow src/ (no deep nesting).
- Keep PWA offline support intact (service worker caching).
- Prepare seams for Capacitor later (local notifications, packaging).

Target Structure (Phase 1+2)
- src/PushNotificationManager.js
- src/SMAManager.js
- src/SessionBuilder.js
- src/Stats.js
- src/db.js
- src/timerUtils.js

Completed Steps
1) Module entry (script.js as ES module)
   - index.html now loads script.js with type="module".
2) Extract PushNotificationManager
   - Moved to src/PushNotificationManager.js; imports updated.
3) Extract SMAManager
   - Moved to src/SMAManager.js; imports updated; behavior unchanged.
4) Extract SessionBuilder
   - Moved to src/SessionBuilder.js; dependencies injected (postures, practiceConfig, createCategoryElement).
5) Extract Stats
   - Moved all statistics logic to src/Stats.js (loading, processing, charts, session queries).
   - App now instantiates Stats and calls stats.loadStatistics() via debounced wrapper.
6) Extract timer helpers
   - Added src/timerUtils.js (formatTime, request/release wake lock) and updated App to use them.
7) Service worker updates
   - Added new src/ files to STATIC_ASSETS and bumped CACHE_VERSION (now 13) to preserve offline.
8) Cleanup
   - Removed legacy/commented stats blocks from script.js.

Next Steps (All Completed ✅)
10) Optional: Extract Timer controller ✅
   - Created src/Timer.js for start/pause/resume/stop and related UI updates; App orchestrator remains thin.
11) Storage helpers adoption ✅
   - Replaced direct IndexedDB calls with src/db.js helpers (openDB imported and used).
12) Final sweep ✅
   - No "moved" comments found, no dead code detected, offline functionality verified.

Final Status Summary
✅ All Phase 1 refactoring tasks completed successfully:
- 8 modules extracted to src/ directory
- 53% reduction in main script.js file size (3627 → 1698 lines)
- Zero functionality loss - all features preserved
- Clean separation of concerns achieved
- Service worker updated with all module paths (v15)
- Code properly organized with dependency injection
- No dead code or "moved" comments remaining
- Offline functionality verified

Module Structure:
- src/PushNotificationManager.js (116 lines) - Push notifications
- src/SMAManager.js (260 lines) - Special Mindfulness Activities
- src/SessionBuilder.js (286 lines) - Unified session building UI
- src/Stats.js (252 lines) - Statistics and charts
- src/Timer.js (109 lines) - Timer core logic
- src/db.js (78 lines) - IndexedDB helpers
- src/timerUtils.js (28 lines) - Timer utilities
- src/utils.js (169 lines) - UI rendering helpers

## Phase 1.5: Further Modularization - COMPLETED ✅

Successfully extracted main script.js into focused modules:
- **script.js**: Reduced from 1698 to 27 lines (98% reduction!) - Now just entry point
- **src/App.js** (763 lines): Main application orchestrator
- **src/PracticeConfig.js** (206 lines): All practice configuration and metadata
- **src/DataManager.js** (314 lines): Data persistence, import/export, favorites
- **src/UIManager.js** (469 lines): UI utilities, modals, toast notifications

Benefits achieved:
- Much better separation of concerns
- Easier to find and modify specific functionality
- Better for LLM processing (smaller focused files)
- Improved testability
- Cleaner architecture

Ready for Next Phases:
- Phase 2: Documentation & Code Quality Improvements (see details below)
- Phase 3: Capacitor integration for native app packaging
- Phase 4: Add unit tests for modules

## Phase 2: Documentation & Code Quality Improvements

### Priority 1: Add Comprehensive JSDoc Documentation (HIGH)
All public methods should have JSDoc comments with @param and @returns:
```javascript
/**
 * Updates the timer display with formatted elapsed time
 * Safely handles missing DOM elements
 * @returns {void}
 */
updateDisplay() {
    if (!this.el?.timerDisplay) return;
    this.el.timerDisplay.textContent = formatTime(this.state.elapsed);
}
```

Files needing JSDoc improvements:
- src/Timer.js - Add JSDoc to all public methods (start, pause, stop, reset, updateDisplay)
- src/Stats.js - Document complex data processing methods
- src/SessionBuilder.js - Document drag/drop handlers and public API
- src/SMAManager.js - Document CRUD operations
- script.js - Document main app methods

### Priority 2: Replace Magic Numbers with Named Constants (MEDIUM)
Create constants file or add to top of relevant modules:
```javascript
// src/constants.js
export const TIMER_TICK_INTERVAL_MS = 1000;
export const WAKE_LOCK_TIMEOUT_MS = 15000;
export const DATABASE_VERSION = 3;
export const MAX_SESSION_DURATION_MIN = 120;
export const MIN_SESSION_DURATION_MIN = 5;
export const DURATION_INCREMENT_MIN = 5;
export const NOTIFICATION_RETRY_DELAY_MS = 120000;
```

### Priority 3: Add Input Validation (MEDIUM)
Add validation for user inputs and external data:
```javascript
// Example for timer utilities
formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds < 0) {
        return '00:00';
    }
    const mins = Math.floor(seconds / 60);
    // ...
}
```

Files needing validation:
- src/timerUtils.js - Validate time inputs
- src/SessionBuilder.js - Validate practice names and postures
- src/SMAManager.js - Validate SMA data before saving
- src/Stats.js - Validate session data before processing

### Priority 4: Add "Why" Comments for Complex Logic (LOW)
Add explanatory comments for business logic:
```javascript
// Build reverse lookup map for O(1) practice->category mapping
// This avoids nested loops when determining practice categories
// Used extensively by Stats for categorizing sessions
buildPracticeCategoryMap() {
    // Implementation
}
```

### Priority 5: Further Modularization of script.js (MEDIUM)
Current script.js (1698 lines) could be split into:

1. **src/App.js** - Main application orchestrator (~400 lines)
   - Initialize app
   - Coordinate between modules
   - Handle navigation

2. **src/PracticeConfig.js** - Practice configuration (~200 lines)
   - PRACTICE_CONFIG object
   - CATEGORY_COLORS
   - POSTURES array
   - Practice-related utilities

3. **src/DataManager.js** - Data persistence layer (~300 lines)
   - Import/export functionality
   - Favorites management
   - Recent sessions handling
   - LocalStorage operations

4. **src/UIManager.js** - UI utilities and modals (~300 lines)
   - Toast notifications
   - Modal management
   - Practice info display
   - DOM element caching

5. **Keep in script.js** - Just initialization (~100 lines)
   - DOM ready handler
   - App instantiation
   - Service worker registration

Benefits of further extraction:
- Easier to test individual components
- Better code reusability
- Clearer separation of concerns
- Smaller files are easier for LLMs to process
- Reduced cognitive load when working on specific features

Example structure after extraction:
```
script.js (100 lines) - Entry point only
src/
  App.js (400 lines) - Main orchestrator
  PracticeConfig.js (200 lines) - Configuration
  DataManager.js (300 lines) - Data operations
  UIManager.js (300 lines) - UI helpers
  ... (existing modules)
```

### Priority 6: Add File-Level Documentation (HIGH)
Each module should have a header explaining its purpose:
```javascript
/**
 * Timer.js - Core timer functionality
 * 
 * Manages meditation timer state and operations including:
 * - Start/pause/resume/stop controls
 * - Time tracking and display updates
 * - Wake lock management to prevent screen sleep
 * - Integration with practice progression
 * 
 * @module Timer
 */
```

### Testing & Quality Checklist
- [ ] All functions have JSDoc comments
- [ ] No magic numbers in code
- [ ] Input validation on all user-facing functions
- [ ] Complex logic has explanatory comments
- [ ] File headers explain module purpose
- [ ] Named constants for configuration values
- [ ] Error handling follows consistent patterns
