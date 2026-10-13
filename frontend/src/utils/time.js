// ═══ TIME / FORMAT HELPERS ═══ (ported 1:1 from the original js/main.js and inline label logic)

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function formatClock(date = new Date()) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

export function formatHour12(date = new Date()) {
  const h12 = date.getHours() % 12 || 12
  const m = String(date.getMinutes()).padStart(2, '0')
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM'
  return `${h12}:${m} ${ampm}`
}

export function dayName(date = new Date()) {
  return DAY_NAMES[date.getDay()]
}

// Matches the original (slightly quirky) 24h -> label conversion used for time-slot options
export function formatTimeOption(t) {
  return t <= 12 ? `${t}:00 ${t === 12 ? 'PM' : 'AM'}` : `${t - 12}:00 PM`
}

export function formatMMSS(totalSeconds) {
  const s = Math.max(0, totalSeconds)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function getGreeting(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'Good morning,'
  if (h >= 12 && h < 17) return 'Good afternoon,'
  return 'Good evening,'
}

