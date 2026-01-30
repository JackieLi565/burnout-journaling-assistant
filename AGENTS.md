# Project Conventions & Architecture

## Core Philosophy: "Privacy-First Orchestrator"

This project uses Next.js 15 as a secure "Orchestrator" between the User (Client) and the Backend Intelligence (Python). We strictly adhere to a **Zero-Trust** model where the Client SDK is stripped of almost all permissions, and the Next.js Server acts as the gatekeeper.

---

## 1. Authentication (Hybrid Session Pattern)

**Objective:** Combine the UX of client-side login with the security of server-side sessions.

- **Client Side (`firebase/auth`):**
  - **Role:** Strictly for UI interaction (Popups, Forms) and obtaining the initial `IdToken`.
  - **Permitted Methods:** `signInWithPopup`, `signInWithEmailAndPassword`, `getIdToken`.
  - **Persistence:** None/Local. Immediately swapped for a cookie.

- **Server Side (`firebase-admin`):**
  - **Role:** Session minting and validation.
  - **Mechanism:** Secure, HTTP-Only Cookies named `__session`.
  - **Flow:**
    1.  Client gets `IdToken` -> Calls Server Action `loginAction(idToken)`.
    2.  Server verifies token -> Mints `SessionCookie` (5 days).
    3.  Server sets `Set-Cookie` header.

- **Middleware (`middleware.ts`):**
  - **Role:** Route protection.
  - **Logic:** Checks for presence of `__session`. Redirects to `/login` if missing on protected routes.

---

## 2. Database (Firestore)

**Objective:** Centralized control via Server Actions.

- **Security Rules (`firestore.rules`):**
  - **Policy:** **DENY ALL**.
  - `allow read, write: if false;`
  - _Rationale:_ Prevents browser console tampering. Forces all logic through the Next.js "Orchestrator".

- **Reads (Fetching Data):**
  - **Location:** Server Components (`app/journal/page.tsx`).
  - **SDK:** `firebase-admin`.
  - **Pattern:**

    ```typescript
    // 1. Verify Cookie
    const session = cookies().get("__session")?.value;
    const decoded = await auth.verifySessionCookie(session);

    // 2. Fetch as Admin (God Mode)
    const snap = await db
      .collection("journal")
      .where("userId", "==", decoded.uid)
      .get();
    ```

- **Writes (Saving Data):**
  - **Location:** Server Actions (`app/actions/journal.ts`).
  - **SDK:** `firebase-admin`.
  - **Pattern:**
    1.  Validate input (Zod).
    2.  Verify Session Cookie.
    3.  Write to Firestore.
    4.  (Optional) Trigger Python Service.
    5.  `revalidatePath()`.

---

## 3. Storage (Blob / Media)

**Objective:** Bypass server bottlenecks without sacrificing security.

- **Security Rules (`storage.rules`):**
  - **Policy:** **DENY ALL**.
  - `allow read, write: if false;`
  - _Rationale:_ We do not allow direct client SDK uploads via standard methods.

- **Upload Strategy (Signed URLs):**
  1.  **Client:** Requests upload permission via Server Action `getUploadUrl(filename)`.
  2.  **Server:** Checks session -> Generates `Signed URL` (Put) valid for 5 mins -> Returns URL.
  3.  **Client:** Performs direct `PUT` request to Google Cloud Storage.
      - _Note:_ `Content-Type` header must match exactly what was signed.

---

## 4. Python Service Communication

**Objective:** Semantic analysis and heavy computation.

- **Topology:** `Next.js Server` -> `Python Service`.
  - _The Client NEVER talks to Python directly._

- **Authentication:**
  - Next.js passes the user's `__session` cookie in the `Authorization` header: `Bearer <cookie_value>`.
  - Python Service uses `firebase-admin.auth.verifySessionCookie()` to authenticate the request.

- **Data Flow:**
  1.  User creates entry -> Next.js Server Action saves to Firestore.
  2.  Next.js fires "Fire and Forget" (void) request to Python `/analyze` endpoint with `entryId`.
  3.  Python fetches text from Firestore -> Runs `LangExtract`.
  4.  Python updates the Firestore document directly with tags/summary.

---

## 5. Directory Structure & Naming

- `app/actions/`: Only Server Actions. Files named by domain (e.g., `auth.ts`, `journal.ts`).
- `lib/firebase.ts`: **Client** SDK configuration (Public keys).
- `lib/firebase-admin.ts`: **Server** SDK configuration (Service Account / Environment Variables).
- `components/`: Client components.
  - Use "Use Client" directive only when interactivity (hooks) is needed.
