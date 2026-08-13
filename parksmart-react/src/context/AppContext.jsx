import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  getMyBookings,
  createBooking,
  createPayment,
  payNow,
  generateQR,
  cancelBooking as cancelBookingApi,
  confirmArrival as confirmArrivalApi,
} from '../api'

const AppCtx = createContext(null)

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function makeUser(data) {
  const fullName = data?.full_name || data?.name || 'User'
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : fullName.slice(0, 2).toUpperCase()

  return {
    name: fullName,
    full_name: fullName,
    email: data?.email || '',
    phone: data?.phone || '',
    role: data?.role || 'user',
    vehicle: data?.vehicle || '',
    initials,
  }
}

function normalizeBooking(b) {
  const bookingTime = b.booking_time ? new Date(b.booking_time) : null
  const date = b.booking_date || (bookingTime ? bookingTime.toLocaleDateString('en-IN') : '')
  const time = b.start_time ?? (bookingTime ? bookingTime.getHours() : 18)
  const statusMap = {
    ACTIVE: 'active',
    CONFIRMED: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'penalty',
  }

  return {
    id: b._id || b.id,
    backendId: b._id || b.id,
    loc: b.location || 'ParkSmart Parking',
    slot: b.slot_number || b.slot || '',
    date,
    time,
    dur: b.duration || b.dur || 1,
    total: b.total ?? ((b.duration || b.dur || 1) * 30),
    status: statusMap[b.status] || b.status || 'active',
    backendStatus: b.status,
    vehicle_number: b.vehicle_number,
    bookedAt: b.booking_time,
  }
}

export function AppProvider({ children }) {
  const [screen, setScreen] = useState('splash')
  const [activeTab, setActiveTab] = useState('home')

  // THEME
  const [themePref, setThemePrefState] = useState(
    () => localStorage.getItem('ps_theme') || 'system'
  )

  const resolveTheme = useCallback((pref) => {
    if (pref !== 'system') return pref
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolveTheme(themePref))
  }, [themePref, resolveTheme])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: light)')
    if (!media) return undefined
    const handler = () => {
      if (themePref === 'system') {
        document.documentElement.setAttribute('data-theme', resolveTheme('system'))
      }
    }
    media.addEventListener?.('change', handler)
    return () => media.removeEventListener?.('change', handler)
  }, [themePref, resolveTheme])

  const setThemePref = useCallback((pref) => {
    localStorage.setItem('ps_theme', pref)
    setThemePrefState(pref)
  }, [])

  // TOAST
  const [toast, setToast] = useState({ title: '', message: '', visible: false })
  const toastTimer = useRef(null)

  const showToast = useCallback((title, message) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ title, message, visible: true })
    toastTimer.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }))
    }, 3000)
  }, [])

  // AUTH
  const [userData, setUserData] = useState(() => readJSON('ps_user', null))
  const [myBookings, setMyBookings] = useState(() => readJSON('ps_bk', []))

  const refreshBookings = useCallback(async () => {
    const data = await getMyBookings()
    const bookings = (data.bookings || []).map(normalizeBooking)
    setMyBookings(bookings)
    localStorage.setItem('ps_bk', JSON.stringify(bookings))
    return bookings
  }, [])

  useEffect(() => {
    const boot = async () => {
      const token = localStorage.getItem('ps_token')
      const storedUser = readJSON('ps_user', null)

      if (!token) {
        setTimeout(() => setScreen('login'), 2200)
        return
      }

      try {
        const data = await getCurrentUser()
        const normalized = makeUser(data)
        localStorage.setItem('ps_user', JSON.stringify(normalized))
        setUserData(normalized)
        await refreshBookings()
        setTimeout(() => setScreen('app'), 2200)
      } catch {
        logoutUser()
        setUserData(null)
        setTimeout(() => setScreen('login'), 2200)
      }

      if (!storedUser) localStorage.removeItem('ps_bk')
    }

    boot()
  }, [refreshBookings])

  const login = useCallback(async (email, password) => {
    if (!email || !password) {
      showToast('Login Failed', 'Enter your email and password.')
      return null
    }

    try {
      const data = await loginUser(email.trim(), password)
      const normalized = makeUser(data.user)
      localStorage.setItem('ps_user', JSON.stringify(normalized))
      setUserData(normalized)
      await refreshBookings()
      setActiveTab('home')
      setScreen('app')
      showToast('Welcome back!', `Hello ${normalized.name} 👋`)
      return data
    } catch (error) {
      showToast('Login Failed', error.message || 'Invalid Email or Password')
      return null
    }
  }, [refreshBookings, showToast])

  const signup = useCallback(async (form) => {
    try {
      const fullName = `${form.fname || ''} ${form.lname || ''}`.trim()
      if (!fullName || !form.email || !form.phone || !form.pass) {
        showToast('Registration Failed', 'Please fill all required fields.')
        return null
      }
      if (form.pass.length < 8) {
        showToast('Registration Failed', 'Password must be at least 8 characters.')
        return null
      }

      await registerUser({
        full_name: fullName,
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.pass,
        vehicle_number: form.vehicle?.trim() || null,
      })

      showToast('Account Created!', 'Registration successful. Please login.')
      setTimeout(() => setScreen('login'), 800)
      return true
    } catch (error) {
      showToast('Registration Failed', error.message || 'Unable to create account')
      return null
    }
  }, [showToast])

  const logout = useCallback(() => {
    logoutUser()
    setUserData(null)
    setMyBookings([])
    localStorage.removeItem('ps_bk')
    setActiveTab('home')
    setScreen('login')
    showToast('Signed out', 'See you next time!')
  }, [showToast])

  // BOOKING / PAYMENT FLOW
  const [modal, setModal] = useState(null)
  const [currentBookingData, setCurrentBookingData] = useState(null)
  const [bookPrefill, setBookPrefill] = useState(null)
  const [lastBooking, setLastBooking] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

  const quickBook = useCallback((loc, dur) => {
    setBookPrefill({ loc, dur, id: Date.now() })
    setActiveTab('book')
  }, [])

  const clearBookPrefill = useCallback(() => setBookPrefill(null), [])

  const startBooking = useCallback((data) => {
    const total = data.dur * 30
    const penalty = Math.round(total * 0.2)
    const refund = total - penalty
    setCurrentBookingData({ ...data, total, penalty, refund })
    setModal('book')
  }, [])

  const closeModal = useCallback(() => {
    if (!paymentLoading) setModal(null)
  }, [paymentLoading])

  const goToPayment = useCallback(() => setModal('pay'), [])

  const processPayment = useCallback(async () => {
    const current = currentBookingData
    if (!current || paymentLoading) return

    const vehicle = userData?.vehicle?.trim()
    if (!vehicle) {
      showToast('Vehicle Required', 'Add a vehicle to your account before booking.')
      return
    }

    setPaymentLoading(true)

    let createdBookingId = null

    try {
      const bookingResponse = await createBooking({
        vehicle_number: vehicle,
        slot_number: current.slot,
        location: current.loc,
        booking_date: current.date,
        duration: current.dur,
        start_time: current.time,
      })

      createdBookingId = bookingResponse.booking_id
      const paymentResponse = await createPayment(createdBookingId, current.total)
      await payNow(paymentResponse.payment_id)

      try {
        await generateQR(createdBookingId)
      } catch (qrError) {
        console.warn('QR generation failed:', qrError)
      }

      const bookings = await refreshBookings()
      const created = bookings.find((b) => b.id === createdBookingId) || {
        ...current,
        id: createdBookingId,
        backendId: createdBookingId,
        status: 'active',
      }

      setLastBooking(created)
      setCurrentBookingData(null)
      setModal(null)
      setScreen('success')
      showToast('Payment Successful', 'Your parking slot is confirmed.')
    } catch (error) {
      if (createdBookingId) {
        try {
          await cancelBookingApi(current.slot)
        } catch {
          // Keep the original error visible; cleanup is best effort.
        }
      }
      showToast('Booking Failed', error.message || 'Unable to complete booking.')
    } finally {
      setPaymentLoading(false)
    }
  }, [currentBookingData, paymentLoading, refreshBookings, showToast, userData])

  const backToApp = useCallback(() => {
    setScreen('app')
    setActiveTab('mybookings')
  }, [])

  const confirmArrival = useCallback(async (id) => {
    try {
      await confirmArrivalApi(id)
      const bookings = await refreshBookings()
      setMyBookings(bookings)
      showToast('Arrived!', 'Your arrival has been recorded. 🎉')
    } catch (error) {
      showToast('Arrival Failed', error.message || 'Unable to confirm arrival.')
    }
  }, [refreshBookings, showToast])

  const cancelBooking = useCallback(async (id) => {
    const booking = myBookings.find((b) => b.id === id)
    if (!booking) return

    try {
      await cancelBookingApi(booking.slot)
      await refreshBookings()
      showToast('Cancelled', 'Your booking has been cancelled and the slot is available again.')
    } catch (error) {
      showToast('Cancellation Failed', error.message || 'Unable to cancel booking.')
    }
  }, [myBookings, refreshBookings, showToast])

  const value = {
    screen,
    setScreen,
    activeTab,
    setActiveTab,
    themePref,
    setThemePref,
    userData,
    login,
    signup,
    logout,
    myBookings,
    refreshBookings,
    confirmArrival,
    cancelBooking,
    toast,
    showToast,
    modal,
    closeModal,
    goToPayment,
    startBooking,
    currentBookingData,
    processPayment,
    paymentLoading,
    bookPrefill,
    clearBookPrefill,
    quickBook,
    lastBooking,
    backToApp,
  }

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
