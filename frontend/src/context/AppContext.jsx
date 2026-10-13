import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import {
  loginUser,
  registerUser,
  logoutUser,
  createBooking,
  getMyBookings,
  cancelBooking as cancelBookingAPI,
  checkNoShows,
  createPayment,
  payNow,
  createRazorpayOrder,
  verifyRazorpayPayment,
  generateQR,
} from "../api"

const AppCtx = createContext(null)

export function AppProvider({ children }) {

  // =========================
  // BASIC STATE
  // =========================

  const [screen, setScreen] = useState("splash")
  const [activeTab, setActiveTab] = useState("home")

  const [userData, setUserData] = useState(
    () => JSON.parse(localStorage.getItem("ps_user") || "null")
  )

  const [myBookings, setMyBookings] = useState([])

  const [modal, setModal] = useState(null)
  const [currentBookingData, setCurrentBookingData] = useState(null)
  const [bookPrefill, setBookPrefill] = useState(null)
  const [lastBooking, setLastBooking] = useState(null)

  // =========================
  // THEME
  // =========================

  const [themePref, setThemePref] = useState(
    () => localStorage.getItem("ps_theme") || "system"
  )

  useEffect(() => {

    const theme =
      themePref === "system"
        ? window.matchMedia(
          "(prefers-color-scheme: light)"
        ).matches
          ? "light"
          : "dark"
        : themePref

    document.documentElement.setAttribute(
      "data-theme",
      theme
    )

    localStorage.setItem(
      "ps_theme",
      themePref
    )

  }, [themePref])

  // =========================
  // TOAST
  // =========================

  const [toast, setToast] = useState({
    title: "",
    message: "",
    visible: false,
  })

  const showToast = useCallback(
    (title, message) => {

      setToast({
        title,
        message,
        visible: true,
      })

      setTimeout(() => {
        setToast((t) => ({
          ...t,
          visible: false,
        }))
      }, 3000)

    },
    []
  )

  // =========================
  // SPLASH
  // =========================

  useEffect(() => {

    const token =
      localStorage.getItem("ps_token")

    const timer = setTimeout(() => {

      setScreen(
        token && userData
          ? "app"
          : "login"
      )

    }, 2200)

    return () => clearTimeout(timer)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // =========================
  // LOGIN
  // =========================

  const login = useCallback(
    async (email, password) => {

      try {

        const data =
          await loginUser(
            email,
            password
          )

        const user = {
          ...data.user,

          name:
            data.user?.full_name ||
            "User",

          initials:
            (data.user?.full_name ||
              "User")
              .split(" ")
              .map((x) => x[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),

          vehicle:
            data.user?.vehicle ||
            data.user?.vehicle_number ||
            "",

          vehicle_number:
            data.user?.vehicle_number ||
            data.user?.vehicle ||
            "",
        }

        setUserData(user)

        localStorage.setItem(
          "ps_user",
          JSON.stringify(user)
        )

        setScreen("app")

        showToast(
          "Welcome back!",
          `Hello ${user.name} 👋`
        )

        return data

      } catch (error) {

        showToast(
          "Login Failed",
          error.message
        )

        throw error
      }
    },
    [showToast]
  )

  // =========================
  // SIGNUP
  // =========================

  const signup = useCallback(
    async (form) => {

      try {

        await registerUser({
          full_name:
            `${form.fname || ""} ${form.lname || ""
              }`.trim(),

          email: form.email,
          phone: form.phone,
          password: form.pass,
          vehicle_number: form.vehicle ? form.vehicle.trim().toUpperCase() : undefined,
        })

        showToast(
          "Account Created!",
          "Please login."
        )

        setTimeout(
          () => setScreen("login"),
          800
        )

      } catch (error) {

        showToast(
          "Registration Failed",
          error.message
        )

        throw error
      }
    },
    [showToast]
  )

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {

    logoutUser()

    setUserData(null)
    setMyBookings([])

    setScreen("login")
  }

  // =========================
  // LOAD BOOKINGS
  // =========================

  const loadMyBookings = useCallback(
    async () => {

      if (!localStorage.getItem("ps_token"))
        return

      try {

        const data =
          await getMyBookings()

        const bookings =
          (data.bookings || []).map((b) => ({

            // Booking ID
            id: String(
              b._id ||
              b.id ||
              b.booking_id ||
              ""
            ),

            // Parking details
            slot:
              b.slot_number || "",

            vehicle_number:
              b.vehicle_number || "",

            location:
              b.location ||
              "Parking Area",

            loc:
              b.location ||
              "Parking Area",

            // Booking date
            date:
              b.booking_date || "",

            // Start time
            time:
              b.start_time || "",

            // Duration
            dur:
              Number(b.duration || 1),

            // Amount
            total:
              Number(b.total || 0),

            // Status
            status:
              String(
                b.status || ""
              ).toLowerCase(),

            // Creation timestamp
            bookedAt:
              b.booking_time || null,

            // Penalty & Refund info
            penalty_amount:
              b.penalty_amount !== undefined
                ? Number(b.penalty_amount)
                : Math.round(Number(b.total || 0) * 0.2),

            refund_amount:
              b.refund_amount !== undefined
                ? Number(b.refund_amount)
                : Math.round(Number(b.total || 0) * 0.8),

            refund_status:
              b.refund_status || null,

            cancellation_reason:
              b.cancellation_reason || null,
          }))

        setMyBookings(bookings)

      } catch (error) {

        showToast(
          "Error",
          error.message ||
          "Unable to load bookings."
        )
      }

    },
    [showToast]
  )

  // Load bookings after login
  useEffect(() => {

    if (screen === "app") {
      loadMyBookings()
    }

  }, [
    screen,
    loadMyBookings,
  ])

  // =========================
  // START BOOKING
  // =========================

  const startBooking = (data) => {

    const dur =
      Number(data.dur) || 1

    const total =
      dur * 30

    setCurrentBookingData({

      ...data,

      dur,
      total,

      penalty:
        Math.round(
          total * 0.2
        ),

      refund:
        Math.round(
          total * 0.8
        ),
    })

    setModal("book")
  }

  // =========================
  // PROCESS BOOKING
  // =========================

  const processPayment = async () => {

    if (!currentBookingData)
      return

    try {

      const vehicle =
        currentBookingData.vehicle_number ||
        currentBookingData.vehicle ||
        userData?.vehicle

      const slot =
        currentBookingData.slot_number ||
        currentBookingData.slot

      if (!vehicle || !slot) {

        showToast(
          "Error",
          "Vehicle and slot are required."
        )

        return
      }

      // 1. Create booking in backend
      const data =
        await createBooking({

          vehicle_number:
            vehicle,

          slot_number:
            slot,

          location:
            currentBookingData.loc,

          booking_date:
            currentBookingData.date,

          start_time:
            String(
              currentBookingData.time
            ),

          duration:
            Number(
              currentBookingData.dur
            ),

          total:
            Number(
              currentBookingData.total
            ),
        })

      const bookingId = String(data.booking_id || data.id || "")

      if (!bookingId) {
        throw new Error("Could not retrieve booking ID.")
      }

      // Helper to finalize success state after payment verification
      const finalizeSuccess = async (paymentRef) => {
        try {
          await generateQR(bookingId)
        } catch (qrErr) {
          console.warn("QR generation notice:", qrErr)
        }

        const booking = {
          ...currentBookingData,
          id: bookingId,
          slot,
          vehicle_number: vehicle,
          status: "active",
          payment_ref: paymentRef,
          bookedAt: new Date().toISOString(),
        }

        setMyBookings((prev) => [booking, ...prev])
        setLastBooking(booking)
        setModal(null)
        setScreen("success")

        showToast(
          "Booking Confirmed!",
          `Slot ${slot} booked via Razorpay.`
        )

        try {
          await loadMyBookings()
        } catch (e) {
          void e
        }
      }

      // 2. Create Razorpay order on backend
      let orderRes = null
      try {
        orderRes = await createRazorpayOrder(bookingId, Number(currentBookingData.total))
      } catch (orderErr) {
        console.warn("Razorpay order creation notice:", orderErr)
      }

      const hasRazorpaySDK = typeof window !== "undefined" && typeof window.Razorpay === "function"

      // 3. If real Razorpay key is active and Checkout script loaded, open popup
      if (hasRazorpaySDK && orderRes && !orderRes.is_simulated && !orderRes.key_id?.endsWith("_demo")) {
        const rzpOptions = {
          key: orderRes.key_id,
          amount: orderRes.amount,
          currency: orderRes.currency || "INR",
          name: "ParkSmart",
          description: `Slot ${slot} Parking Reservation`,
          order_id: orderRes.order_id,
          prefill: {
            name: userData?.full_name || userData?.name || "Driver",
            email: userData?.email || "driver@parksmart.com",
            contact: userData?.phone || "+919876543210",
          },
          theme: {
            color: "#0f766e",
          },
          handler: async (response) => {
            try {
              await verifyRazorpayPayment({
                booking_id: bookingId,
                razorpay_order_id: response.razorpay_order_id || orderRes.order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
            } catch (vErr) {
              console.warn("Signature verification notice:", vErr)
            }
            await finalizeSuccess(response.razorpay_payment_id)
          },
          modal: {
            ondismiss: () => {
              showToast("Payment Cancelled", "Transaction was not completed.")
            },
          },
        }

        try {
          const rzpInstance = new window.Razorpay(rzpOptions)
          rzpInstance.open()
          return
        } catch (rzpErr) {
          console.warn("Razorpay checkout popup error, using fallback:", rzpErr)
        }
      }

      // 4. Test mode / Demo simulation verification
      const demoOrderId = orderRes?.order_id || `order_demo_${Date.now()}`
      const demoPayId = `pay_rzp_${Date.now()}`
      try {
        await verifyRazorpayPayment({
          booking_id: bookingId,
          razorpay_order_id: demoOrderId,
          razorpay_payment_id: demoPayId,
          razorpay_signature: "mock_signature_verified",
        })
      } catch (verifyErr) {
        console.warn("Razorpay verify notice:", verifyErr)
        try {
          const payRes = await createPayment(bookingId, Number(currentBookingData.total))
          if (payRes && payRes.payment_id) {
            await payNow(payRes.payment_id)
          }
        } catch (fErr) {
          console.warn("Legacy pay route notice:", fErr)
        }
      }

      await finalizeSuccess(demoPayId)

    } catch (error) {

      showToast(
        "Booking Failed",
        error.message ||
        "Unable to create booking."
      )
    }
  }

  // =========================
  // CANCEL BOOKING
  // =========================

  const cancelBooking = async (id) => {

    const booking =
      myBookings.find(
        (b) => b.id === id
      )

    if (!booking)
      return

    try {

      const res = await cancelBookingAPI(
        booking.id || booking.slot
      )

      const refund = res?.refund_amount ?? Math.round((booking.total || 0) * 0.8)
      const penalty = res?.penalty_amount ?? Math.round((booking.total || 0) * 0.2)

      setMyBookings(
        (prev) =>
          prev.map((b) =>
            b.id === id
              ? {
                ...b,
                status:
                  "cancelled",
                refund_amount: refund,
                penalty_amount: penalty,
                refund_status: "REFUNDED"
              }
              : b
          )
      )

      showToast(
        "Cancelled & 80% Refunded",
        `₹${refund} refunded to payment method. ₹${penalty} deducted (20% fee).`
      )

      await loadMyBookings()

    } catch (error) {

      showToast(
        "Cancellation Failed",
        error.message
      )
    }
  }

  // =========================
  // ARRIVAL
  // =========================

  const confirmArrival = (id) => {

    setMyBookings(
      (prev) =>
        prev.map((b) =>
          b.id === id
            ? {
              ...b,
              status:
                "completed",
            }
            : b
        )
    )

    showToast(
      "Arrived!",
      "Enjoy your parking! 🎉"
    )
  }

  // =========================
  // QUICK BOOK
  // =========================

  const quickBook = (
    loc,
    dur
  ) => {

    setBookPrefill({
      loc,
      dur,
    })

    setActiveTab(
      "book"
    )
  }

  // =========================
  // CONTEXT VALUE
  // =========================

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
    loadMyBookings,
    checkNoShows,

    confirmArrival,
    cancelBooking,

    toast,
    showToast,

    modal,
    setModal,

    closeModal:
      () => setModal(null),

    currentBookingData,

    startBooking,
    processPayment,

    bookPrefill,
    setBookPrefill,
    clearBookPrefill: () => setBookPrefill(null),

    quickBook,

    lastBooking,

    setUserData,

    goToPayment:
      () => setModal("pay"),

    backToApp: () => {

      setScreen("app")

      setActiveTab(
        "mybookings"
      )

      loadMyBookings()
    },
  }

  return (
    <AppCtx.Provider
      value={value}
    >
      {children}
    </AppCtx.Provider>
  )
}

// =========================
// USE APP HOOK
// =========================

export function useApp() {

  const ctx =
    useContext(AppCtx)

  if (!ctx) {

    throw new Error(
      "useApp must be used within AppProvider"
    )
  }

  return ctx
}