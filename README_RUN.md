# ParkSmart - Local Run

## 1. Backend

Open a terminal in `backend`:

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install packages:

```bash
pip install -r requirements.txt
```

Copy `.env.example` to `.env` and fill in your MongoDB Atlas and Gmail settings.

Start FastAPI:

```bash
python -m uvicorn app.main:app --reload
```

Backend:

`http://127.0.0.1:8000`

Swagger:

`http://127.0.0.1:8000/docs`

## 2. Frontend

Open another terminal in `parksmart-react`:

```bash
npm install
npm run dev
```

Frontend:

`http://localhost:5173`

## 3. Test flow

1. Register a new account and enter a vehicle number.
2. Login with that account.
3. Open **Book**.
4. Load parking slots and select an available slot.
5. Open booking summary.
6. Use the mock payment buttons.
7. Backend creates the booking, creates the payment, confirms the booking and generates the QR code.
8. Check MongoDB collections: `users`, `vehicles`, `parking_slots`, `bookings`, `payments`, `qr_codes`.
9. Check the registered email for the welcome, booking, payment and QR emails.

## Important

The payment screen is a **mock payment flow**. It does not charge a real card or UPI account.

Do not commit `.env` or Gmail app passwords to GitHub.
