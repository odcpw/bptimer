/**
 * BPtimer - Balanced Practice Timer Progressive Web App
 * 
 * Main application file that implements a meditation timer with session tracking,
 * practice selection, statistics visualization, and offline support.
 * Designed to help practitioners maintain a balanced meditation/mental development practice.
 * Uses vanilla JavaScript with no framework dependencies.
 */
'use strict';

/**
 * PRACTICE_CONFIG - Central configuration object for all meditation practices
 * Structure: categoryKey -> { name, practices: { practiceName -> null or {info: string} } }
 * This object defines the entire practice hierarchy shown in the UI
 * Info text provides detailed instructions for practices where available
 */
const PRACTICE_CONFIG = {
    mindfulness: {
        name: 'Mindfulness',
        practices: {
            'Walking Meditation': {
                info: 'For formal walking meditation, limit the track to 20-30 paces. Sleepiness: walk quicker with broader awareness. Restlessness: walk slower, observing sensations closely. Anger: walk gently, observing the effect on footsteps.'
            },
            'Mindfulness & Investigation of Hindrances': {
                info: 'First note the hindrance (e.g., "Desire, Desire"). If it persists, investigate by observing its manifestation in the body - tension, tightness, etc. Observe without feeding the hindrance until it passes.'
            },
            'Working with Physical Sensations': {
                info: 'First treat like wandering thoughts. If aversion develops, observe the sensation\'s characteristics. When aversion is strong, observe its physical manifestations throughout the body. Work gently within your limits.'
            },
            'Four Foundations of Mindfulness': {
                info: 'The Satipatthana Sutta framework: 1) Body (breath, postures, activities, elements), 2) Feelings (pleasant/unpleasant/neutral), 3) States of Mind, 4) Mind Objects (hindrances, aggregates, enlightenment factors, noble truths).'
            }
        }
    },
    compassion: {
        name: 'Compassion/Lovingkindness',
        practices: {
            'Basic Practice': {
                info: 'May [person] be able to learn and develop methods of mental development to cope with life\'s challenges. May they find Peace of Mind.'
            },
            'Forgiveness Meditation': {
                info: 'Systematic practice for self-forgiveness and forgiving others. Analyze past actions objectively, understanding the causes, then forgive with phrases like "I forgive the person I was."'
            },
            'Going Through Your Life': {
                info: 'Systematic life review: Start young, go through home, school, activities year by year until today. Give yourself and others compassion wishes at each stage.'
            },
            'Diffusing/Defusing (D/D)': {
                info: 'Take an unpleasant emotion, universalize it by considering others who experience it intensely. Develop compassion for all beings experiencing this suffering.'
            },
            'By Age': {
                info: 'Choose a particular age in your life, give compassion to yourself at that age, then universalize to others of the same age doing similar activities.'
            },
            '1-10-11-1 Exercise': {
                info: 'Visualize: 1 person with similar difficulties, then 10 people, then all 11 including yourself, then just yourself. Develop compassion at each stage.'
            },
            'Going to Bed Sequence': {
                info: 'Progressive circles: yourself, closest person, all beings met today, a group from your past, a group from the world, all beings.'
            },
            'Waking Up Practice': {
                info: 'Identify with real situations of others waking up as different people, universalizing the experience and developing compassion.'
            },
            'Groups by Countries': {
                info: 'Systematically go through groups of countries, then humanity as a whole, then self as part of humanity, then self.'
            },
            'Everyday Life Activities': {
                info: 'Before eating: consider beings that suffered for your food. Before cleaning: wish lovingkindness to any beings that may be harmed.'
            },
            'Material Objects Reflection': {
                info: 'Reflect on an object\'s dependent arising nature. Trace to origin, consider beings that suffered to make it. Develop compassion for all.'
            },
            'Classify by Body Types': {
                info: 'Systematic classification: no legs, 1 leg, 2 legs, etc., beings with wings, in ocean, unseen beings. Compassion for all.'
            }
        }
    },
    sympatheticJoy: {
        name: 'Sympathetic Joy',
        practices: {
            'Basic Practice': {
                info: 'In times of discouragement, may they remember their good qualities. Take joy in their gradual awakening and inner potential.'
            },
            'Remembering Good Qualities': {
                info: 'May they feel happiness within and continue making good decisions. When failing, may they remember when their resolutions were strong.'
            }
        }
    },
    equanimity: {
        name: 'Equanimity',
        practices: {
            'Basic Practice': {
                info: 'Reflect that everything that comes is the result of preceding causes. They are the owner of their kamma. This understanding brings equanimity.'
            },
            'Kamma Reflection': {
                info: 'They will receive the results of their own kamma. I may not have the power to change this. Understanding this brings equanimity.'
            }
        }
    },
    wiseReflection: {
        name: 'Wise Reflection',
        practices: {
            'Five Daily Recollections': {
                info: 'Traditional contemplations: 1) I am of the nature to decay, 2) to be diseased, 3) to die, 4) All dear will change and vanish, 5) I am the owner of my kamma.'
            },
            'Seven Reflections': {
                info: '1) How fortunate I am, 2) Death, 3) Actions and Results, 4) Dukkha, 5) Impermanence, 6) No problems only challenges, 7) Compassion and Equanimity.'
            },
            'Death Reflection': {
                info: 'Think of someone who died. Picture them alive, then remember they are gone. Apply this awareness to yourself: you too will die one day.'
            },
            'Food Reflection': {
                info: 'Three contemplations during meals: 1) Why do you eat? 2) How fortunate you are, 3) Difficulties in getting food to you.'
            },
            'Ten Paramis': {
                info: 'Self-assessment of spiritual perfections: Generosity, Morality, Renunciation, Wisdom, Energy, Patience, Truthfulness, Determination, Lovingkindness, Equanimity.'
            },
            'Noble Eightfold Path': {
                info: 'The path to liberation: Right Understanding, Intention, Speech, Action, Livelihood, Effort, Mindfulness, and Concentration.'
            },
            'Four Great Efforts': {
                info: '1) Prevent unbeneficial qualities from arising, 2) Let go of those that arose, 3) Develop beneficial qualities, 4) Maintain those that arose.'
            },
            'Eight Worldly Dhammas': {
                info: 'Reflect on attachment to four pairs: Praise/Blame, Fame/Obscurity, Gain/Loss, Pleasure/Pain. See how attachment creates suffering.'
            },
            'Origination and Dissolution': {
                info: 'Contemplate objects and body: trace to source, break into four elements, observe impermanence. Nothing can ultimately be "yours".'
            },
            'Transformative Attitude': {
                info: 'Four principles: 1) No problems only challenges, 2) Good luck bad luck who knows?, 3) What can I learn?, 4) Change everything into the path.'
            },
            'Alavaka\'s Questions': {
                info: 'Buddha\'s answers: Confidence is best wealth, well-practiced Dhamma brings happiness, truth is sweetest, living with wisdom is noblest.'
            },
            'Four Assurances': {
                info: 'From Kalama Sutta: Four benefits of a purified mind regarding afterlife, this life, karma, and purification regardless of beliefs.'
            },
            'Dedication of Merit': {
                info: 'May what I have done to purify my mind be of help to benefit all beings. End each day or session with this dedication.'
            },
            'Dedication of Direction': {
                info: 'Rededicate intention to develop the Paramis to be of the most possible benefit to myself and all beings.'
            }
        }
    }
};

/**
 * CATEGORY_COLORS - Color scheme for practice categories
 * Used consistently across all chart visualizations
 */
const CATEGORY_COLORS = {
    mindfulness: '#06b6d4',      // Cyan/teal
    compassion: '#ec4899',       // Pink
    sympatheticJoy: '#f59e0b',   // Amber/gold
    equanimity: '#8b5cf6',       // Purple
    wiseReflection: '#10b981'    // Emerald green
};

/**
 * Practice category lookup map for O(1) performance
 * Built once on initialization from PRACTICE_CONFIG
 * Maps practice name -> category key
 */
const PRACTICE_CATEGORY_MAP = new Map();

/**
 * Build reverse lookup map for practice categories
 * Called once on initialization for O(1) lookups
 */
function buildPracticeCategoryMap() {
    for (const [categoryKey, category] of Object.entries(PRACTICE_CONFIG)) {
        // Map direct practices
        for (const practiceName of Object.keys(category.practices)) {
            PRACTICE_CATEGORY_MAP.set(practiceName, categoryKey);
            
            // Map subcategory practices
            const subcategories = category.practices[practiceName];
            if (subcategories && typeof subcategories === 'object') {
                for (const options of Object.values(subcategories)) {
                    if (Array.isArray(options)) {
                        options.forEach(option => PRACTICE_CATEGORY_MAP.set(option, categoryKey));
                    }
                }
            }
        }
    }
}

// Build the map immediately
buildPracticeCategoryMap();

/**
 * Get the category for a given practice name
 * Uses pre-built map for O(1) lookup performance
 * @param {string} practiceName - Name of the practice
 * @returns {string} Category key (mindfulness, compassion, etc.)
 */
function getCategoryForPractice(practiceName) {
    return PRACTICE_CATEGORY_MAP.get(practiceName) || 'wiseReflection';
}

/**
 * PRACTICE_DESCRIPTIONS - Detailed information for each practice
 * Maps practice names to objects containing title and HTML content
 * Content is displayed in info modals when users click the info button
 */
const PRACTICE_DESCRIPTIONS = {
    // Mindfulness practices
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
    },
    
    // Compassion/Lovingkindness practices
    'Basic Practice': {
        title: 'Compassion/Lovingkindness Basic Practice',
        content: `<strong>Version 1:</strong>
"May _____ be able to learn, practice and develop methods, techniques and tools of mental development, so that _____ can cope with, understand, accept and overcome the difficulties and challenges of life. May _____ find Peace of Mind."

<strong>Version 2:</strong>
"May _____ be able to let go of anger, fear, worry and ignorance. May _____ also have patience, courage, wisdom and determination to meet and overcome difficulties and problems, challenges of life. May _____ find Peace of Mind."`
    },
    'Diffusing/Defusing (D/D)': {
        title: 'Diffusing/Defusing Technique',
        content: `Take an existing unpleasant emotion for contemplation. Open to the Dukkha. Universalize it by opening to vivid examples of humans or other living beings who may experience these emotions intensely.

<strong>Part 1:</strong> Start with yourself, then someone same age/sex, then same age/opposite sex, then add/subtract 10 years continuing until all ages covered.

<strong>Part 2:</strong> Use your age/sex. Consider many people but imagine their Dukkha getting more intense.

<strong>Purpose:</strong> Shows we're not alone, helps see our Dukkha in perspective, aids letting go of attachment to suffering.`
    },
    'Going Through Your Life': {
        title: 'Life Review Meditation',
        content: `<strong>Systematic Process:</strong>
• Start as young as you can remember at home with family - give C/L wish to self and family<br>
• Then at school/kindergarten - give C/L wish to self, teacher and students<br>
• Then outside activities - give C/L wish to self and others<br>
• Continue year by year through home, school/work, outside activities until today

This practice helps develop compassion by reviewing your life experiences and extending lovingkindness to all people you've encountered.`
    },
    'Forgiveness Meditation': {
        title: 'Forgiveness Practice',
        content: `<strong>Self-Forgiveness:</strong>
• Delve into memories you don't want to remember - to learn and forgive yourself<br>
• Let memories arise naturally, stop the frame and analyze:<br>
  - What were your beliefs? What were you doing it for?<br>
  - Were you clouded, swept by greed/hatred/ignorance?<br>
  - Is that person you were the same as today?<br>
• "I forgive the person I was. May I find my way out of darkness to liberation."

<strong>Forgiving Others:</strong>
• Analyze why they acted as they did<br>
• Were they temporarily blinded by defilements?<br>
• "I forgive you. May you find your way out of darkness to liberation."`
    },
    '1-10-11-1 Exercise': {
        title: '"1-10-11-1" Compassion/Lovingkindness Exercise',
        content: `<strong>Visualization Process:</strong>
<strong>1. One person:</strong> Meet someone your age and sex with similar difficulties who is very sad and upset - develop compassion for them<br>
<strong>2. Ten people:</strong> Join a group of ten people, all with similar problems, all sad and upset - develop compassion for the group<br>
<strong>3. Eleven people:</strong> View all 11 people (including yourself) as a group with similar difficulties - develop compassion for all<br>
<strong>4. One person (yourself):</strong> Return to just yourself, a human being with difficulties - develop self-compassion<br>

This exercise helps develop both compassion for others and self-compassion by progressively expanding and contracting your circle of compassion.`
    },
    
    // Sympathetic Joy
    'Basic Practice': {
        title: 'Sympathetic Joy Meditation',
        content: `<strong>Sympathetic Joy Wish (Rosemary's phrasing):</strong>
"In times of discouragement, may _____ be able to remember their good qualities. Take Joy with them, in the gradual awakening and their inner potential. Feeling Joy in the teachings, may it give them a refuge, giving them confidence and energy to continue."

<strong>Alternative Sympathetic Joy Wish:</strong>
"May _____ feel happiness within and be able to continue in this way. May _____ be able to make more good decisions in my/their life. And, at moments, if _____ fail in some of them, may _____ remember the times when my/their resolutions were strong. May this make _____ happy so I/they can then try again to succeed in my/their resolutions. This would bring more happiness and joy."`
    },
    'Remembering Good Qualities': {
        title: 'Sympathetic Joy Practice',
        content: `<strong>Sympathetic Joy Wish (Rosemary's phrasing):</strong>
"In times of discouragement, may _____ be able to remember their good qualities. Take Joy with them, in the gradual awakening and their inner potential. Feeling Joy in the teachings, may it give them a refuge, giving them confidence and energy to continue."

<strong>Alternative Sympathetic Joy Wish:</strong>
"May _____ feel happiness within and be able to continue in this way. May _____ be able to make more good decisions in my/their life. And, at moments, if _____ fail in some of them, may _____ remember the times when my/their resolutions were strong. May this make _____ happy so I/they can then try again to succeed in my/their resolutions. This would bring more happiness and joy."`
    },
    
    // Equanimity
    'Basic Practice': {
        title: 'Equanimity Meditation',
        content: `<strong>Importance:</strong> Equanimity is so important within Buddhist teachings that it is not only one of the Four Brahma Viharas, but it is also included in:
• The Ten Paramis<br>
• The Seven Factors of Enlightenment

<strong>Equanimity Reflection:</strong>
"Now please reflect that everything that comes to _____ is the result of causes that have preceded it. _____ is the owner of their own Kamma. May this understanding help give me more Equanimity, realizing that they will receive the results of their own Kamma, and I may not have the power to change this."`
    },
    'Kamma Reflection': {
        title: 'Equanimity Reflection',
        content: `<strong>Importance:</strong> Equanimity is so important within Buddhist teachings that it is not only one of the Four Brahma Viharas, but it is also included in:
• The Ten Paramis<br>
• The Seven Factors of Enlightenment

<strong>Equanimity Reflection:</strong>
"Now please reflect that everything that comes to _____ is the result of causes that have preceded it. _____ is the owner of their own Kamma. May this understanding help give me more Equanimity, realizing that they will receive the results of their own Kamma, and I may not have the power to change this."`
    },
    
    // Wise Reflection practices
    'Food Reflection': {
        title: 'Food Reflection Practice',
        content: `<strong>Three contemplations during meals:</strong>
1. Why do you eat?<br>
2. How fortunate you are<br>
3. Difficulties in getting food to you<br>

This practice develops gratitude and mindfulness around consumption.`
    },
    'Transformative Attitude': {
        title: 'Transformative Attitude Practice',
        content: `<strong>Four Key Principles:</strong>
1. <strong>No problems, only challenges</strong>
2. <strong>Good luck, bad luck, who knows?</strong>
3. <strong>What can I learn from this?</strong>
4. <strong>Changing everything into the path</strong>

These attitudes help transform difficulties into opportunities for growth.`
    },
    'Ten Paramis': {
        title: 'The Ten Paramis (Perfections)',
        content: `
1. Generosity<br>
2. Morality<br>
3. Renunciation<br>
4. Wisdom<br>
5. Energy<br>
6. Patience<br>
7. Truthfulness<br>
8. Determination/Resolution<br>
9. Compassion/Lovingkindness<br>
10. Equanimity

<strong>Reflection questions for each spiritual perfection:</strong>
• Since starting my Meditation/Mental Development practice, have I grown in _______?<br>
• How much have I grown in _______?<br>
• Reflecting upon my _______, let me consider just how I feel about my development of _______?<br>
• Is there more I can grow in _______?<br>
• What can I do in my life to help my level of _______ to grow?<br>
• How can the quality of _______ help you with defining an Inner Purpose and Direction in your life?`
    },
    'Five Daily Recollections': {
        title: 'Five Daily Recollections',
        content: `Traditional Buddhist contemplations to be reflected upon regularly:<br>

1. I am of the nature to decay - I have not gone beyond decay<br>
2. I am of the nature to be diseased - I have not gone beyond disease<br>
3. I am of the nature to die - I have not gone beyond death<br>
4. All that is mine, dear and delightful, will change and vanish<br>
5. I am the owner of my Kamma - I am the heir to my Kamma - I am born of my Kamma - I am related to my Kamma - I abide supported by my Kamma - Of whatever Kamma I shall do, whether wholesome or unwholesome, of that I will be the heir`
    },
    'Death Reflection': {
        title: 'Death Reflection Practice',
        content: `Think of someone who has died. Picture them alive and doing something. Now remember they are dead, gone, no longer part of this world.

Bring this awareness to yourself - you too will definitely die one day.
"Verily, my body is of the same nature: such it will become and cannot escape it."
<strong>Death Reflection Wish:</strong>
"May they have opportunity to develop the mind. If death comes unexpectedly, may they have contentment or peace. May they use their precious opportunity to develop beneficial qualities."`
    },
    'Eight Worldly Dhammas': {
        title: 'Eight Worldly Dhammas Reflection',
        content: `The Four Pairs:<br>
1. Praise and Blame<br>
2. Fame and Obscurity<br>
3. Gain and Loss<br>
4. Pleasure and Pain<br>

<strong>Key Questions:</strong>
• In what ways do you get stuck to wanting praise/not wanting blame?<br>
• Can you remember times when praise/blame seemed important but now doesn't matter?<br>
• Does their blame have power to change your past unbeneficial intention?<br>
• Could pleasant feelings of praise encourage repeating unbeneficial actions?<br>
Reflect on attachment patterns and how they create more Dukkha.`
    },
    'Dedication of Merit': {
        title: 'Dedication of Merit',
        content: `"May what I have done today to help purify my mind and heart, may it be of some help to benefit all beings."

<strong>Purpose:</strong> This dedication helps to give a sense of contentment and joy with your efforts. You remember that you are not doing this practice just for yourself and your own peace, but also for the benefit and welfare of all beings - through Compassion for the world.

<strong>Usage:</strong> End each day with a similar dedication. For those who are really keen, you could end each formal session with the dedication.`
    },
    'Going to Bed Sequence': {
        title: 'Going to Bed Compassion/Lovingkindness',
        content: `
1. Yourself<br>
2. The one person who is closest to you<br>
3. All the different people or beings whom you have had contact with today<br>
4. Any one group of people from your past<br>
5. Any one group of people from the world<br>
6. All beings`
    }
};

/**
 * POSTURES - Available meditation postures
 * Used to generate posture selection buttons in session planning and recording
 */
const POSTURES = ['Sitting', 'Standing', 'Walking', 'Lying down'];

/**
 * MeditationTimerApp - Main application class
 * 
 * Manages all app functionality including:
 * - Timer state and controls
 * - Session planning and recording
 * - Data persistence (IndexedDB and localStorage)
 * - Statistics and visualizations
 * - PWA features (service worker, offline support)
 */
class MeditationTimerApp {
    constructor() {
        /**
         * Application state divided into two main objects:
         * - timer: Active timer state including duration, elapsed time, practices
         * - app: General app state including view, favorites, database connection
         */
        this.state = {
            timer: {
                duration: 30 * 60, // seconds (default to 30 min)
                elapsed: 0,
                interval: null,
                isRunning: false,
                isPaused: false,
                selectedPractice: null,
                selectedPractices: [],
                currentPracticeIndex: 0,
                selectedPosture: 'Sitting',
                startTime: null,
                wakeLock: null,
                pendingSession: null,
                postSessionPractices: [],
                postSessionPosture: 'Sitting'
            },
            app: {
                currentView: 'timer',
                favorites: [],
                expandedCategories: new Set(),
                expandedSubcategories: new Set(),
                selectedPeriod: 'week',
                db: null,
                chartLoaded: false
            }
        };
        
        /** Session builder instances for planning and post-session recording */
        this.planningSessionBuilder = null;
        this.postSessionBuilder = null;
        
        /** Cached DOM element references for performance */
        this.elements = {};
        
        /** Debounced functions to prevent excessive calls during rapid updates */
        this.debouncedSaveState = this.debounce(this.saveState.bind(this), 1000);
        this.debouncedLoadStatistics = this.debounce(this.loadStatistics.bind(this), 300);
    }
    
    /**
     * Initialize the application
     * Sets up database, loads saved state, initializes UI, and registers service worker
     * Shows loading screen until all initialization is complete
     */
    async init() {
        try {
            // Initialize DOM elements first
            this.initializeElements();
            
            // Show loading screen is already visible from HTML
            
            // Initialize database
            await this.initializeDatabase();
            
            // Load saved state
            this.loadAppState();
            
            // Initialize UI components
            this.initializeUI();
            
            // Set up event listeners
            this.initializeEventListeners();
            
            // Load recent sessions
            await this.loadRecentSessions();
            
            // Preload bell sound
            this.preloadAudio();
            
            // Register service worker
            await this.registerServiceWorker();
            
            // Hide loading screen and show main content
            this.hideLoadingScreen();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showToast('Failed to initialize app. Please refresh.', 'error');
        }
    }
    
    /**
     * Debounce utility - delays function execution until after wait milliseconds
     * have elapsed since the last time the debounced function was invoked
     * @param {Function} func - Function to debounce
     * @param {number} wait - Milliseconds to wait
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }
    
    // Hide loading screen and show main content
    preloadAudio() {
        const bellSound = document.getElementById('bellSound');
        if (bellSound) {
            // Force preload by loading the audio
            bellSound.load();
            // Set volume to a reasonable level
            bellSound.volume = 0.7;
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainContent = document.getElementById('main-content');
        
        // Fade out loading screen
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContent.style.display = 'block';
            
            // Trigger reflow to ensure smooth animation
            mainContent.offsetHeight;
            mainContent.style.opacity = '1';
        }, 300);
    }
    
    // Initialize DOM element references
    initializeElements() {
        // Cache all DOM elements at once
        const elementIds = [
            'timerDisplay', 'customDuration', 'startBtn', 'pauseBtn', 'stopBtn',
            'decreaseBtn', 'increaseBtn', 'postureButtons', 'sessionInfo', 'currentPractice',
            'sessionPracticesList', 'recentSessionsList', 'timerView', 'statsView',
            'favoritesList', 'selectedPractices', 'addPracticeBtn', 'practiceSelector', 'sessionName',
            'saveFavoriteBtn', 'statsContent', 'exportBtn', 'importBtn', 'importFile', 'postSessionModal',
            'postSessionSelected', 'postSessionPostures', 'postAddPracticeBtn', 'postPracticeSelector',
            'saveSessionBtn', 'saveTimeOnlyBtn', 'cancelSessionBtn', 'modalCloseBtn', 'togglePlannerBtn', 
            'sessionPlannerContent', 'toastContainer'
        ];
        
        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
    }
    
    // Initialize IndexedDB with better error handling
    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('MeditationTimerDB', 2);
            
            request.onerror = () => {
                console.error('Failed to open database:', request.error);
                // Fall back to localStorage if IndexedDB fails
                this.state.app.db = null;
                resolve();
            };
            
            request.onsuccess = () => {
                this.state.app.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create sessions store if it doesn't exist
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    sessionStore.createIndex('date', 'date', { unique: false });
                    sessionStore.createIndex('practice', 'practice', { unique: false });
                    // Add compound index for efficient date range queries
                    sessionStore.createIndex('dateRange', ['date'], { unique: false });
                }
            };
        });
    }
    
    // Load saved app state
    loadAppState() {
        // Load favorites
        try {
            this.state.app.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        } catch (error) {
            console.error('Failed to load favorites:', error);
            this.state.app.favorites = [];
        }
        
        // Load saved duration (default to 30 minutes)
        const savedDuration = localStorage.getItem('lastDuration');
        if (savedDuration) {
            this.state.timer.duration = parseInt(savedDuration, 10);
        } else {
            this.state.timer.duration = 30 * 60; // Default to 30 minutes
        }
        
    }
    
    /**
     * Initialize UI components including session builders and navigation
     * Creates planning and post-session SessionBuilder instances
     */
    initializeUI() {
        // Initialize session builders
        this.planningSessionBuilder = new SessionBuilder({
            practices: this.state.timer.selectedPractices,
            posture: this.state.timer.selectedPosture,
            practicesContainer: this.elements.selectedPractices,
            postureContainer: this.elements.postureButtons,
            practiceSelector: this.elements.practiceSelector,
            namespace: 'planning',
            onUpdate: () => {
                this.state.timer.selectedPractices = this.planningSessionBuilder.getPractices();
                this.state.timer.selectedPosture = this.planningSessionBuilder.getPosture();
                this.debouncedSaveState();
            }
        });
        
        this.initializeDurationButtons();
        this.initializeNavigationTabs();
        this.loadFavorites();
    }
    
    /**
     * Set up all event listeners for UI interactions
     * Includes timer controls, navigation, data import/export, and modals
     */
    initializeEventListeners() {
        /** Timer control button event handlers */
        this.elements.startBtn.addEventListener('click', () => this.startTimer());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseTimer());
        this.elements.stopBtn.addEventListener('click', () => this.stopTimer());
        
        /** Dark mode toggle - currently disabled as app uses dark theme only */
        
        /** Session planning event handlers */
        this.elements.addPracticeBtn.addEventListener('click', () => {
            this.planningSessionBuilder.showPracticeSelector();
        });
        this.elements.saveFavoriteBtn.addEventListener('click', () => this.saveFavorite());
        
        /** Statistics period selection handlers */
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', () => this.changePeriod(btn.dataset.period));
        });
        
        /** Data backup and restore handlers */
        this.elements.exportBtn.addEventListener('click', () => this.exportData());
        this.elements.importBtn.addEventListener('click', () => this.elements.importFile.click());
        this.elements.importFile.addEventListener('change', (e) => this.importData(e));
        
        /** Post-session recording modal handlers */
        this.elements.saveSessionBtn.addEventListener('click', () => this.savePostSessionPractices());
        this.elements.saveTimeOnlyBtn.addEventListener('click', () => this.saveTimeOnly());
        this.elements.cancelSessionBtn.addEventListener('click', () => this.cancelPostSession());
        this.elements.modalCloseBtn.addEventListener('click', () => this.cancelPostSession());
        this.elements.postAddPracticeBtn.addEventListener('click', () => {
            if (this.postSessionBuilder) {
                this.postSessionBuilder.showPracticeSelector();
            }
        });
        
        /** Collapsible session planner section handler */
        this.elements.togglePlannerBtn.addEventListener('click', () => this.toggleSessionPlanner());
        
        /** Wake lock management - releases when tab hidden, reacquires when visible */
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.timer.wakeLock) {
                this.releaseWakeLock();
            } else if (!document.hidden && this.state.timer.isRunning) {
                this.requestWakeLock();
            }
        });
    }
    
    /**
     * Register service worker for offline support and PWA features
     * Handles update notifications and prompts user to refresh for new versions
     * Skips registration for file:// protocol
     */
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) return;
        
        /** Service workers not supported on file:// protocol */
        if (window.location.protocol === 'file:') {
            console.log('Service worker not supported on file:// protocol');
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker registered:', registration.scope);
            
            /** Check for service worker updates every hour */
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000);
            
            /** Notify user when new version is available */
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showToast('New version available! Click to update.', 'info', () => {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        });
                    }
                });
            });
            
        } catch (error) {
            console.error('ServiceWorker registration failed:', error);
        }
    }
    
    /**
     * Efficient DOM manipulation helpers to avoid innerHTML
     * These methods prevent forced reflows and improve performance
     */
    
    /**
     * Clear all children from an element efficiently
     * @param {Element} element - DOM element to clear
     */
    clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
    
    /**
     * Replace element content with fragment efficiently
     * @param {Element} element - DOM element to update
     * @param {DocumentFragment} fragment - New content
     */
    replaceElementContent(element, fragment) {
        this.clearElement(element);
        element.appendChild(fragment);
    }
    
    /**
     * Set stats content with predefined templates
     * Avoids innerHTML for common statistics states
     * @param {string} state - 'loading', 'offline', 'empty'
     */
    setStatsContent(state) {
        this.clearElement(this.elements.statsContent);
        
        if (state === 'loading') {
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            const text = document.createElement('p');
            text.textContent = 'Loading statistics...';
            this.elements.statsContent.appendChild(spinner);
            this.elements.statsContent.appendChild(text);
        } else if (state === 'offline') {
            const message = document.createElement('p');
            message.className = 'empty-message';
            message.textContent = 'Unable to load charts offline';
            this.elements.statsContent.appendChild(message);
        } else if (state === 'empty') {
            const message = document.createElement('p');
            message.className = 'empty-message';
            message.textContent = 'No sessions in this period';
            this.elements.statsContent.appendChild(message);
        }
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
        
        /** Auto-dismiss toast after 5 seconds */
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
    
    /**
     * Save current application state to localStorage
     * Persists timer settings and preferences between sessions
     */
    saveState() {
        const stateToSave = {
            timer: {
                duration: this.state.timer.duration,
                selectedPosture: this.state.timer.selectedPosture,
                selectedPractices: this.state.timer.selectedPractices
            },
            app: {
                selectedPeriod: this.state.app.selectedPeriod
            }
        };
        
        try {
            localStorage.setItem('appState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error('Failed to save state:', error);
        }
    }
    
    /**
     * Initialize duration adjustment buttons (+/- 5 minutes)
     * Updates display and saves duration preference
     */
    initializeDurationButtons() {
        /** Set initial duration display from saved state */
        const currentMinutes = Math.floor(this.state.timer.duration / 60);
        this.elements.customDuration.textContent = `${currentMinutes} min`;
        
        /** Duration adjustment button handlers */
        this.elements.decreaseBtn.addEventListener('click', () => this.adjustDuration(-5));
        this.elements.increaseBtn.addEventListener('click', () => this.adjustDuration(5));
    }
    
    setDuration(minutes) {
        this.state.timer.duration = minutes * 60;
        this.elements.customDuration.textContent = `${minutes} min`;
        
        /** Persist duration preference for next session */
        localStorage.setItem('lastDuration', String(this.state.timer.duration));
        
        this.debouncedSaveState();
    }
    
    adjustDuration(change) {
        const currentMinutes = Math.floor(this.state.timer.duration / 60);
        const newMinutes = Math.max(5, Math.min(120, currentMinutes + change));
        this.setDuration(newMinutes);
    }
    
    /**
     * Initialize navigation tab switching between timer and statistics views
     */
    initializeNavigationTabs() {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchView(tab.dataset.view));
        });
    }
    
    switchView(view) {
        this.state.app.currentView = view;
        
        /** Update active tab styling and ARIA attributes */
        document.querySelectorAll('.nav-tab').forEach(tab => {
            const isActive = tab.dataset.view === view;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });
        
        /** Toggle visibility of timer and statistics views */
        this.elements.timerView.style.display = view === 'timer' ? 'block' : 'none';
        this.elements.statsView.style.display = view === 'stats' ? 'block' : 'none';
        
        /** Lazy load statistics data when stats tab is selected */
        if (view === 'stats') {
            this.debouncedLoadStatistics();
        }
    }
    
    /**
     * Format seconds into MM:SS display format
     * @param {number} seconds - Total seconds to format
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateDisplay() {
        this.elements.timerDisplay.textContent = this.formatTime(this.state.timer.elapsed);
    }
    
    startTimer() {
        this.state.timer.isRunning = true;
        this.state.timer.isPaused = false;
        this.state.timer.startTime = Date.now() - (this.state.timer.elapsed * 1000);
        
        // Update UI
        this.elements.startBtn.style.display = 'none';
        this.elements.pauseBtn.style.display = 'inline-block';
        this.elements.stopBtn.style.display = 'inline-block';
        this.elements.sessionInfo.style.display = 'block';
        
        // Add pulse animation
        this.elements.timerDisplay.classList.add('running');
        
        // Show practice info
        if (this.state.timer.selectedPractices.length > 0) {
            this.elements.currentPractice.textContent = 
                this.state.timer.selectedPractices[this.state.timer.currentPracticeIndex];
            this.elements.sessionPracticesList.style.display = 'block';
            this.updateSessionPracticesList();
        } else {
            this.elements.currentPractice.textContent = this.state.timer.selectedPractice || 'Freestyle';
            this.elements.sessionPracticesList.style.display = 'none';
        }
        
        this.requestWakeLock();
        
        // Use more efficient timer interval (1 second instead of 100ms)
        this.state.timer.interval = setInterval(() => {
            this.state.timer.elapsed = Math.floor((Date.now() - this.state.timer.startTime) / 1000);
            this.updateDisplay();
            
            if (this.state.timer.elapsed >= this.state.timer.duration) {
                this.completeSession();
            }
        }, 1000);
    }
    
    pauseTimer() {
        this.state.timer.isPaused = true;
        this.state.timer.isRunning = false;
        clearInterval(this.state.timer.interval);
        
        // Remove pulse animation
        this.elements.timerDisplay.classList.remove('running');
        
        this.elements.pauseBtn.textContent = 'Resume';
        this.elements.pauseBtn.onclick = () => this.resumeTimer();
    }
    
    resumeTimer() {
        this.state.timer.isPaused = false;
        this.state.timer.isRunning = true;
        this.state.timer.startTime = Date.now() - (this.state.timer.elapsed * 1000);
        
        // Add pulse animation
        this.elements.timerDisplay.classList.add('running');
        
        this.elements.pauseBtn.textContent = 'Pause';
        this.elements.pauseBtn.onclick = () => this.pauseTimer();
        
        this.state.timer.interval = setInterval(() => {
            this.state.timer.elapsed = Math.floor((Date.now() - this.state.timer.startTime) / 1000);
            this.updateDisplay();
            
            if (this.state.timer.elapsed >= this.state.timer.duration) {
                this.completeSession();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (confirm('Stop current session?')) {
            this.completeSession();
        }
    }
    
    async completeSession() {
        clearInterval(this.state.timer.interval);
        
        /** Stop visual running indicator */
        this.elements.timerDisplay.classList.remove('running');
        
        // Play bell sound
        const bellSound = document.getElementById('bellSound');
        if (bellSound) {
            try {
                await bellSound.play();
            } catch (error) {
                console.log('Bell sound play failed:', error);
            }
        }
        
        // Store session data
        this.state.timer.pendingSession = {
            date: new Date().toISOString(),
            duration: this.state.timer.elapsed,
            posture: this.state.timer.selectedPosture,
            completed: this.state.timer.elapsed >= this.state.timer.duration,
            plannedPractices: this.state.timer.selectedPractices.length > 0 
                ? this.state.timer.selectedPractices 
                : [this.state.timer.selectedPractice || 'Freestyle']
        };
        
        /** Display modal for user to record actual practices completed */
        this.showPostSessionModal();
    }
    
    /**
     * Reset timer to initial state
     * Clears all timer values and updates UI to show start button
     */
    resetTimer() {
        this.state.timer.elapsed = 0;
        this.state.timer.isRunning = false;
        this.state.timer.isPaused = false;
        this.state.timer.startTime = null;
        this.state.timer.currentPracticeIndex = 0;
        this.state.timer.selectedPractices = [];
        
        /** Clear visual running indicator */
        this.elements.timerDisplay.classList.remove('running');
        
        this.updateDisplay();
        
        this.elements.startBtn.style.display = 'inline-block';
        this.elements.pauseBtn.style.display = 'none';
        this.elements.stopBtn.style.display = 'none';
        this.elements.sessionInfo.style.display = 'none';
        this.elements.pauseBtn.textContent = 'Pause';
        this.elements.pauseBtn.onclick = () => this.pauseTimer();
    }
    
    /**
     * Update the display of practices during an active session
     * Shows checkmarks for completed practices
     */
    updateSessionPracticesList() {
        const fragment = document.createDocumentFragment();
        
        this.state.timer.selectedPractices.forEach((practice, index) => {
            const item = document.createElement('div');
            item.className = 'session-practice-item';
            
            const check = document.createElement('span');
            check.className = 'practice-check';
            if (index <= this.state.timer.currentPracticeIndex) {
                check.classList.add('completed');
                check.textContent = '✓';
            }
            
            const text = document.createElement('span');
            text.textContent = practice;
            
            item.appendChild(check);
            item.appendChild(text);
            fragment.appendChild(item);
        });
        
        this.clearElement(this.elements.sessionPracticesList);
        this.elements.sessionPracticesList.appendChild(fragment);
    }
    
    /**
     * Toggle visibility of the session planning section
     * Collapsible UI element for planning meditation sessions
     */
    toggleSessionPlanner() {
        const isExpanded = this.elements.sessionPlannerContent.style.display !== 'none';
        this.elements.sessionPlannerContent.style.display = isExpanded ? 'none' : 'block';
        this.elements.togglePlannerBtn.classList.toggle('expanded', !isExpanded);
    }
    
    /**
     * Save current session configuration as a favorite
     * Validates that practices are selected before saving
     */
    saveFavorite() {
        if (this.state.timer.selectedPractices.length === 0) {
            this.showToast('Please add practices first', 'error');
            return;
        }
        
        const name = this.elements.sessionName.value.trim() || 
            `Session ${new Date().toLocaleDateString()}`;
        
        const favorite = {
            id: Date.now(),
            name: name,
            practices: [...this.state.timer.selectedPractices],
            duration: this.state.timer.duration,
            posture: this.state.timer.selectedPosture
        };
        
        this.state.app.favorites.push(favorite);
        localStorage.setItem('favorites', JSON.stringify(this.state.app.favorites));
        
        this.elements.sessionName.value = '';
        this.showToast('Saved as favorite!', 'success');
        this.loadFavorites();
    }
    
    /**
     * Load and display saved favorite sessions
     * Shows empty message if no favorites exist
     */
    loadFavorites() {
        const fragment = document.createDocumentFragment();
        
        if (this.state.app.favorites.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'No favorite sessions';
            fragment.appendChild(emptyMsg);
        } else {
            this.state.app.favorites.forEach(favorite => {
                const item = document.createElement('div');
                item.className = 'favorite-item';
                
                const content = document.createElement('div');
                content.style.cursor = 'pointer';
                content.onclick = () => this.loadFavoriteSession(favorite.id);
                
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
                deleteBtn.onclick = () => this.deleteFavorite(favorite.id);
                
                item.appendChild(content);
                item.appendChild(deleteBtn);
                fragment.appendChild(item);
            });
        }
        
        this.clearElement(this.elements.favoritesList);
        this.elements.favoritesList.appendChild(fragment);
    }
    
    /**
     * Load a favorite session configuration
     * @param {number} id - Favorite session ID
     */
    loadFavoriteSession(id) {
        const favorite = this.state.app.favorites.find(f => f.id === id);
        if (!favorite) return;
        
        this.state.timer.duration = favorite.duration;
        this.setDuration(Math.floor(favorite.duration / 60));
        
        if (this.planningSessionBuilder) {
            this.planningSessionBuilder.loadSession(favorite.practices, favorite.posture || 'Sitting');
        }
    }
    
    /**
     * Delete a favorite session with confirmation
     * @param {number} id - Favorite session ID to delete
     */
    deleteFavorite(id) {
        if (confirm('Delete this favorite?')) {
            this.state.app.favorites = this.state.app.favorites.filter(f => f.id !== id);
            localStorage.setItem('favorites', JSON.stringify(this.state.app.favorites));
            this.loadFavorites();
        }
    }
    
    /**
     * Display post-session recording modal
     * Initializes SessionBuilder with planned practices as default
     */
    showPostSessionModal() {
        this.elements.postSessionModal.style.display = 'flex';
        
        const plannedPractices = this.state.timer.pendingSession.plannedPractices || [];
        const currentPosture = this.state.timer.selectedPosture || 'Sitting';
        
        this.postSessionBuilder = new SessionBuilder({
            practices: plannedPractices.length > 0 ? [...plannedPractices] : [],
            posture: currentPosture,
            practicesContainer: this.elements.postSessionSelected,
            postureContainer: this.elements.postSessionPostures,
            practiceSelector: this.elements.postPracticeSelector,
            namespace: 'postsession',
            onUpdate: () => {
                this.state.timer.postSessionPractices = this.postSessionBuilder.getPractices();
                this.state.timer.postSessionPosture = this.postSessionBuilder.getPosture();
            }
        });
        
        this.state.timer.postSessionPractices = this.postSessionBuilder.getPractices();
        this.state.timer.postSessionPosture = this.postSessionBuilder.getPosture();
    }
    
    /**
     * Save session with user-recorded practices
     * Validates at least one practice is selected
     */
    async savePostSessionPractices() {
        if (this.state.timer.postSessionPractices.length === 0) {
            this.showToast('Please add at least one practice', 'error');
            return;
        }
        
        const session = {
            ...this.state.timer.pendingSession,
            practices: this.state.timer.postSessionPractices,
            posture: this.state.timer.postSessionPosture
        };
        
        await this.saveSession(session);
        
        this.elements.postSessionModal.style.display = 'none';
        this.resetTimer();
        this.releaseWakeLock();
        
        const duration = Math.floor(session.duration / 60);
        const practiceCount = this.state.timer.postSessionPractices.length;
        this.showToast(`Session saved: ${duration} minutes, ${practiceCount} practice${practiceCount > 1 ? 's' : ''}`, 'success');
    }
    
    async saveTimeOnly() {
        // Save session with just time/duration, no practice details
        const session = {
            ...this.state.timer.pendingSession,
            practices: ['Unspecified'],
            posture: this.state.timer.postSessionPosture || 'Sitting'
        };
        
        await this.saveSession(session);
        
        this.elements.postSessionModal.style.display = 'none';
        this.resetTimer();
        this.releaseWakeLock();
        
        const duration = Math.floor(session.duration / 60);
        this.showToast(`Session time saved: ${duration} minutes`, 'success');
    }
    
    cancelPostSession() {
        if (confirm('Cancel session? Your timer data will be lost.')) {
            this.elements.postSessionModal.style.display = 'none';
            this.resetTimer();
            this.releaseWakeLock();
        }
    }
    
    /** Dark mode functionality - currently disabled as app uses dark theme only */
    
    /**
     * Save completed session to IndexedDB or localStorage
     * Falls back to localStorage if IndexedDB fails
     * @param {Object} session - Session data to save
     */
    async saveSession(session) {
        if (this.state.app.db) {
            try {
                const transaction = this.state.app.db.transaction(['sessions'], 'readwrite');
                const store = transaction.objectStore('sessions');
                await store.add(session);
            } catch (error) {
                console.error('Failed to save to IndexedDB:', error);
                /** Use localStorage fallback if IndexedDB fails */
                this.saveSessionToLocalStorage(session);
            }
        } else {
            /** IndexedDB not available, use localStorage */
            this.saveSessionToLocalStorage(session);
        }
        
        /** Maintain list of last 10 sessions for quick access */
        const recentSessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
        recentSessions.unshift(session);
        if (recentSessions.length > 10) {
            recentSessions.pop();
        }
        localStorage.setItem('recentSessions', JSON.stringify(recentSessions));
        
        await this.loadRecentSessions();
    }
    
    /**
     * Save session to localStorage as fallback storage
     * Maintains maximum of 1000 sessions to avoid storage quota issues
     * @param {Object} session - Session data to save
     */
    saveSessionToLocalStorage(session) {
        const sessions = JSON.parse(localStorage.getItem('allSessions') || '[]');
        sessions.push(session);
        /** Prevent localStorage quota exceeded errors */
        if (sessions.length > 1000) {
            sessions.shift();
        }
        localStorage.setItem('allSessions', JSON.stringify(sessions));
    }
    
    /**
     * Load and display up to 5 most recent sessions
     * Shows "Today" for sessions from current date
     */
    async loadRecentSessions() {
        const sessions = JSON.parse(localStorage.getItem('recentSessions') || '[]');
        const fragment = document.createDocumentFragment();
        
        if (sessions.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'empty-message';
            emptyMsg.textContent = 'No recent sessions';
            fragment.appendChild(emptyMsg);
        } else {
            sessions.slice(0, 5).forEach(session => {
                const sessionDate = new Date(session.date);
                const today = new Date();
                const isToday = sessionDate.toDateString() === today.toDateString();
                const dateStr = isToday ? 'Today' : sessionDate.toLocaleDateString();
                
                const practiceText = Array.isArray(session.practices) 
                    ? session.practices.join(', ') 
                    : session.practice || '-';
                
                const div = document.createElement('div');
                div.className = 'session-item';
                
                const content = document.createElement('div');
                
                const practice = document.createElement('div');
                practice.className = 'session-practice';
                practice.textContent = practiceText;
                
                const meta = document.createElement('div');
                meta.className = 'session-meta';
                meta.textContent = `${dateStr} • ${Math.floor(session.duration / 60)} min • ${session.posture || 'Sitting'}`;
                
                content.appendChild(practice);
                content.appendChild(meta);
                div.appendChild(content);
                fragment.appendChild(div);
            });
        }
        
        this.replaceElementContent(this.elements.recentSessionsList, fragment);
    }
    
    /**
     * Load statistics view with Chart.js visualizations
     * Dynamically loads Chart.js library on first use
     */
    async loadStatistics() {
        /** Display loading spinner while fetching data */
        this.setStatsContent('loading');
        
        /** Lazy load Chart.js library from CDN on first statistics view */
        if (!this.state.app.chartLoaded) {
            try {
                await this.loadChartJS();
                this.state.app.chartLoaded = true;
            } catch (error) {
                this.showToast('Failed to load charts. Check your connection.', 'error');
                this.setStatsContent('offline');
                return;
            }
        }
        
        const sessions = await this.getSessionsForPeriod(this.state.app.selectedPeriod);
        
        if (sessions.length === 0) {
            this.setStatsContent('empty');
            return;
        }
        
        /** Process all statistics data in a single pass */
        const statsData = this.processStatisticsData(sessions);
        
        this.clearElement(this.elements.statsContent);
        
        /** Use requestAnimationFrame for smooth chart rendering */
        requestAnimationFrame(() => {
            this.createCalendarViewOptimized(statsData.sessionsByDate, this.state.app.selectedPeriod);
            this.createPracticeDistributionOptimized(statsData.practiceCounts);
            this.createCategoryTrendChartOptimized(statsData.dateData);
            this.createPostureChartOptimized(statsData.postureCounts, sessions.length);
            this.createTimeChartOptimized(statsData.durationsByDate);
        });
    }
    
    /**
     * Process all statistics data in a single pass through sessions
     * Eliminates multiple iterations for better performance
     * @param {Array} sessions - Sessions to process
     * @returns {Object} Aggregated statistics data
     */
    processStatisticsData(sessions) {
        const sessionsByDate = {};
        const practiceCounts = {};
        const dateData = {};
        const postureCounts = { Sitting: 0, Walking: 0, Standing: 0, Lying: 0 };
        const durationsByDate = {};
        
        /** Single pass through all sessions */
        sessions.forEach(session => {
            const dateString = new Date(session.date).toDateString();
            const localeDateString = new Date(session.date).toLocaleDateString();
            
            /** Calendar data */
            if (!sessionsByDate[dateString]) {
                sessionsByDate[dateString] = [];
            }
            sessionsByDate[dateString].push(session);
            
            /** Duration data */
            if (!durationsByDate[localeDateString]) {
                durationsByDate[localeDateString] = [];
            }
            durationsByDate[localeDateString].push(Math.floor(session.duration / 60));
            
            /** Posture data */
            if (session.posture && postureCounts.hasOwnProperty(session.posture)) {
                postureCounts[session.posture]++;
            }
            
            /** Practice and category data */
            const practices = session.practices || [session.practice];
            
            /** Initialize date data for category trends */
            if (!dateData[localeDateString]) {
                dateData[localeDateString] = {
                    mindfulness: 0,
                    compassion: 0,
                    sympatheticJoy: 0,
                    equanimity: 0,
                    wiseReflection: 0,
                    total: 0
                };
            }
            
            practices.forEach(practice => {
                if (practice) {
                    /** Practice counts */
                    practiceCounts[practice] = (practiceCounts[practice] || 0) + 1;
                    
                    /** Category counts for trends */
                    const category = getCategoryForPractice(practice);
                    dateData[localeDateString][category] = (dateData[localeDateString][category] || 0) + 1;
                    dateData[localeDateString].total += 1;
                }
            });
        });
        
        return {
            sessionsByDate,
            practiceCounts,
            dateData,
            postureCounts,
            durationsByDate
        };
    }
    
    /**
     * Dynamically load Chart.js library from CDN
     * Checks cache first, falls back to service worker caching if offline
     * @returns {Promise} Resolves when Chart.js is loaded
     */
    async loadChartJS() {
        /** Skip loading if Chart.js already available */
        if (window.Chart) return;
        
        /** Attempt to load Chart.js from CDN */
        try {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            
            return new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        } catch (error) {
            /** Request service worker to cache Chart.js for offline use */
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                const channel = new MessageChannel();
                
                return new Promise((resolve, reject) => {
                    channel.port1.onmessage = (event) => {
                        if (event.data.success) {
                            /** Retry loading after service worker caches */
                            this.loadChartJS().then(resolve).catch(reject);
                        } else {
                            reject(new Error('Failed to cache Chart.js'));
                        }
                    };
                    
                    navigator.serviceWorker.controller.postMessage(
                        { type: 'CACHE_CHART_JS' },
                        [channel.port2]
                    );
                });
            }
            
            throw error;
        }
    }
    
    /**
     * Retrieve sessions within the specified time period
     * @param {string} period - 'week', 'fortnight', or 'month'
     * @returns {Promise<Array>} Array of session objects
     */
    async getSessionsForPeriod(period) {
        const now = new Date();
        let startDate = new Date();
        
        switch (period) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'fortnight':
                startDate.setDate(now.getDate() - 14);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
        }
        
        if (this.state.app.db) {
            return await this.getSessionsFromIndexedDB(startDate);
        } else {
            return this.getSessionsFromLocalStorage(startDate);
        }
    }
    
    /**
     * Query IndexedDB for sessions after specified date
     * Uses getAll() for better performance than cursor iteration
     * @param {Date} startDate - Start date for session query
     * @returns {Promise<Array>} Array of session objects
     */
    async getSessionsFromIndexedDB(startDate) {
        return new Promise((resolve) => {
            const transaction = this.state.app.db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const index = store.index('date');
            const range = IDBKeyRange.lowerBound(startDate.toISOString());
            
            /** Use getAll() for efficient bulk retrieval */
            const request = index.getAll(range);
            
            request.onsuccess = (event) => {
                resolve(event.target.result || []);
            };
            
            request.onerror = () => {
                console.error('Failed to load sessions from IndexedDB');
                resolve([]);
            };
        });
    }
    
    /**
     * Filter localStorage sessions after specified date
     * @param {Date} startDate - Start date for session filter
     * @returns {Array} Filtered session objects
     */
    getSessionsFromLocalStorage(startDate) {
        const allSessions = JSON.parse(localStorage.getItem('allSessions') || '[]');
        return allSessions.filter(session => new Date(session.date) >= startDate);
    }
    
    /**
     * Create calendar grid visualization from pre-processed data
     * @param {Object} sessionsByDate - Sessions grouped by date
     * @param {string} period - Selected period
     */
    createCalendarViewOptimized(sessionsByDate, period) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        const title = document.createElement('h4');
        title.textContent = 'Practice Calendar';
        card.appendChild(title);
        
        const grid = document.createElement('div');
        grid.className = 'calendar-grid';
        
        /** Sessions already aggregated by processStatisticsData */
        
        /** Generate calendar grid for selected period */
        const days = period === 'week' ? 7 : period === 'fortnight' ? 14 : 30;
        
        const fragment = document.createDocumentFragment();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            
            if (sessionsByDate[dateStr]) {
                dayDiv.classList.add('has-practice');
                const totalMinutes = sessionsByDate[dateStr].reduce((sum, s) => sum + Math.floor(s.duration / 60), 0);
                
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = date.getDate();
                
                const dayMinutes = document.createElement('div');
                dayMinutes.className = 'day-minutes';
                dayMinutes.textContent = `${totalMinutes}m`;
                
                dayDiv.appendChild(dayNumber);
                dayDiv.appendChild(dayMinutes);
            } else {
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = date.getDate();
                dayDiv.appendChild(dayNumber);
            }
            
            fragment.appendChild(dayDiv);
        }
        
        grid.appendChild(fragment);
        card.appendChild(grid);
        this.elements.statsContent.appendChild(card);
    }
    
    /**
     * Create horizontal bar chart from pre-processed practice counts
     * @param {Object} practiceCounts - Practice count data
     */
    createPracticeDistributionOptimized(practiceCounts) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        const title = document.createElement('h4');
        title.textContent = 'Practice Distribution';
        card.appendChild(title);
        
        /** Practice counts already aggregated by processStatisticsData */
        
        // Sort practices by count (descending)
        const sortedPractices = Object.entries(practiceCounts)
            .sort((a, b) => b[1] - a[1]);
        
        const practiceNames = sortedPractices.map(([name]) => name);
        const practiceCounts_sorted = sortedPractices.map(([, count]) => count);
        
        // Get colors based on category
        const backgroundColors = practiceNames.map(practice => {
            const category = getCategoryForPractice(practice);
            return CATEGORY_COLORS[category] || '#6b7280';
        });
        
        /** Set up chart container with dynamic height based on practice count */
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        const chartHeight = Math.max(200, practiceNames.length * 25);
        chartContainer.style.height = `${chartHeight}px`;
        
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        card.appendChild(chartContainer);
        
        /** Initialize horizontal bar chart with practice data */
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: practiceNames,
                datasets: [{
                    data: practiceCounts_sorted,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color + '33'),
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.x} sessions`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
        
        this.elements.statsContent.appendChild(card);
    }
    
    /**
     * Create stacked area chart from pre-processed date data
     * @param {Object} dateData - Category data by date
     */
    createCategoryTrendChartOptimized(dateData) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        const title = document.createElement('h4');
        title.textContent = 'Practice Category Trends';
        card.appendChild(title);
        
        /** Date data already aggregated by processStatisticsData */
        
        // Sort dates and calculate percentages
        const sortedDates = Object.keys(dateData).sort((a, b) => new Date(a) - new Date(b));
        
        // Calculate category totals for sorting
        const categoryTotals = {
            mindfulness: 0,
            compassion: 0,
            sympatheticJoy: 0,
            equanimity: 0,
            wiseReflection: 0
        };
        
        Object.values(dateData).forEach(data => {
            Object.keys(categoryTotals).forEach(cat => {
                categoryTotals[cat] += data[cat] || 0;
            });
        });
        
        // Sort categories by total (largest first for bottom stacking)
        const sortedCategories = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(([cat]) => cat);
        
        // Create datasets for stacked area chart
        const datasets = sortedCategories.map(category => {
            const data = sortedDates.map(date => {
                const dayData = dateData[date];
                return dayData.total > 0 ? (dayData[category] / dayData.total) * 100 : 0;
            });
            
            return {
                label: PRACTICE_CONFIG[category].name,
                data: data,
                backgroundColor: CATEGORY_COLORS[category],
                borderColor: CATEGORY_COLORS[category],
                fill: true,
                tension: 0.4
            };
        });
        
        /** Set up chart container */
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.style.height = '250px';
        
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        card.appendChild(chartContainer);
        
        /** Initialize stacked area chart */
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 10,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'category'
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                }
            }
        });
        
        this.elements.statsContent.appendChild(card);
    }
    
    /**
     * Create posture chart from pre-processed counts
     * @param {Object} postureCounts - Posture count data
     * @param {number} totalSessions - Total number of sessions
     */
    createPostureChartOptimized(postureCounts, totalSessions) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        const title = document.createElement('h4');
        title.textContent = 'Posture Distribution';
        card.appendChild(title);
        
        /** Posture counts already aggregated by processStatisticsData */
        
        // Create chart
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.style.height = '200px';
        
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        card.appendChild(chartContainer);
        
        const ctx = canvas.getContext('2d');
        
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(postureCounts),
                datasets: [{
                    data: Object.values(postureCounts),
                    backgroundColor: [
                        '#06b6d4', // Cyan for Sitting
                        '#ec4899', // Pink for Standing
                        '#f59e0b', // Amber for Walking
                        '#8b5cf6'  // Purple for Lying
                    ],
                    borderWidth: 2,
                    borderColor: '#1f2937'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 10,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const percentage = ((context.parsed / totalSessions) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        this.elements.statsContent.appendChild(card);
    }
    
    /**
     * Create time chart from pre-processed duration data
     * @param {Object} durationsByDate - Duration data by date
     */
    createTimeChartOptimized(durationsByDate) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        
        const title = document.createElement('h4');
        title.textContent = 'Session Duration Trend';
        card.appendChild(title);
        
        /** Duration data already aggregated by processStatisticsData */
        
        const dates = Object.keys(durationsByDate).sort();
        const avgDurations = dates.map(date => {
            const durations = durationsByDate[date];
            return durations.reduce((a, b) => a + b, 0) / durations.length;
        });
        
        // Create chart
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.style.height = '200px';
        
        const canvas = document.createElement('canvas');
        chartContainer.appendChild(canvas);
        card.appendChild(chartContainer);
        
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Average Duration (minutes)',
                    data: avgDurations,
                    borderColor: '#4a5568',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        this.elements.statsContent.appendChild(card);
    }
    
    /**
     * Change statistics period and refresh charts
     * @param {string} period - 'week', 'fortnight', or 'month'
     */
    changePeriod(period) {
        this.state.app.selectedPeriod = period;
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });
        this.debouncedLoadStatistics();
    }
    
    /**
     * Export all session data and favorites to JSON file
     * Creates timestamped backup file for download
     */
    async exportData() {
        try {
            const sessions = await this.getAllSessions();
            const data = {
                version: 2,
                exportDate: new Date().toISOString(),
                sessions: sessions,
                favorites: this.state.app.favorites
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meditation-timer-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            this.showToast('Data exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Failed to export data', 'error');
        }
    }
    
    /**
     * Retrieve all sessions from storage
     * @returns {Promise<Array>} All session records
     */
    async getAllSessions() {
        if (this.state.app.db) {
            return await this.getSessionsFromIndexedDB(new Date(0));
        } else {
            return JSON.parse(localStorage.getItem('allSessions') || '[]');
        }
    }
    
    /**
     * Import session data from JSON backup file
     * Merges imported data with existing sessions and favorites
     * @param {Event} event - File input change event
     */
    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.version || !data.sessions) {
                throw new Error('Invalid backup file');
            }
            
            if (confirm('This will merge the imported data with your existing data. Continue?')) {
                /** Add imported sessions to database */
                if (this.state.app.db) {
                    const transaction = this.state.app.db.transaction(['sessions'], 'readwrite');
                    const store = transaction.objectStore('sessions');
                    
                    for (const session of data.sessions) {
                        await store.add(session);
                    }
                } else {
                    /** Merge imported sessions with existing localStorage data */
                    const existingSessions = JSON.parse(localStorage.getItem('allSessions') || '[]');
                    const merged = [...existingSessions, ...data.sessions];
                    localStorage.setItem('allSessions', JSON.stringify(merged));
                }
                
                /** Merge imported favorites, avoiding duplicates by name */
                if (data.favorites) {
                    const existingFavorites = new Set(this.state.app.favorites.map(f => f.name));
                    const newFavorites = data.favorites.filter(f => !existingFavorites.has(f.name));
                    this.state.app.favorites = [...this.state.app.favorites, ...newFavorites];
                    localStorage.setItem('favorites', JSON.stringify(this.state.app.favorites));
                    this.loadFavorites();
                }
                
                this.showToast('Data imported successfully!', 'success');
                await this.loadRecentSessions();
            }
        } catch (error) {
            console.error('Import failed:', error);
            this.showToast('Error importing data: ' + error.message, 'error');
        }
        
        event.target.value = '';
    }
    
    /**
     * Request wake lock to keep screen on during meditation
     * Re-acquires lock if released while timer is running
     */
    async requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.state.timer.wakeLock = await navigator.wakeLock.request('screen');
                
                /** Automatically re-acquire wake lock if accidentally released */
                this.state.timer.wakeLock.addEventListener('release', () => {
                    if (this.state.timer.isRunning && !document.hidden) {
                        this.requestWakeLock();
                    }
                });
            } catch (err) {
                console.log('Wake lock failed:', err);
            }
        }
    }
    
    /**
     * Release wake lock to allow screen to turn off
     */
    releaseWakeLock() {
        if (this.state.timer.wakeLock) {
            this.state.timer.wakeLock.release();
            this.state.timer.wakeLock = null;
        }
    }
}

/**
 * SessionBuilder - Reusable component for building meditation sessions
 * 
 * Used in two contexts:
 * 1. Planning sessions before starting timer
 * 2. Recording actual practices after timer completes
 * 
 * Features:
 * - Practice selection from hierarchical menu
 * - Drag-and-drop practice reordering
 * - Posture selection
 * - Configurable namespace to avoid conflicts between instances
 */
class SessionBuilder {
    constructor(config) {
        this.practices = config.practices || [];
        this.posture = config.posture || 'Sitting';
        this.practicesContainer = config.practicesContainer;
        this.postureContainer = config.postureContainer;
        this.practiceSelector = config.practiceSelector;
        this.onUpdate = config.onUpdate || (() => {});
        this.namespace = config.namespace || 'session';
        
        /** Bind drag handlers to maintain correct 'this' context */
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        this.handleDragEnter = this.handleDragEnter.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        
        /** 
         * Bind pointer handlers for touch/mobile support
         * Pointer Events provide unified handling for mouse, touch, and pen input
         * Essential for drag-and-drop on mobile devices where HTML5 drag doesn't work
         */
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        
        /** 
         * Track pointer drag state for mobile drag operations
         * pointerDragging: Whether a touch/pointer drag is in progress
         * pointerStartY: Initial Y coordinate for drag threshold detection
         * draggedClone: Reference to visual clone during drag (unused in current implementation)
         */
        this.pointerDragging = false;
        this.pointerStartY = 0;
        this.draggedClone = null;
        
        /**
         * Track active event listeners for cleanup
         * Prevents memory leaks by removing listeners before DOM updates
         * Maps element -> array of {type, handler} objects
         */
        this.activeListeners = new WeakMap();
        
        /** Initialize posture buttons and practice list */
        this.initializePostureButtons();
        this.updatePracticesList();
    }
    
    initializePostureButtons() {
        if (!this.postureContainer) return;
        
        const fragment = document.createDocumentFragment();
        
        POSTURES.forEach(posture => {
            const btn = document.createElement('button');
            btn.className = 'posture-btn';
            btn.textContent = posture;
            btn.onclick = () => this.selectPosture(posture);
            btn.classList.toggle('selected', posture === this.posture);
            fragment.appendChild(btn);
        });
        
        while (this.postureContainer.firstChild) {
            this.postureContainer.removeChild(this.postureContainer.firstChild);
        }
        this.postureContainer.appendChild(fragment);
    }
    
    selectPosture(posture) {
        this.posture = posture;
        this.postureContainer.querySelectorAll('.posture-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.textContent === posture);
        });
        this.onUpdate();
    }
    
    updatePracticesList() {
        if (!this.practicesContainer) return;
        
        /** Clean up all existing event listeners before clearing DOM */
        this.cleanupEventListeners();
        
        if (this.practices.length === 0) {
            const message = document.createElement('p');
            message.className = 'empty-message';
            message.textContent = 'No practices selected';
            this.practicesContainer.appendChild(message);
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        this.practices.forEach((practice, index) => {
            const item = document.createElement('div');
            item.className = 'selected-practice-item';
            item.dataset.index = index;
            item.dataset.namespace = this.namespace;
            
            const content = document.createElement('div');
            content.style.display = 'flex';
            content.style.alignItems = 'center';
            
            const handle = document.createElement('span');
            handle.className = 'drag-handle';
            handle.textContent = '≡';
            
            /** 
             * Add pointer events for touch/mobile support
             * Pointer Events API works with mouse, touch, and pen input
             * This enables drag-and-drop on mobile devices where HTML5 drag doesn't work
             */
            const pointerHandler = (e) => this.handlePointerDown(e, item);
            const touchHandler = (e) => e.preventDefault();
            
            this.addEventListenerWithTracking(handle, 'pointerdown', pointerHandler);
            
            /** 
             * Prevent default touch behavior specifically on the drag handle
             * This stops scrolling when user touches the handle, but allows scrolling elsewhere
             * passive: false is required to call preventDefault() in Chrome
             */
            this.addEventListenerWithTracking(handle, 'touchstart', touchHandler, { passive: false });
            
            const order = document.createElement('span');
            order.className = 'practice-order';
            order.textContent = `${index + 1}.`;
            
            const text = document.createElement('span');
            text.textContent = practice;
            
            content.appendChild(handle);
            content.appendChild(order);
            content.appendChild(text);
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-practice';
            removeBtn.textContent = '×';
            removeBtn.onclick = () => this.removePractice(index);
            
            item.appendChild(content);
            item.appendChild(removeBtn);
            
            /** 
             * HTML5 Drag and Drop setup for desktop browsers
             * This provides native drag behavior on desktop while Pointer Events handle mobile
             */
            item.draggable = true;
            
            /** 
             * Add HTML5 drag event listeners for desktop functionality
             * These work alongside Pointer Events to provide cross-platform support
             * All listeners are tracked for proper cleanup
             */
            this.addEventListenerWithTracking(item, 'dragstart', this.handleDragStart);
            this.addEventListenerWithTracking(item, 'dragend', this.handleDragEnd);
            this.addEventListenerWithTracking(item, 'dragover', this.handleDragOver);
            this.addEventListenerWithTracking(item, 'drop', this.handleDrop);
            this.addEventListenerWithTracking(item, 'dragenter', this.handleDragEnter);
            this.addEventListenerWithTracking(item, 'dragleave', this.handleDragLeave);
            
            fragment.appendChild(item);
        });
        
        while (this.practicesContainer.firstChild) {
            this.practicesContainer.removeChild(this.practicesContainer.firstChild);
        }
        this.practicesContainer.appendChild(fragment);
    }
    
    /**
     * Add event listener with tracking for cleanup
     * Stores reference to enable proper removal later
     * @param {Element} element - DOM element
     * @param {string} type - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event listener options
     */
    addEventListenerWithTracking(element, type, handler, options) {
        element.addEventListener(type, handler, options);
        
        /** Store listener info for cleanup */
        if (!this.activeListeners.has(element)) {
            this.activeListeners.set(element, []);
        }
        this.activeListeners.get(element).push({ type, handler, options });
    }
    
    /**
     * Clean up all tracked event listeners
     * Prevents memory leaks when DOM is updated
     */
    cleanupEventListeners() {
        const items = this.practicesContainer.querySelectorAll('.selected-practice-item');
        items.forEach(item => {
            /** Remove tracked listeners from the item */
            const listeners = this.activeListeners.get(item);
            if (listeners) {
                listeners.forEach(({ type, handler, options }) => {
                    item.removeEventListener(type, handler, options);
                });
                this.activeListeners.delete(item);
            }
            
            /** Also clean up handle listeners */
            const handle = item.querySelector('.drag-handle');
            if (handle) {
                const handleListeners = this.activeListeners.get(handle);
                if (handleListeners) {
                    handleListeners.forEach(({ type, handler, options }) => {
                        handle.removeEventListener(type, handler, options);
                    });
                    this.activeListeners.delete(handle);
                }
            }
        });
    }
    
    addPractice(practice) {
        this.practices.push(practice);
        this.updatePracticesList();
        this.onUpdate();
    }
    
    removePractice(index) {
        this.practices.splice(index, 1);
        this.updatePracticesList();
        this.onUpdate();
    }
    
    showPracticeSelector() {
        if (!this.practiceSelector) return;
        
        this.practiceSelector.style.display = 'block';
        
        const categoriesDiv = document.createElement('div');
        categoriesDiv.className = 'practice-categories';
        
        Object.entries(PRACTICE_CONFIG).forEach(([key, category]) => {
            const categoryClone = createCategoryElement(key, category, (practice) => {
                this.addPractice(practice);
                this.practiceSelector.style.display = 'none';
            });
            categoriesDiv.appendChild(categoryClone);
        });
        
        while (this.practiceSelector.firstChild) {
            this.practiceSelector.removeChild(this.practiceSelector.firstChild);
        }
        this.practiceSelector.appendChild(categoriesDiv);
    }
    
    /**
     * Handle drag start event when user begins dragging a practice item
     * Stores reference to dragged element and applies visual feedback
     * @param {DragEvent} e - The drag event
     */
    handleDragStart(e) {
        const item = e.currentTarget;
        this.draggedElement = item;
        this.draggedIndex = parseInt(item.dataset.index);
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.draggedIndex);
    }
    
    /**
     * Handle drag end event to clean up visual states
     * Removes dragging styles from all elements
     * @param {DragEvent} e - The drag event
     */
    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        this.practicesContainer.querySelectorAll('.selected-practice-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    }
    
    /**
     * Handle drag over event to provide live preview of drop position
     * Dynamically reorders DOM elements as user drags
     * @param {DragEvent} e - The drag event
     */
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = this.getDragAfterElement(e.clientY);
        const draggingItem = this.practicesContainer.querySelector('.dragging');
        
        if (afterElement == null) {
            this.practicesContainer.appendChild(draggingItem);
        } else {
            this.practicesContainer.insertBefore(draggingItem, afterElement);
        }
    }
    
    /**
     * Handle drag enter event to highlight potential drop targets
     * @param {DragEvent} e - The drag event
     * @returns {boolean} false to allow drop
     */
    handleDragEnter(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        if (e.currentTarget !== this.draggedElement) {
            e.currentTarget.classList.add('drag-over');
        }
        return false;
    }
    
    /**
     * Handle drag leave event to remove drop target highlighting
     * @param {DragEvent} e - The drag event
     */
    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }
    
    /**
     * Handle drop event to finalize the new practice order
     * Reads final DOM order and updates practices array accordingly
     * @param {DragEvent} e - The drag event
     */
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Get the final order from the DOM
        const items = [...this.practicesContainer.querySelectorAll('.selected-practice-item')];
        const newOrder = items.map(item => {
            const index = parseInt(item.dataset.index);
            return this.practices[index];
        });
        
        // Update practices array with new order
        this.practices = newOrder;
        
        // Update the list to refresh indices
        this.updatePracticesList();
        this.onUpdate();
    }
    
    /**
     * Calculate which element the dragged item should be inserted after
     * Uses mouse Y position to determine optimal insertion point
     * @param {number} y - The Y coordinate of the mouse
     * @returns {Element|null} The element to insert after, or null to append at end
     */
    getDragAfterElement(y) {
        const draggableElements = [...this.practicesContainer.querySelectorAll('.selected-practice-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    /**
     * Get copy of current practices array
     * @returns {Array<string>} Array of practice names
     */
    getPractices() {
        return [...this.practices];
    }
    
    /**
     * Get currently selected posture
     * @returns {string} Posture name
     */
    getPosture() {
        return this.posture;
    }
    
    /**
     * Load a saved session configuration
     * @param {Array<string>} practices - Practice names
     * @param {string} posture - Posture name
     */
    loadSession(practices, posture) {
        this.practices = [...practices];
        this.posture = posture || 'Sitting';
        this.initializePostureButtons();
        this.updatePracticesList();
    }
    
    /**
     * Clean up references for garbage collection
     */
    destroy() {
        /** Clean up all event listeners first */
        this.cleanupEventListeners();
        
        /** Clear references to prevent memory leaks */
        this.practices = [];
        this.onUpdate = null;
        this.practicesContainer = null;
        this.postureContainer = null;
        this.practiceSelector = null;
        this.activeListeners = null;
    }
    
    /**
     * Handle pointer down event for touch/mouse dragging
     * Initiates drag operation on mobile devices where HTML5 drag doesn't work
     * @param {PointerEvent} e - The pointer event
     * @param {Element} item - The practice item element
     */
    handlePointerDown(e, item) {
        // Only handle primary button/touch
        if (e.button !== 0) return;
        
        this.pointerDragging = true;
        this.draggedElement = item;
        this.draggedIndex = parseInt(item.dataset.index);
        this.pointerStartY = e.clientY;
        
        // Add visual feedback
        item.classList.add('dragging');
        
        // Set up document-level listeners for move and up
        document.addEventListener('pointermove', this.handlePointerMove);
        document.addEventListener('pointerup', this.handlePointerUp);
        document.addEventListener('pointercancel', this.handlePointerUp);
        
        // Prevent text selection
        e.preventDefault();
    }
    
    /**
     * Handle pointer move event during touch/mouse dragging
     * Provides live preview by reordering DOM elements
     * @param {PointerEvent} e - The pointer event
     */
    handlePointerMove(e) {
        if (!this.pointerDragging) return;
        
        // Get the element under the pointer
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
        if (!elementBelow) return;
        
        // Find the practice item we're hovering over
        const hoverItem = elementBelow.closest('.selected-practice-item');
        if (!hoverItem || hoverItem === this.draggedElement) return;
        
        // Use the same logic as drag and drop
        const afterElement = this.getDragAfterElement(e.clientY);
        
        if (afterElement == null) {
            this.practicesContainer.appendChild(this.draggedElement);
        } else {
            this.practicesContainer.insertBefore(this.draggedElement, afterElement);
        }
    }
    
    /**
     * Handle pointer up event to complete touch/mouse dragging
     * Finalizes the new order and updates the practices array
     * @param {PointerEvent} e - The pointer event
     */
    handlePointerUp(e) {
        if (!this.pointerDragging) return;
        
        this.pointerDragging = false;
        
        // Remove document-level listeners
        document.removeEventListener('pointermove', this.handlePointerMove);
        document.removeEventListener('pointerup', this.handlePointerUp);
        document.removeEventListener('pointercancel', this.handlePointerUp);
        
        // Remove visual feedback
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
        }
        
        // Get the final order from the DOM
        const items = [...this.practicesContainer.querySelectorAll('.selected-practice-item')];
        const newOrder = items.map(item => {
            const index = parseInt(item.dataset.index);
            return this.practices[index];
        });
        
        // Update practices array with new order
        this.practices = newOrder;
        
        // Update the list to refresh indices
        this.updatePracticesList();
        this.onUpdate();
        
        // Clean up
        this.draggedElement = null;
        this.draggedIndex = null;
    }
}

/**
 * Helper functions for creating practice selection UI
 */
/**
 * Create a category element with expandable practices
 * @param {string} key - Category key
 * @param {Object} category - Category configuration
 * @param {Function} onPracticeClick - Callback when practice is selected
 * @returns {HTMLElement} Category DOM element
 */
function createCategoryElement(key, category, onPracticeClick) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-group';
    
    const header = document.createElement('div');
    header.className = 'category-header';
    
    const name = document.createElement('span');
    name.textContent = category.name;
    
    const arrow = document.createElement('span');
    arrow.className = 'category-arrow';
    arrow.textContent = '▶';
    
    header.appendChild(name);
    header.appendChild(arrow);
    
    const practicesDiv = document.createElement('div');
    practicesDiv.className = 'category-practices';
    
    /** Generate practice buttons for this category */
    Object.entries(category.practices).forEach(([practiceName, subPractices]) => {
        /** Check if this is a simple practice (null or object with info) or hierarchical practice */
        const isSimplePractice = subPractices === null || (subPractices && subPractices.info);
        
        if (isSimplePractice) {
            const practiceWrapper = document.createElement('div');
            practiceWrapper.className = 'practice-item-wrapper';
            
            const practiceBtn = document.createElement('button');
            practiceBtn.className = 'practice-item';
            practiceBtn.textContent = practiceName;
            practiceBtn.onclick = () => onPracticeClick(practiceName);
            
            practiceWrapper.appendChild(practiceBtn);
            
            /** Add info button for practices with descriptions */
            if (PRACTICE_DESCRIPTIONS[practiceName]) {
                const infoBtn = document.createElement('button');
                infoBtn.className = 'practice-info-btn';
                infoBtn.textContent = 'ℹ️';
                infoBtn.title = 'View practice information';
                infoBtn.onclick = (e) => {
                    e.stopPropagation();
                    showPracticeInfo(practiceName);
                };
                practiceWrapper.appendChild(infoBtn);
            }
            
            practicesDiv.appendChild(practiceWrapper);
        } else if (typeof subPractices === 'object') {
            const subcategoryDiv = createSubcategoryElement(practiceName, subPractices, onPracticeClick);
            practicesDiv.appendChild(subcategoryDiv);
        }
    });
    
    header.onclick = () => {
        const isExpanded = header.classList.contains('expanded');
        header.classList.toggle('expanded', !isExpanded);
        practicesDiv.classList.toggle('expanded', !isExpanded);
    };
    
    categoryDiv.appendChild(header);
    categoryDiv.appendChild(practicesDiv);
    
    return categoryDiv;
}

/**
 * Create a subcategory element with nested practices
 * @param {string} name - Subcategory name
 * @param {Object|Array} subPractices - Nested practice configuration
 * @param {Function} onPracticeClick - Callback when practice is selected
 * @returns {HTMLElement} Subcategory DOM element
 */
function createSubcategoryElement(name, subPractices, onPracticeClick) {
    const subcategoryDiv = document.createElement('div');
    subcategoryDiv.className = 'subcategory-group';
    
    const header = document.createElement('div');
    header.className = 'subcategory-header';
    
    const text = document.createElement('span');
    text.textContent = name;
    
    const arrow = document.createElement('span');
    arrow.className = 'category-arrow';
    arrow.textContent = '▶';
    
    header.appendChild(text);
    header.appendChild(arrow);
    
    const practicesDiv = document.createElement('div');
    practicesDiv.className = 'subcategory-practices';
    
    /** Support both array and object formats for subpractices */
    if (Array.isArray(subPractices)) {
        subPractices.forEach(practice => {
            const practiceWrapper = document.createElement('div');
            practiceWrapper.className = 'practice-item-wrapper';
            
            const practiceBtn = document.createElement('button');
            practiceBtn.className = 'practice-item';
            practiceBtn.textContent = practice;
            practiceBtn.onclick = () => onPracticeClick(`${name} - ${practice}`);
            
            practiceWrapper.appendChild(practiceBtn);
            
            /** Add info button for practices with descriptions */
            if (PRACTICE_DESCRIPTIONS[practice]) {
                const infoBtn = document.createElement('button');
                infoBtn.className = 'practice-info-btn';
                infoBtn.textContent = 'ℹ️';
                infoBtn.title = 'View practice information';
                infoBtn.onclick = (e) => {
                    e.stopPropagation();
                    showPracticeInfo(practice);
                };
                practiceWrapper.appendChild(infoBtn);
            }
            
            practicesDiv.appendChild(practiceWrapper);
        });
    } else {
        Object.entries(subPractices).forEach(([subName, items]) => {
            /** Check if this is a simple practice (null or object with info) */
            const isSimplePractice = items === null || (items && items.info);
            
            if (isSimplePractice) {
                const practiceWrapper = document.createElement('div');
                practiceWrapper.className = 'practice-item-wrapper';
                
                const practiceBtn = document.createElement('button');
                practiceBtn.className = 'practice-item';
                practiceBtn.textContent = subName;
                practiceBtn.onclick = () => onPracticeClick(`${name} - ${subName}`);
                
                practiceWrapper.appendChild(practiceBtn);
                
                /** Add info button for practices with descriptions */
                if (PRACTICE_DESCRIPTIONS[subName]) {
                    const infoBtn = document.createElement('button');
                    infoBtn.className = 'practice-info-btn';
                    infoBtn.textContent = 'ℹ️';
                    infoBtn.title = 'View practice information';
                    infoBtn.onclick = (e) => {
                        e.stopPropagation();
                        showPracticeInfo(subName);
                    };
                    practiceWrapper.appendChild(infoBtn);
                }
                
                practicesDiv.appendChild(practiceWrapper);
            } else if (Array.isArray(items)) {
                items.forEach(item => {
                    const practiceBtn = document.createElement('button');
                    practiceBtn.className = 'practice-item';
                    practiceBtn.textContent = `${subName}: ${item}`;
                    practiceBtn.onclick = () => onPracticeClick(`${name} - ${subName}: ${item}`);
                    practicesDiv.appendChild(practiceBtn);
                });
            }
        });
    }
    
    header.onclick = () => {
        const isExpanded = header.classList.contains('expanded');
        header.classList.toggle('expanded', !isExpanded);
        practicesDiv.classList.toggle('expanded', !isExpanded);
    };
    
    subcategoryDiv.appendChild(header);
    subcategoryDiv.appendChild(practicesDiv);
    
    return subcategoryDiv;
}

/**
 * Display modal with detailed practice information
 * @param {string} practiceName - Name of practice to show info for
 */
function showPracticeInfo(practiceName) {
    const info = PRACTICE_DESCRIPTIONS[practiceName];
    if (!info) return;
    
    const modal = document.getElementById('practiceInfoModal');
    const titleEl = document.getElementById('practiceInfoTitle');
    const contentEl = document.getElementById('practiceInfoContent');
    
    titleEl.textContent = info.title;
    /** Use innerHTML only for trusted content with HTML markup */
    contentEl.innerHTML = info.content;
    
    modal.style.display = 'flex';
    
    /** Set up modal close button handler */
    const closeBtn = document.getElementById('closePracticeInfoBtn');
    const closeHandler = () => {
        modal.style.display = 'none';
        closeBtn.removeEventListener('click', closeHandler);
        modal.removeEventListener('click', backdropHandler);
    };
    
    /** Close modal when clicking outside content */
    const backdropHandler = (e) => {
        if (e.target === modal) {
            closeHandler();
        }
    };
    
    closeBtn.addEventListener('click', closeHandler);
    modal.addEventListener('click', backdropHandler);
    
    /** Close modal on Escape key press */
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeHandler();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

/**
 * Initialize application when DOM content is loaded
 * Creates app instance and makes it globally available for debugging
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new MeditationTimerApp();
    app.init();
    
    /** Expose app instance to window for debugging purposes */
    window.meditationApp = app;
});
