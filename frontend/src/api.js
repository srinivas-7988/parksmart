export function getApiBaseUrl() {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "")
    }

    if (typeof window !== "undefined") {
        const hostname = window.location.hostname
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            return "http://localhost:8000/api"
        }
        if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            return `http://${hostname}:8000/api`
        }
    }

    return "https://parksmart-lzay.onrender.com/api"
}

const API_BASE_URL = getApiBaseUrl()


/*
COMMON REQUEST FUNCTION
*/

async function request(endpoint, options = {}) {

    const token = localStorage.getItem("ps_token")

    const headers = {
        ...(options.body
            ? { "Content-Type": "application/json" }
            : {}),
        ...(options.headers || {}),
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`
    }

    let response
    try {
        response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers,
            }
        )
    } catch (err) {
        console.error(`[API Network Error] Failed connecting to ${API_BASE_URL}${endpoint}:`, err)
        throw new Error(
            `Unable to connect to server at ${API_BASE_URL}. Please ensure the backend is running.`
        )
    }

    let data = {}

    try {
        data = await response.json()
    } catch {
        data = {}
    }

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.message ||
            `Request failed with status ${response.status}`
        )
    }

    return data
}


/*
AUTHENTICATION
*/

export async function registerUser(userData) {

    return request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
    })

}


export async function loginUser(email, password) {

    const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            email,
            password,
        }),
    })

    if (data.access_token) {

        localStorage.setItem(
            "ps_token",
            data.access_token
        )

    }

    if (data.user) {

        localStorage.setItem(
            "ps_user",
            JSON.stringify(data.user)
        )

    }

    return data
}


export async function getCurrentUser() {

    return request("/auth/me")

}


export function logoutUser() {

    localStorage.removeItem("ps_token")
    localStorage.removeItem("ps_user")

}


/*
FORGOT PASSWORD
*/

export async function forgotPassword(email) {

    return request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
            email,
        }),
    })

}


export async function verifyOTP(email, otp) {

    return request("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
            email,
            otp,
        }),
    })

}


export async function resetPassword(
    email,
    otp,
    newPassword
) {

    return request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
            email,
            otp,
            new_password: newPassword,
        }),
    })

}


/*
PHONE OTP
*/

export async function sendPhoneOTP(phone) {

    return request("/auth/send-phone-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
    })

}


export async function verifyPhoneOTP(phone, otp) {

    const data = await request("/auth/verify-phone-otp", {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
    })

    if (data.access_token) {
        localStorage.setItem("ps_token", data.access_token)
    }

    if (data.user) {
        localStorage.setItem("ps_user", JSON.stringify(data.user))
    }

    return data
}


/*
VEHICLES
*/

export async function getMyVehicles() {

    return request("/vehicles/")

}


export async function addVehicle(vehicleData) {

    return request("/vehicles/", {
        method: "POST",
        body: JSON.stringify(vehicleData),
    })

}


export async function deleteVehicle(vehicleNumber) {

    return request(
        `/vehicles/${encodeURIComponent(vehicleNumber)}`,
        {
            method: "DELETE",
        }
    )

}


/*
BOOKINGS
*/

export async function createBooking(bookingData) {

    return request("/bookings/", {
        method: "POST",
        body: JSON.stringify(bookingData),
    })

}


/*
Get all bookings belonging to
the currently logged-in user.
*/

export async function getMyBookings() {

    return request("/bookings/")

}


export async function cancelBooking(slotOrId) {

    return request(
        `/bookings/${encodeURIComponent(slotOrId)}`,
        {
            method: "DELETE",
        }
    )

}


/*
Trigger check and expiry of overdue active bookings.
Deducts 20% penalty and initiates 80% refund.
*/
export async function checkNoShows() {
    return request("/bookings/check-no-shows", {
        method: "POST"
    })
}


/*
Explicitly trigger refund for a booking.
*/
export async function refundBooking(bookingId) {
    return request(`/payment/refund/${encodeURIComponent(bookingId)}`, {
        method: "POST"
    })
}



/*
PARKING SLOTS
*/

export async function getParkingSlots(location) {

    return request(
        `/parking/location/${encodeURIComponent(location)}`
    )

}


/*
PAYMENTS
*/

export async function createPayment(
    bookingId,
    amount
) {

    return request("/payment/create", {
        method: "POST",
        body: JSON.stringify({
            booking_id: bookingId,
            amount,
        }),
    })

}


export async function payNow(paymentId) {

    return request(
        `/payment/pay/${paymentId}`,
        {
            method: "POST",
        }
    )

}


export async function getPaymentHistory() {

    return request("/payment/history")

}


export async function getRazorpayConfig() {

    return request("/payment/razorpay/config")

}


export async function createRazorpayOrder(bookingId, amount) {

    return request("/payment/razorpay/create-order", {
        method: "POST",
        body: JSON.stringify({
            booking_id: bookingId,
            amount: Number(amount),
        }),
    })

}


export async function verifyRazorpayPayment(payload) {

    return request("/payment/razorpay/verify", {
        method: "POST",
        body: JSON.stringify(payload),
    })

}


/*
QR CODE
*/

export async function generateQR(bookingId) {

    return request(
        `/qr/generate/${bookingId}`,
        {
            method: "POST",
        }
    )

}


export function getQRUrl(bookingId) {

    const token =
        localStorage.getItem("ps_token")

    return `${API_BASE_URL}/qr/my/${bookingId}?token=${encodeURIComponent(
        token || ""
    )}`

}


/*
ADMIN & DASHBOARD
*/

export async function getAdminDashboard() {
    return request("/dashboard/admin")
}


export async function getAdminPaymentDashboard() {

    return request("/payment/admin")

}


export async function getAdminParkingSlots() {

    return request("/parking/admin")

}


export async function getAvailableSlots() {

    return request("/parking/available")

}


export async function getUserDashboard() {

    return request("/dashboard/user")

}


export async function verifyQRCode(bookingId) {
    return request(`/qr/verify/${encodeURIComponent(bookingId)}`, {
        method: "POST"
    })
}


export async function checkInBooking(bookingId) {
    return request(`/qr/check-in/${encodeURIComponent(bookingId)}`, {
        method: "POST"
    })
}


export async function checkOutBooking(bookingId) {
    return request(`/qr/check-out/${encodeURIComponent(bookingId)}`, {
        method: "POST"
    })
}


/*
ML PREDICTION (Random Forest)
*/

export async function predictParkingML(hour, day, traffic, capacity = 100, occupied = 50) {

    return request("/prediction/predict", {
        method: "POST",
        body: JSON.stringify({
            hour: Number(hour),
            day: Number(day),
            traffic: String(traffic).toLowerCase(),
            capacity: Number(capacity),
            occupied: Number(occupied),
        }),
    })

}


/*
EXPORT API BASE URL
*/

export { API_BASE_URL }
