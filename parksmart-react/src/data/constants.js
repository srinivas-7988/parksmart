// ═══ DATA ═══ (ported 1:1 from the original js/data.js)

export const LOCS = [
  { name: 'Brigade Road', avail: 72, slots: 40 },
  { name: 'Commercial Street', avail: 45, slots: 32 },
  { name: 'MG Road', avail: 61, slots: 48 },
  { name: 'Indiranagar', avail: 83, slots: 36 },
  { name: 'Koramangala', avail: 38, slots: 44 },
  { name: 'Jayanagar', avail: 91, slots: 30 },
  { name: 'Orion Mall', avail: 56, slots: 80 },
  { name: 'Garuda Mall', avail: 29, slots: 60 },
]

export const DURATIONS = [1, 2, 3, 4] // hrs, ₹30/hr

export const TIMES = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] // 24h, default 18

export const NAV = [
  ['home', '🏠', 'Home'],
  ['book', '🅿', 'Book'],
  ['mybookings', '📋', 'Bookings'],
  ['profile', '👤', 'Profile'],
]

// [pillBg, hex, label, icon, iconBg]
export const STATUS_META = {
  active: ['bg-teal', '#00c896', 'Active', '🟢', 'bg-green'],
  penalty: ['bg-amber', '#f59e0b', 'Penalty', '⚠', 'bg-amber'],
  completed: ['bg-green', '#22c55e', 'Done', '✅', 'bg-blue'],
}

export const SAMPLE_RECENT = [
  { loc: 'Brigade Road', slot: 'A3', date: 'Today, 2:00 PM', status: 'active', total: 60 },
  { loc: 'MG Road', slot: 'B7', date: 'Yesterday, 4:00 PM', status: 'completed', total: 90 },
  { loc: 'Koramangala', slot: 'C2', date: 'Apr 8, 11:00 AM', status: 'penalty', total: 60 },
]
