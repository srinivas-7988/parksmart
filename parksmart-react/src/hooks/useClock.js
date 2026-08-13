import { useEffect, useState } from 'react'
import { dayName, formatClock, formatHour12 } from '../utils/time'

// Ported from js/main.js setTime(), which ran every 30s
export function useClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  return {
    timeStr: formatClock(now),
    hour12Str: formatHour12(now),
    dayStr: dayName(now),
  }
}
