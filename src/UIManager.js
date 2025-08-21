/**
 * UIManager.js - User interface utilities and modal management
 * 
 * Provides centralized UI management including toast notifications,
 * modal dialogs, and DOM manipulation utilities.
 * Handles all user-facing notifications and interactive overlays.
 * 
 * @module UIManager
 */

import { getPracticeInfo } from './PracticeConfig.js';

// Keeping PRACTICE_DESCRIPTIONS for backward compatibility
// This will be removed in a future update
const PRACTICE_DESCRIPTIONS = {
    'Walking Meditation': {
        title: 'Walking Meditation Instructions',
        content: `For the formal walking meditation sessions it is often better to limit the length of the walking track to 20-30 paces.

<strong>Special Hints on Walking Meditation:</strong>
• Sleepiness - walk quicker with broader Awareness<br>
• Restlessness, lots of thinking - walk slower, observing changes in sensations of feet and legs (close-up Awareness)<br>
• Anger and frustration - walk more gently and gracefully after observing the result of anger on walking (heavy footsteps)`
    },
    'Mindfulness & Investigation of Hindrances': {
        title: 'Mindfulness & Investigation of Hindrances',
        content: `<strong>Basic Approach to Hindrances</strong>
<strong>First Note the Hindrance:</strong> "Desire, Desire," "Aversion, Aversion," or more specifically, "Planning, Planning," "Remembering," etc. You may have to note it a few times. Try not to push it away, suppress or indulge it. If it disappears, observe its characteristic of impermanence, and then return to the breath or footsteps.

<strong>When Strong Attachment Persists</strong>
If you have a strong "attachment" and just noting does not help to let it go:

INVESTIGATE - Not in a thinking way or by building a story about it, but instead let the hindrance be the object of awareness as it is manifesting in the Body.

After first noting the hindrance, bring the attention to the Body. Observe the sensations of tension, tightness, etc. in the body when strong Aversion, Fear, Worry, Desire, etc. are present. Run the attention through the body, observing all parts of your body, observing areas that have reacted from the thoughts in the mind. Continue observing all areas of tension or uncomfortable sensation. The mind may gradually become interested in the body and become more objective, no longer "feeding" the hindrance or distracting thoughts. No longer feeding thoughts but observing their effect on the body. The Understanding of the unsatisfactoriness of attachment to the hindrance may arise and also Compassion for ourselves. When it passes, return to the breath, walking, etc.`
    },
    'Working with Physical Sensations': {
        title: 'Working with Unpleasant Physical Sensations',
        content: `• First try to treat it similar to wandering thoughts<br>
• When aversion develops toward it, then change your attention to the sensation itself<br>
• Soften your awareness around it. Observe its characteristics: size, shape, location, hot, cold, heavy, light, changes in intensity, etc. With an open mind, interested mind: "What is this thing that I normally call pain?"<br>
• When aversion, fear, worry develop strongly toward it, then change your attention to the aversion, fear, worry as they manifest in the body<br>
• Observe the physical reactions throughout the body: tensions, tightening or merely changes in body posture; hands, arms, stomach, chest, neck, face, everywhere. Note and feel the reactions, then try to relax<br>
• When aversions, etc. develop strongly and limits of concentration and energy have come, sit just a little more: one minute, 30 seconds, 10 breaths<br>
• Check sensation, decide if you still wish to move<br>
• Note to yourself, "I feel that I have worked as best I can at this time. Rather than build more and more aversion, I will change my posture and start again on the breathing."<br>
• When changing posture, continue to observe sensation<br>
• When sensation has faded away, start again on observing the breathing<br>
<strong>Keep in mind: Gently, gently</strong>`
    },
    'Four Foundations of Mindfulness': {
        title: 'The Four Foundations of Mindfulness (Satipattana Sutta)',
        content: `<strong>1. Mindfulness of the Body</strong>
• Breath<br>
• Postures<br>
• Activities<br>
• Body as a collection of parts - bones, hair, teeth, blood, etc.<br>
• Body manifesting in Four Elements - EARTH, WATER, WIND, FIRE - sensations in the body<br>
• Cemetery contemplation - "Verily my body is of the same nature: such it will become and cannot escape from it."

<strong>2. Mindfulness of Vedana (Feeling)</strong>
Awareness of a pleasant, unpleasant or neutral feeling arising in the mind due to the contact of the six senses with their object. Watching impermanence of feeling and trying not to react unwisely.

<strong>3. Mindfulness of States of Mind</strong>
Overall State of Mind through which we color our experience. BARE AWARENESS - watching impermanence.

<strong>4. Mindfulness of Mind Objects</strong>

<strong>A) Five Hindrances</strong>
Knowing: 1) When they are present; 2) When they are absent; 3) How they arise; 4) How to let go of them if they have arisen; 5) How they won't arise in the future.

<strong>B) Five Aggregates</strong> - the MIND/BODY as a process, arising and passing
1. Body<br>
2. Consciousness (knowing quality of mind arising when the senses come in contact with their objects)<br>
3. Vedana - feeling<br>
4. Perception - labeling process<br>
5. Mental formations - thoughts, emotions

<strong>C) Seven Factors of Enlightenment</strong>
1. Mindfulness<br>
2. Investigation of Mental Objects<br>
3. Energy<br>
4. Joy<br>
5. Tranquillity<br>
6. Concentration<br>
7. Equanimity<br>
To know: a) when they are present; b) when they are absent; c) how they can arise; d) how to develop them.

<strong>D) Four Noble Truths</strong>
1. Existence of Unsatisfactoriness<br>
2. Cause - ignorance, unwise reaction and craving<br>
3. Fading away - developing WISDOM, giving up unwise reaction and craving<br>
4. How to do it - the Path - methods of Mental Development`
    }
};

/**
 * UIManager class handles all UI utilities and modal management
 */
export default class UIManager {
    /**
     * Initialize UIManager with DOM element references
     * @param {Object} elements - Object containing DOM element references
     */
    constructor(elements) {
        this.elements = elements;
        this.activeToasts = [];
    }

    /**
     * Display toast notifications to user
     * @param {string} message - Message to display
     * @param {string} type - Notification type: 'info', 'success', 'error'
     * @param {Function} onClick - Optional click handler
     */
    showToast(message, type = 'info', onClick = null) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        if (onClick) {
            toast.style.cursor = 'pointer';
            toast.addEventListener('click', onClick);
        }
        
        this.elements.toastContainer.appendChild(toast);
        this.activeToasts.push(toast);
        
        // Auto-dismiss toast after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
                const index = this.activeToasts.indexOf(toast);
                if (index > -1) {
                    this.activeToasts.splice(index, 1);
                }
            }, 300);
        }, 5000);
    }

    /**
     * Clear all active toast notifications
     */
    clearToasts() {
        this.activeToasts.forEach(toast => toast.remove());
        this.activeToasts = [];
    }

    /**
     * Show practice information modal
     * @param {string} practiceName - Name of practice to show info for
     */
    showPracticeInfo(practiceName) {
        // First try to get info from PRACTICE_CONFIG
        let info = getPracticeInfo(practiceName);
        
        // Fall back to PRACTICE_DESCRIPTIONS for backward compatibility
        if (!info) {
            info = PRACTICE_DESCRIPTIONS[practiceName];
        }
        
        if (!info) return;
        
        const modal = this.elements.practiceInfoModal || document.getElementById('practiceInfoModal');
        const titleEl = this.elements.practiceInfoTitle || document.getElementById('practiceInfoTitle');
        const contentEl = this.elements.practiceInfoContent || document.getElementById('practiceInfoContent');
        
        titleEl.textContent = info.title;
        
        // Convert plain text newlines to HTML for display
        let htmlContent = info.content;
        // Only convert to HTML if it doesn't already contain HTML tags
        if (!htmlContent.includes('<') && !htmlContent.includes('>')) {
            htmlContent = htmlContent.replace(/\n/g, '<br>');
        }
        
        // Use innerHTML only for trusted content with HTML markup
        contentEl.innerHTML = htmlContent;
        
        modal.style.display = 'flex';
        
        // Set up modal close button handler
        const closeBtn = this.elements.closePracticeInfoBtn || document.getElementById('closePracticeInfoBtn');
        const closeHandler = () => {
            modal.style.display = 'none';
            closeBtn.removeEventListener('click', closeHandler);
            modal.removeEventListener('click', backdropHandler);
        };
        
        // Close modal when clicking outside content
        const backdropHandler = (e) => {
            if (e.target === modal) {
                closeHandler();
            }
        };
        
        closeBtn.addEventListener('click', closeHandler);
        modal.addEventListener('click', backdropHandler);
        
        // Close modal on Escape key press
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeHandler();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Show modal dialog
     * @param {string} modalId - ID of modal element
     * @param {Object} options - Modal options
     */
    showModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'flex';
        
        if (options.onClose) {
            const closeHandler = () => {
                modal.style.display = 'none';
                options.onClose();
            };
            
            // Setup close handlers
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.onclick = closeHandler;
            }
            
            // Close on backdrop click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    closeHandler();
                }
            };
        }
    }

    /**
     * Hide modal dialog
     * @param {string} modalId - ID of modal element
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Clear all children from an element efficiently
     * @param {HTMLElement} element - Element to clear
     */
    clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    /**
     * Update favorites list display
     * @param {Array} favorites - Array of favorite sessions
     * @param {Function} onLoad - Callback for loading a favorite
     * @param {Function} onDelete - Callback for deleting a favorite
     */
    updateFavoritesList(favorites, onLoad, onDelete) {
        const fragment = document.createDocumentFragment();
        
        if (favorites.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'No favorite sessions';
            fragment.appendChild(emptyMsg);
        } else {
            favorites.forEach(favorite => {
                const item = document.createElement('div');
                item.className = 'favorite-item';
                
                const content = document.createElement('div');
                content.style.cursor = 'pointer';
                content.onclick = () => onLoad(favorite.id);
                
                const name = document.createElement('div');
                name.className = 'favorite-name';
                name.textContent = favorite.name;
                
                const practices = document.createElement('div');
                practices.className = 'favorite-practices';
                practices.textContent = favorite.practices.join(', ');
                
                content.appendChild(name);
                content.appendChild(practices);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'favorite-delete';
                deleteBtn.textContent = '×';
                deleteBtn.onclick = () => onDelete(favorite.id);
                
                item.appendChild(content);
                item.appendChild(deleteBtn);
                fragment.appendChild(item);
            });
        }
        
        this.clearElement(this.elements.favoritesList);
        this.elements.favoritesList.appendChild(fragment);
    }

    /**
     * Update recent sessions display
     * @param {Array} sessions - Array of recent sessions
     */
    updateRecentSessionsList(sessions) {
        const fragment = document.createDocumentFragment();
        
        if (sessions.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'No recent sessions';
            fragment.appendChild(emptyMsg);
        } else {
            const today = new Date().toDateString();
            const displayCount = Math.min(sessions.length, 5);
            
            for (let i = 0; i < displayCount; i++) {
                const session = sessions[i];
                const sessionDate = new Date(session.date);
                const isToday = sessionDate.toDateString() === today;
                
                const item = document.createElement('div');
                item.className = 'recent-session';
                
                const practices = document.createElement('div');
                practices.className = 'recent-session-practices';
                practices.textContent = session.practices.join(', ');
                
                const meta = document.createElement('div');
                meta.className = 'recent-session-meta';
                const dateText = isToday ? 'Today' : sessionDate.toLocaleDateString();
                const duration = Math.floor(session.duration / 60);
                meta.textContent = `${dateText} • ${duration} min • ${session.posture}`;
                
                item.appendChild(practices);
                item.appendChild(meta);
                fragment.appendChild(item);
            }
        }
        
        this.clearElement(this.elements.recentSessionsList);
        this.elements.recentSessionsList.appendChild(fragment);
    }

    /**
     * Show confirmation dialog
     * @param {string} message - Confirmation message
     * @returns {boolean} User's confirmation response
     */
    confirm(message) {
        return confirm(message);
    }

    /**
     * Update duration display
     * @param {number} minutes - Duration in minutes
     */
    updateDurationDisplay(minutes) {
        if (this.elements.durationLabel) {
            this.elements.durationLabel.textContent = `${minutes} min`;
        }
    }

    /**
     * Toggle element visibility
     * @param {HTMLElement} element - Element to toggle
     * @param {boolean} show - Whether to show or hide
     */
    toggleElement(element, show) {
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Add CSS class to element
     * @param {HTMLElement} element - Target element
     * @param {string} className - CSS class to add
     */
    addClass(element, className) {
        if (element) {
            element.classList.add(className);
        }
    }

    /**
     * Remove CSS class from element
     * @param {HTMLElement} element - Target element
     * @param {string} className - CSS class to remove
     */
    removeClass(element, className) {
        if (element) {
            element.classList.remove(className);
        }
    }

    /**
     * Toggle CSS class on element
     * @param {HTMLElement} element - Target element
     * @param {string} className - CSS class to toggle
     * @param {boolean} force - Force add/remove
     */
    toggleClass(element, className, force) {
        if (element) {
            element.classList.toggle(className, force);
        }
    }
}

// Export the showPracticeInfo function for backward compatibility
export function showPracticeInfo(practiceName) {
    // This is a standalone version for use without UIManager instance
    let info = getPracticeInfo(practiceName);
    
    if (!info) {
        info = PRACTICE_DESCRIPTIONS[practiceName];
    }
    
    if (!info) return;
    
    const modal = document.getElementById('practiceInfoModal');
    const titleEl = document.getElementById('practiceInfoTitle');
    const contentEl = document.getElementById('practiceInfoContent');
    
    titleEl.textContent = info.title;
    
    let htmlContent = info.content;
    if (!htmlContent.includes('<') && !htmlContent.includes('>')) {
        htmlContent = htmlContent.replace(/\n/g, '<br>');
    }
    
    contentEl.innerHTML = htmlContent;
    modal.style.display = 'flex';
    
    const closeBtn = document.getElementById('closePracticeInfoBtn');
    const closeHandler = () => {
        modal.style.display = 'none';
        closeBtn.removeEventListener('click', closeHandler);
        modal.removeEventListener('click', backdropHandler);
    };
    
    const backdropHandler = (e) => {
        if (e.target === modal) {
            closeHandler();
        }
    };
    
    closeBtn.addEventListener('click', closeHandler);
    modal.addEventListener('click', backdropHandler);
    
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeHandler();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}