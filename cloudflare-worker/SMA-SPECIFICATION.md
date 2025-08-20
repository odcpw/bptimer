# Special Mindfulness Activities (SMA) Module Specification

## Overview
A dedicated module for tracking mindfulness activities throughout daily life (e.g., opening doors mindfully, turning taps with awareness). Designed to complement the main meditation timer with gentle reminders for informal practice.

## Core Principles
- **Privacy-first**: Activity names never leave the device
- **Simple UI**: List-based, no calendar complexity
- **Flexible scheduling**: From monthly to multiple times daily
- **Non-intrusive**: Generic notifications that don't reveal activities
- **Offline-capable**: Core functionality works without internet

## User Interface Design

### Navigation
```
[Timer] [SMAs] [Statistics] [Settings]
         ^^^^^ New tab
```

### SMA Main Screen
```
┌─────────────────────────────────────┐
│ Special Mindfulness Activities      │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🚪 Opening doors mindfully     │ │
│ │ Daily • 3x per day • Active    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💧 Turning taps with awareness │ │
│ │ Weekly • Paused                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Add New Activity]                │
└─────────────────────────────────────┘
```

### Add/Edit Activity Modal
```
┌─────────────────────────────────────┐
│ Add Mindfulness Activity            │
│                                     │
│ Activity Name:                      │
│ [____________________________]      │
│                                     │
│ Emoji (optional):                   │
│ [🚪] [💧] [🚶] [✋] [👁️] [Custom]    │
│                                     │
│ Frequency:                          │
│ ○ Monthly (1st of month)            │
│ ○ Weekly                            │
│   └─ Day: [Monday ▼]               │
│ ● Daily                             │
│ ○ Multiple times per day            │
│   └─ Times: [3 ▼]                  │
│                                     │
│ Reminder Hours (if daily/multiple): │
│ [✓] Morning (8-10am)                │
│ [✓] Afternoon (2-4pm)               │
│ [✓] Evening (7-9pm)                 │
│                                     │
│ [Save] [Cancel]                     │
└─────────────────────────────────────┘
```

## Data Model

### Local Storage (IndexedDB)
```javascript
// SMA Activity Object
{
  id: 'sma_1234567890',
  name: 'Opening doors mindfully',
  emoji: '🚪',
  frequency: 'daily', // 'monthly' | 'weekly' | 'daily' | 'multiple'
  frequencyDetails: {
    // For weekly
    dayOfWeek: 1, // 0-6, Sunday-Saturday
    
    // For multiple times daily
    timesPerDay: 3,
    reminderWindows: ['morning', 'afternoon', 'evening'],
    
    // Actual reminder times (randomized within windows)
    scheduledTimes: ['09:15', '14:30', '20:45']
  },
  status: 'active', // 'active' | 'paused'
  createdAt: '2024-01-15T10:00:00Z',
  lastReminderAt: '2024-01-15T14:30:00Z',
  completions: [
    {
      date: '2024-01-15',
      acknowledgedAt: '14:32:00',
      completed: true
    }
  ]
}
```

### Server Storage (Cloudflare KV)
```javascript
// Privacy-preserving: No activity names stored
{
  userId: 'usr_anonymous_hash',
  subscriptions: [{
    endpoint: 'https://fcm.google...',
    keys: { p256dh: '...', auth: '...' }
  }],
  schedules: [
    {
      id: 'sma_1234567890', // Links to local activity
      times: ['09:15', '14:30', '20:45'],
      timezone: 'America/New_York',
      nextReminder: '2024-01-15T14:30:00Z'
    }
  ]
}
```

## Notification System

### Scheduling Logic
```javascript
// Time window randomization (prevents habit predictability)
const TIME_WINDOWS = {
  morning: { start: 8, end: 10 },
  afternoon: { start: 14, end: 16 },
  evening: { start: 19, end: 21 }
};

function scheduleActivity(activity) {
  const times = [];
  
  for (const window of activity.reminderWindows) {
    const { start, end } = TIME_WINDOWS[window];
    const hour = start + Math.random() * (end - start);
    const minute = Math.floor(Math.random() * 60);
    times.push(`${Math.floor(hour).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  }
  
  return times.sort();
}
```

### Notification Content
```javascript
// Generic notification (privacy-preserving)
{
  title: "Mindfulness Reminder",
  body: "Time for your practice",
  icon: "/icon-192.png",
  badge: "/badge-96.png",
  tag: "sma-reminder",
  data: {
    activityId: 'sma_1234567890', // App fetches details locally
    type: 'sma'
  }
}
```

## Privacy Architecture

### Data Flow
```
┌──────────────┐     Generic Schedule     ┌─────────────────┐
│   PWA/Phone  │ ──────────────────────> │ Cloudflare KV   │
│              │                          │                 │
│ Activity     │ <────────────────────── │ "Time for       │
│ Names Stay   │   Generic Notification   │  practice"      │
│ Local Only   │                          │                 │
└──────────────┘                          └─────────────────┘
```

### What Server Knows
- User wants reminders at specific times
- User's timezone
- Push subscription endpoint

### What Server DOESN'T Know
- Activity names or descriptions
- What the user is practicing
- Personal practice data

## User Flows

### First-Time Setup
1. User navigates to SMAs tab
2. Sees empty state with explanation
3. Taps "Add New Activity"
4. Enters activity details
5. If notifications not enabled:
   - Prompt for notification permission
   - Register with push server
6. Activity appears in list

### Daily Use
1. User receives generic notification
2. Taps notification → Opens app to SMA tab
3. Sees which activity is due (highlighted)
4. Can mark as "Done" or "Skip"
5. Stats tracked locally

### Managing Activities
- **Pause/Resume**: Toggle without losing settings
- **Edit**: Change frequency or reminder times
- **Delete**: Remove with confirmation
- **Reorder**: Drag to prioritize

## Technical Implementation

### File Structure
```
script.js modifications:
├── SMA_CONFIG object
├── SMAManager class
├── Notification integration
└── UI components

New service worker code:
├── Push event handler
└── Notification click handler

New server worker:
└── Cloudflare Worker (separate repo)
```

### Key Functions
```javascript
class SMAManager {
  async addActivity(activity) {
    // Save to IndexedDB
    // Schedule notifications
    // Update UI
  }
  
  async updateSchedule(activityId) {
    // Recalculate reminder times
    // Send to server (generic)
  }
  
  async handleNotification(activityId) {
    // Show in-app reminder
    // Track completion
  }
  
  async getActivityStats(activityId) {
    // Calculate completion rate
    // Show streaks
  }
}
```

### Integration Points

1. **Navigation Update**
```javascript
// Add to existing tab system
<div class="tab" data-tab="sma">SMAs</div>
```

2. **Service Worker Push Handler**
```javascript
self.addEventListener('push', (event) => {
  if (event.data.json().type === 'sma') {
    // Handle SMA notification
  }
});
```

3. **Statistics Integration**
```javascript
// Extend existing stats to show:
// - SMA completion rates
// - Streak tracking
// - Time-of-day patterns
```

## Progressive Enhancement Strategy

### Phase 1: Local Only (No Server)
- Add/edit/delete activities ✓
- Visual reminders when app opens ✓
- Basic completion tracking ✓

### Phase 2: Push Notifications
- Cloudflare Worker setup
- Real-time notifications
- Works with app closed

### Phase 3: Enhanced Features
- Completion insights
- Adaptive scheduling
- Export/import activities

## Implementation Roadmap

### Phase 1: Core Functionality (Local Only)
1. **Database Schema**
   - Add `smas` object store to IndexedDB
   - Create migration for existing users

2. **UI Components**
   - Add SMAs tab to navigation
   - Create activity list component
   - Build add/edit modal
   - Implement empty state

3. **Core Logic**
   - SMAManager class
   - CRUD operations
   - Local scheduling logic
   - In-app reminder system

4. **Basic Stats**
   - Completion tracking
   - Simple streaks
   - Integration with main stats

### Phase 2: Push Notifications
1. **Cloudflare Worker**
   - Project setup
   - KV namespace
   - Cron triggers
   - Push endpoints

2. **PWA Integration**
   - VAPID key generation
   - Push subscription flow
   - Service worker updates
   - Notification handlers

3. **Privacy Features**
   - Anonymous user IDs
   - Generic notifications
   - Secure scheduling

### Phase 3: Enhancements
1. **Advanced Features**
   - Smart scheduling
   - Batch operations
   - Templates/presets
   - Social features (optional)

2. **Analytics**
   - Completion patterns
   - Optimal reminder times
   - Practice insights

## Testing Checklist

### Phase 1 Tests
- [ ] Add new activity with all frequency types
- [ ] Edit existing activity
- [ ] Delete activity with confirmation
- [ ] Pause/resume activities
- [ ] Check reminder appears when app opens
- [ ] Mark activity as done/skip
- [ ] Verify stats update correctly
- [ ] Test data persistence across sessions
- [ ] Verify IndexedDB migration

### Phase 2 Tests
- [ ] Push permission request flow
- [ ] Notification delivery (all platforms)
- [ ] Notification click handling
- [ ] Offline/online transitions
- [ ] Server schedule sync
- [ ] Privacy preservation
- [ ] Multiple device handling

### Phase 3 Tests
- [ ] Advanced scheduling logic
- [ ] Template functionality
- [ ] Export/import features
- [ ] Performance with many activities

## Security Considerations

1. **Data Privacy**
   - All activity names stored locally only
   - Server receives only timing information
   - No analytics or tracking

2. **Push Security**
   - VAPID authentication
   - Encrypted push payloads
   - Secure subscription storage

3. **Input Validation**
   - Sanitize activity names
   - Validate scheduling inputs
   - Prevent XSS in notifications

## Performance Considerations

1. **Storage Limits**
   - Monitor IndexedDB usage
   - Implement data cleanup
   - Compress completion history

2. **Battery Usage**
   - Minimize background operations
   - Efficient scheduling algorithms
   - Respect device power state

3. **Network Usage**
   - Batch notification updates
   - Compress server requests
   - Handle offline gracefully

## Accessibility Requirements

1. **Screen Readers**
   - Proper ARIA labels
   - Announce state changes
   - Keyboard navigation

2. **Visual Design**
   - High contrast support
   - Clear touch targets
   - Readable fonts

3. **Cognitive Load**
   - Simple language
   - Clear instructions
   - Progressive disclosure

## Future Considerations

1. **Potential Features**
   - Apple Watch / WearOS apps
   - Voice reminders
   - AI-suggested activities
   - Group challenges

2. **Scalability**
   - Multi-region workers
   - Database sharding
   - CDN integration

3. **Monetization (Optional)**
   - Premium notification features
   - Advanced analytics
   - Coaching integrations

## Resources

### Cloudflare Worker Template
```javascript
// worker.js
export default {
  async scheduled(event, env, ctx) {
    const now = new Date();
    const hour = now.getUTCHours();
    
    // Get all schedules for this hour
    const schedules = await env.SCHEDULES.list({ prefix: `hour:${hour}` });
    
    for (const schedule of schedules.keys) {
      const data = await env.SCHEDULES.get(schedule.name);
      await sendNotification(JSON.parse(data));
    }
  },
  
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/subscribe' && request.method === 'POST') {
      const body = await request.json();
      // Store subscription
      return new Response('OK');
    }
    
    return new Response('Not found', { status: 404 });
  }
};
```

### VAPID Key Generation
```bash
# Generate keys for push notifications
npx web-push generate-vapid-keys

# Output:
# Public Key: BId3F7Oe6...
# Private Key: GpJgUH9H...
```

### Useful Libraries
- `web-push`: Node.js push notification library
- `idb`: Improved IndexedDB API
- `workbox`: Service worker toolkit
- `date-fns`: Date manipulation

## Support & Maintenance

1. **User Support**
   - In-app help section
   - FAQ for notifications
   - Troubleshooting guide

2. **Developer Notes**
   - Keep activity names generic in logs
   - Test across time zones
   - Monitor push delivery rates

3. **Updates**
   - Semantic versioning
   - Migration scripts
   - Changelog maintenance