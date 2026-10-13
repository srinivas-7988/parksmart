import { useEffect, useState } from 'react'
import { getAvailableSlots } from '../api'

export function useLiveAvailability() {
  const [value, setValue] = useState(192)

  useEffect(() => {
    let isMounted = true

    async function fetchAvailability() {
      try {
        const data = await getAvailableSlots()
        if (isMounted && typeof data.total === 'number') {
          setValue(data.total)
        }
      } catch {
        // Keep current count on intermittent failure
      }
    }

    fetchAvailability()
    const id = setInterval(fetchAvailability, 10000)

    return () => {
      isMounted = false
      clearInterval(id)
    }
  }, [])

  return value
}
