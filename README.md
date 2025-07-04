# FamilySafe - Secure Password Manager

FamilySafe is a modern, secure, and feature-rich password manager designed for families and individuals. Built with a focus on security and ease of use, it helps you manage your digital life safely. This application was built using Next.js, React, Firebase, and ShadCN UI.

## Key Features

-   **Secure Credential Management**: Easily add, edit, and delete login credentials for all your websites and applications.
-   **End-to-End Encryption**: Your sensitive data (usernames, passwords, notes) is encrypted on your device using AES-256 before being stored, ensuring only you can access it.
-   **Credential Tagging and Search**: Add custom tags (e.g., "bank", "work") to your credentials and use the powerful search to filter by site, username, or tag.
-   **Password Sharing**: Securely share specific credentials with family members you've added to your group. Click on a family member to see all passwords shared with them.
-   **Password Health Report**: Proactively improve your security with a comprehensive report that identifies weak, reused, or compromised passwords using the 'Have I Been Pwned' service securely.
-   **Device Management**: View all devices that have logged into your account and remotely revoke access from any session you don't recognize or trust.
-   **Audit Logs**: Keep track of all important activities in your account, including sign-ins, credential changes, and family member updates.
-   **Data Export & Deletion**: In compliance with privacy regulations like GDPR & CCPA, you can export all your data or permanently delete your account.
-   **Family Group Management**: Add or remove family members to control who you can share credentials with.
-   **Settings & Profile Management**: Update your display name and manage your account security, including requesting password resets.
-   **Support & FAQ**: Get help with common questions and contact support directly through the app.
-   **Responsive Design**: A seamless experience across all your devices, from desktop to mobile.

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

# SendGrid Configuration (for sending credentials via email)
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

We’re looking for contributions in areas like localization and internationalization, building a browser extension for autofilling credentials that could also enable **smart sync with browser history** (suggesting passwords for frequently visited but unsecured sites). We're also interested in developing a plugin or extension system for third-party integrations, creating a secure CLI tool or API wrapper, improving our test coverage with unit and end-to-end testing, enhancing our CI/CD workflows, and designing a privacy-first analytics dashboard for credential health and usage insights. Whether you're a frontend developer, backend engineer, security enthusiast, or first-time open-source contributor, there’s a place for you in the FamilySafe project!
