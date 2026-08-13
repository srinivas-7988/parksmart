const API_BASE_URL = 'http://127.0.0.1:8000/api'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('ps_token')
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  }

  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error('Cannot connect to ParkSmart backend. Start FastAPI on port 8000.')
  }

  let data = {}
  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.detail || data.message || `Request failed with status ${response.status}`)
  }

  return data
}

// AUTH
export function registerUser(userData) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  })
}

export async function loginUser(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (data.access_token) localStorage.setItem('ps_token', data.access_token)
  if (data.user) localStorage.setItem('ps_user', JSON.stringify(data.user))
  return data
}

export function getCurrentUser() {
  return request('/auth/me')
}

export function logoutUser() {
  localStorage.removeItem('ps_token')
  localStorage.removeItem('ps_user')
}

export function forgotPassword(email) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function verifyOTP(email, otp) {
  return request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
}

export function resetPassword(email, otp, newPassword) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, new_password: newPassword }),
  })
}

// VEHICLES
export function getMyVehicles() {
  return request('/vehicles/')
}

export function addVehicle(vehicleData) {
  return request('/vehicles/', {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  })
}

export function updateVehicle(vehicleNumber, vehicleData) {
  return request(`/vehicles/${encodeURIComponent(vehicleNumber)}`, {
    method: 'PUT',
    body: JSON.stringify(vehicleData),
  })
}

export function deleteVehicle(vehicleNumber) {
  return request(`/vehicles/${encodeURIComponent(vehicleNumber)}`, { method: 'DELETE' })
}

// PARKING
export function getParkingSlots() {
  return request('/parking/')
}

export function getAvailableParkingSlots() {
  return request('/parking/available')
}

// BOOKINGS
export function createBooking(bookingData) {
  return request('/bookings/', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  })
}

export function getMyBookings() {
  return request('/bookings/')
}

export function cancelBooking(slotNumber) {
  return request(`/bookings/${encodeURIComponent(slotNumber)}`, { method: 'DELETE' })
}

export function confirmArrival(bookingId) {
  return request(`/bookings/${encodeURIComponent(bookingId)}/arrive`, { method: 'POST' })
}

// PAYMENTS
export function createPayment(bookingId, amount) {
  return request('/payment/create', {
    method: 'POST',
    body: JSON.stringify({ booking_id: bookingId, amount }),
  })
}

export function payNow(paymentId) {
  return request(`/payment/pay/${encodeURIComponent(paymentId)}`, { method: 'POST' })
}

export function getPaymentHistory() {
  return request('/payment/history')
}

// QR
export function generateQR(bookingId) {
  return request(`/qr/generate/${encodeURIComponent(bookingId)}`, { method: 'POST' })
}

export function getQRUrl(bookingId) {
  return `${API_BASE_URL}/qr/my/${encodeURIComponent(bookingId)}`
}

export async function getQRBlobUrl(bookingId) {
  const token = localStorage.getItem('ps_token')
  const response = await fetch(`${API_BASE_URL}/qr/my/${encodeURIComponent(bookingId)}`, {
    headers: { Authorization: `Bearer ${token || ''}` },
  })
  if (!response.ok) throw new Error('QR code not available')
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

// DASHBOARDS
export function getUserDashboard() {
  return request('/dashboard/user')
}

export function getAdminDashboard() {
  return request('/dashboard/admin')
}

export function getAdminPaymentDashboard() {
  return request('/payment/admin')
}

export function getAdminParkingSlots() {
  return request('/parking/')
}

export { API_BASE_URL }
