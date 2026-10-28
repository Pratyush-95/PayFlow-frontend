# PayFlow Frontend

Responsive React + Vite landing page, 3D-inspired animated hero, signup/login/OTP verification, and a protected starter dashboard.

## Run it

```powershell
cd C:\Projects\JavaFullStackDevelopment\payflow-frontend
npm install
npm run dev
```

Open http://localhost:5173. If you are using the ZIP in a different folder, open that folder in VS Code and run the commands there.

## Backend connection

The Vite dev server proxies `/api` to `http://localhost:8080`.

Expected endpoints in this starter:
- `POST /api/auth/register` with `{ "email", "password" }`
- `POST /api/auth/verify-otp` with `{ "email", "otp" }`
- `POST /api/auth/login` with `{ "email", "password" }`

If your backend DTO field names or endpoint paths differ, adjust `src/pages/LoginPage.jsx`, `SignupPage.jsx`, and `VerifyOtpPage.jsx`.

## Security notes

- Do not put Razorpay key secrets, webhook secrets, database passwords, or JWT signing secrets in frontend code.
- The starter stores the access token in `sessionStorage` for local demonstration. For production, review a secure authentication design (often HttpOnly, Secure, SameSite cookies with suitable CSRF protection) with your backend.
- Never collect real card numbers or CVV in this demo UI. Use the payment provider's supported checkout flow.
