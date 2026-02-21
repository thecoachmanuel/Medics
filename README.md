## Medics – Online Doctor Consultation & Booking Platform

Medics is a full‑stack telemedicine platform built with the Next.js App Router. It allows patients to discover verified doctors, book online consultations, pay securely with Paystack, and join video or voice calls. Doctors manage their schedule, consults, and patient payments from a dedicated dashboard.

The app is designed with production‑grade patterns: typed TypeScript, Supabase as a managed Postgres backend, secure Paystack integration, and a clean separation between patient and doctor experiences.

---

## Features

- Patient & Doctor authentication (separate login/signup flows)
- Doctor onboarding with:
  - Specialization, qualifications, experience, and about profile
  - Hospital/clinic information
  - Availability window (date range, daily working hours, excluded days)
  - Slot duration configuration
- Doctor discovery page with filters
- End‑to‑end booking flow:
  - Patient selects doctor, date, and an available time slot
  - Symptoms and consultation type (Video / Voice) capture
  - Real‑time booked slot disabling to prevent double bookings
- Secure payments with Paystack:
  - Inline Paystack popup
  - Server‑side verification via `/api/paystack/verify`
  - Webhook handling via `/api/paystack/webhook`
  - Payments stored in `payments` table and linked to appointments
- Dashboards:
  - Patient dashboard with upcoming and past appointments
  - Doctor dashboard with daily schedule, appointment details and prescriptions
  - Dedicated payments pages for both roles
- Video/voice consultation using Zego Cloud prebuilt UI
- Cloudinary integration for profile image uploads

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **State management:** Zustand
- **Backend:** Supabase (Postgres, auth, RLS, migrations)
- **Payments:** Paystack (inline, verify endpoint, webhook)
- **Realtime calls:** Zego UIKit Prebuilt
- **UI:** Tailwind CSS 4, Radix UI primitives, shadcn‑style components

---

## Project Structure (high‑level)

```text
src/
  app/
    (auth)/            # Doctor / Patient login & signup
    (dashboard)/       # Doctor & Patient dashboards and sub‑pages
    api/
      paystack/        # Verify + webhook routes
      upload/          # Cloudinary signed upload route
    doctor-list/       # Public doctor discovery page
    onboarding/        # Doctor and patient onboarding flows
    patient/booking/   # Patient booking flow for a given doctor

  components/
    BookingSteps/      # Calendar, consultation details, payment step
    doctor/            # Doctor dashboard, appointments, payments, prescriptions
    patient/           # Patient dashboard, payments, doctor list
    ui/                # Reusable UI primitives (button, input, card, etc.)

  lib/
    supabase/          # Supabase client, server, and service instances
    types.ts           # Core domain types (User, Doctor, Payment, etc.)
    dateUtils.ts       # Date/slot conversion utilities

  store/
    appointmentStore.ts
    authStore.ts
    doctorStore.ts
    paymentStore.ts

supabase/
  migrations/          # Database schema & RLS policies
```

---

## Getting Started (Local Development)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root (this file is git‑ignored). At minimum you need:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

NEXT_PUBLIC_ZEGOCLOUD_APP_ID=your_zegocloud_app_id
NEXT_PUBLIC_ZEGOCLOUD_SERVER_SECRET=your_zegocloud_server_secret
```

> Use your own credentials for Supabase, Paystack, and Cloudinary. Do not commit this file.

### 3. Apply Supabase migrations

The `supabase/migrations` directory contains the schema for:

- `profiles`, `appointments`, `payments`, `notifications`, and related RLS policies
- Helper functions and RPC to fetch booked slots for doctors

Apply these migrations to your Supabase project using the Supabase CLI or dashboard migration workflow so that the database schema matches the application code.

### 4. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the app.

- Doctor login: `/login/doctor`
- Patient login: `/login/patient`
- Doctor signup: `/signup/doctor`
- Patient signup: `/signup/patient`
- Doctor onboarding: `/onboarding/doctor`
- Patient onboarding: `/onboarding/patient`
- Doctor list (for patients): `/doctor-list`
- Booking page: `/patient/booking/[doctorId]`

---

## Build & Production

To generate a production build:

```bash
npm run build
```

To start the production server locally after a build:

```bash
npm start
```

For deployment, you can host the Next.js app on platforms like Vercel, Render, or any Node‑compatible host. Ensure the same environment variables used in `.env.local` are configured in your deployment environment.

The Paystack live webhook URL is:

```text
https://YOUR_LIVE_DOMAIN/api/paystack/webhook
```

Update this in your Paystack dashboard under **Settings → API Keys & Webhooks**.

---

## Payments & Security Notes

- All payment verification is done server‑side using `PAYSTACK_SECRET_KEY`.
- The `payments` table is protected with Row Level Security so that only the doctor and patient involved can see a given payment.
- The `appointments` table enforces unique active slots per doctor to prevent double bookings.

Ensure you always use HTTPS in production and keep your secret keys in secure environment variables.

---

## License

This project is proprietary to the owner of this repository. Do not redistribute or reuse without permission.
