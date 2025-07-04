# FamilySafe - Secure Password & Document Manager

FamilySafe is a modern, secure, and feature-rich password manager designed for families and individuals. Built with a focus on security and ease of use, it helps you manage your digital life safely. This application was built using Next.js, React, Firebase, and ShadCN UI.

<p align="center">
  <img alt="Dashboard View" src="https://placehold.co/1200x800.png" data-ai-hint="dashboard application" />
  <br/>
  <em>The main dashboard, showing vaults, credentials, and documents.</em>
</p>

<p align="center">
  <img alt="Add Credential Dialog" src="https://placehold.co/800x600.png" data-ai-hint="dialog form" />
  <br/>
  <em>Adding a new credential with options for expiry reminders, travel safety, and sharing.</em>
</p>


## Key Features

-   **Vault Management**: Organize your credentials and secure documents into separate, encrypted vaults (e.g., "Personal", "Work", "Finances").
-   **Secure Credential & Document Storage**: Easily add, edit, and delete login credentials and sensitive files. All data is encrypted client-side.
-   **End-to-End Encryption**: Your sensitive data is encrypted on your device using AES-256 before being stored, ensuring only you can access it.
-   **Secure Sharing**: Securely share specific credentials or documents with family members. Deleting an item you own automatically revokes access for everyone it was shared with.
-   **Password Health Report**: Proactively improve your security with a comprehensive report that identifies weak, reused, or compromised passwords.
-   **Travel Mode**: A special mode that hides all credentials except those you've specifically marked as "Safe for Travel", providing peace of mind when crossing borders.
-   **Password Expiry Reminders**: Set rotation reminders for your passwords (e.g., every 3, 6, or 12 months) and get visual alerts when they're about to expire.
-   **Real-time Notifications**: Receive in-app notifications for important events, like when an item is shared with you.
-   **Device Management**: View all devices that have logged into your account and remotely revoke access from any session you don't recognize.
-   **Account Recovery Kit**: Generate a secure, one-time recovery kit with a secret key to regain access to your account if you forget your master password.
-   **Audit Logs**: Keep track of all important activities in your account, including sign-ins, credential changes, and sharing events.
-   **Data Export & Deletion**: In compliance with privacy regulations like GDPR & CCPA, you can export all your data or permanently delete your account.
-   **Family Group Management**: Add or remove family members to control who you can share items with.

## Zero-Knowledge Encryption Architecture

FamilySafe is built on a zero-knowledge security model. This means that your sensitive data is encrypted and decrypted locally on your device, and no one but you can access your unencrypted information—not even the FamilySafe team.

The encryption key is derived from your user account details, which are only available to you after you have successfully authenticated. Your master password is never stored or transmitted.

Here is a simple diagram illustrating the data flow:

```
+--------------------------------+                          +--------------------------+
|       Your Device (Browser)    |                          |    Firebase Servers      |
+--------------------------------+                          +--------------------------+
|                                |                          |                          |
|  [ Plaintext Credentials ]     | -- User saves/edits -->  |                          |
|  (e.g., username, password)    |                          |                          |
|                                |                          |                          |
|              +                 |                          |                          |
|              |                 |                          |                          |
|  [ Your Unique User Key ]      |                          |                          |
|  (Only you have this)          |                          |                          |
|              |                 |                          |                          |
|              v                 |                          |                          |
|      AES-256 Encryption        |                          |                          |
|              |                 |                          |                          |
|              v                 |                          |                          |
|  [ Encrypted Ciphertext ]      | <==== Transmitted ====>  |  [ Encrypted Ciphertext ]|
|                                |      (over HTTPS)        |      (Stored in DB)      |
|                                |                          |                          |
+--------------------------------+                          +--------------------------+
```

**How it works:**

1.  **Input:** When you enter a password or a secure note, it exists only in your browser.
2.  **Encryption:** Before this data is saved, it is encrypted directly on your device using the powerful AES-256 standard. The encryption key is unique to your user account and is only accessible after you log in.
3.  **Transmission:** Only the encrypted ciphertext is sent over a secure HTTPS connection to our servers.
4.  **Storage:** We only store the encrypted ciphertext in the database. We have no way to decrypt it.
5.  **Decryption:** When you view your credentials, the encrypted ciphertext is sent back to your device, where it is decrypted locally using your unique key.

This architecture ensures that your sensitive information never leaves your device in an unencrypted state, providing the highest level of security and privacy.


## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **UI Library**: [React](https://react.dev/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication & Firestore)
-   **Email Service**: [SendGrid](https://sendgrid.com/)

## Getting Started

To get this project running locally, you'll need to set up your environment variables.

### 1. Prerequisites

-   Node.js (v18 or later)
-   A Firebase project
-   A SendGrid account (for sending emails)

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd <project-directory>
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root of your project by copying the example below. You will need to get these values from your Firebase project settings and your SendGrid account.

```env
# Firebase Client-Side Configuration
# Find these in your Firebase project settings -> General -> Your web app
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Firebase Server-Side Configuration (for Admin SDK)
# Go to Firebase Console -> Project Settings -> Service accounts -> Generate new private key
# Copy the values from the downloaded JSON file.
# Note: For the private key, you may need to wrap it in quotes if it contains special characters.
FIREBASE_CLIENT_EMAIL=your_firebase_client_email_from_service_account_json
FIREBASE_PRIVATE_KEY=your_firebase_private_key_from_service_account_json

# SendGrid Configuration (for sending emails)
# Create an API key in your SendGrid dashboard
SENDGRID_API_KEY=your_sendgrid_api_key
# This must be a verified sender identity in your SendGrid account
SENDGRID_FROM_EMAIL=your_verified_sendgrid_email
```

**Firebase Setup:**
1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  In your project, go to **Project Settings** > **General** and find your web app's configuration details to fill in the `NEXT_PUBLIC_` variables above.
3.  Go to **Project Settings** > **Service accounts** and click **Generate new private key**. A JSON file will be downloaded. Use the `client_email` and `private_key` values from this file to fill in the server-side variables above.
4.  Go to **Authentication** > **Sign-in method** and enable **Email/Password** and **Google** providers.
5.  Go to **Firestore Database**, create a database, and start in **Production mode**. You will need to configure your security rules to allow authenticated users to read/write their own data.

### 4. Run the Development Server

Once your environment variables are set, you can start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

-   `npm run dev`: Starts the development server.
-   `npm run build`: Creates a production-ready build of the application.
-   `npm run start`: Starts the production server.
-   `npm run lint`: Lints the codebase for potential errors.

## Contributing

We welcome contributions from the community! Whether you're a developer, designer, or security enthusiast, there’s a place for you in the FamilySafe project.

Some areas we're particularly interested in exploring:
-   **Browser Extension**: Build a browser extension for autofilling credentials. This would be the foundation for features like **Smart Sync**, which could suggest saving passwords for frequently visited sites by analyzing local browser history securely.
-   **Memory Vault - Generational Memory Keeper**: A major feature focused on securely preserving life memories and digital family history. This would create a living, encrypted digital heirloom for future generations. Core concepts include:
    -   **Legacy Messaging**: Secure, time-locked audio or text messages to be delivered to loved ones in the future.
    -   **Advice Capsules**: Encrypted notes attached to life milestones (e.g., "When you go to college, read this").
    -   **Story Cards**: Structured templates to share family origin stories with photos and values.
    -   **Family Time Capsule**: Configure memories to unlock on specific future dates.
-   **Localization & Internationalization**: Help make FamilySafe accessible to a global audience.
-   **Third-Party Integrations**: Develop a plugin or extension system for integrating with other services.
-   **Enhanced Testing**: Improve our test coverage with more unit, integration, and end-to-end tests.
-   **CI/CD Workflow Improvements**: Help streamline our development and deployment pipeline.

### Advanced Contribution Idea: "Digital DNA" Behavioral Biometrics

This is a proposal for a sophisticated, privacy-first identity recovery system using behavioral biometrics as a fallback verification method.

#### 🔐 Purpose:
To create a secure identity recovery path for users who have lost their master password AND their recovery kit, by verifying their identity through unique behavioral patterns.

#### 💡 Core Concept:
The system continuously and passively learns a user's unique patterns—such as typing rhythm, mouse movement, and navigation habits—to create a "behavioral fingerprint." This fingerprint is stored in an encrypted state and can be used to verify the user's identity with a certain confidence level during a recovery attempt.

#### 🏛️ Proposed Architecture & Firebase Implementation

This architecture is designed to be privacy-first, adhering to the zero-knowledge principles of the app.

**Phase 1: Behavioral Data Collection (Client-Side)**
-   **What:** Capture raw behavioral data using JavaScript event listeners.
    -   **Typing Rhythm:** Record timestamps and keycodes for `keydown` and `keyup` events. Analyze metrics like flight time (time between releasing one key and pressing the next) and dwell time (time a key is held down).
    -   **Mouse/Touch Dynamics:** Track mouse velocity, acceleration, click patterns, and touch gesture paths (`touchstart`, `touchmove`, `touchend`).
    -   **Navigation Patterns:** Log sequences of UI interactions (e.g., time spent on `Settings` page vs. `Passwords` page).
-   **Privacy:** This raw data is highly sensitive and **must never leave the user's device**. It is used only for the next phase.

**Phase 2: On-Device Profile Generation (Client-Side)**
-   **What:** The raw behavioral data is processed on-device into an abstract statistical model—the "behavioral fingerprint." This is not the raw data itself, but a mathematical representation (e.g., a vector of means, standard deviations, and other statistical moments).
-   **Tools:**
    -   **TensorFlow.js (TFLite for Web):** A lightweight on-device ML library can be trained to create a robust user model. The app would collect data passively and, once enough is gathered, train or update a small model locally in the browser.
    -   **Custom Logic:** Alternatively, a non-ML statistical model can be created by calculating and storing key metrics.
-   **Privacy:** The training and processing happen entirely in the user's browser. The server never sees the raw behavioral data.

**Phase 3: Secure Fingerprint Storage (Client-Side Encryption -> Firestore)**
-   **What:** The generated behavioral fingerprint (the abstract model) is encrypted using the user's unique encryption key (the same one used for passwords, derived from their master password).
-   **Tools:**
    -   **`crypto.ts`:** Use the existing `encryptData` function.
    -   **Firestore:** The encrypted fingerprint is stored in a dedicated document in the user's private Firestore collection (e.g., `/users/{uid}/behavioral_fingerprints/{deviceId}`). Storing it per-device allows for device-specific patterns.
-   **Privacy:** The server only ever stores an encrypted blob that it cannot read, maintaining the zero-knowledge principle.

**Phase 4: Identity Verification During Recovery (Client + Firebase Functions)**
-   **Flow:**
    1.  User starts a recovery flow and is prompted to perform a series of actions (e.g., "Type the following sentence," "Move your mouse to the target").
    2.  A **live behavioral fingerprint** is generated on-device from these actions.
    3.  The app fetches the **encrypted stored fingerprint** from Firestore.
    4.  The user is prompted for their master password. This is **only** used locally to decrypt the stored fingerprint. *If the user has forgotten it, this system cannot work as a standalone.* It's best used as a *secondary* factor alongside a weakened-but-not-forgotten password or another factor.
    5.  Both the live fingerprint and the now-decrypted stored fingerprint (both abstract models, not raw data) are sent to a secure Firebase Function.
-   **Tools:**
    -   **Firebase Functions:** The Function receives the two abstract fingerprints. Its sole job is to run a comparison algorithm (e.g., cosine similarity, Euclidean distance) and return a confidence score (0-100). The comparison logic is kept on the server to prevent it from being reverse-engineered on the client.
    -   **Firebase App Check:** This is **critical**. The Firebase Function must be protected with App Check to ensure that only legitimate instances of your app can request a comparison. This prevents replay attacks and abuse of the verification endpoint.
-   **Result:** Based on the confidence score returned by the Function, the app can decide to either grant access or trigger another verification step (like the secret recovery key).

#### 🤝 How to Contribute
Developing this feature would involve:
-   Researching and implementing lightweight data capture scripts for typing and mouse dynamics.
-   Designing a robust statistical model for the behavioral fingerprint.
-   Integrating TensorFlow.js for on-device model training and inference.
-   Building the secure Firebase Function for fingerprint comparison.
-   Designing the UI/UX for the data collection and recovery challenge phases.

If you have expertise in machine learning, browser security, and front-end development, this is a challenging and rewarding feature to lead.

## Contributors

A special thanks to the following people who have contributed to this project:

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/Riaz-Mahmud">
        <img src="https://github.com/Riaz-Mahmud.png?size=100" width="100px;" alt="Riaz Mahmud" style="border-radius: 50%;"/>
        <br />
        <sub><b>Riaz Mahmud</b></sub>
      </a>
    </td>
  </tr>
</table>
