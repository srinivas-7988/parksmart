import { useEffect, useState } from 'react'

// Ported from js/main.js: setInterval(..., 8000) => 800 + random(100)
export function useLiveAvailability() {
  const [value, setValue] = useState(() => 847)

  useEffect(() => {
    const id = setInterval(() => setValue(800 + Math.floor(Math.random() * 100)), 8000)
    return () => clearInterval(id)
  }, [])

  return value
}
