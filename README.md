# FamilySafe - Secure Password Manager

FamilySafe is a modern, secure, and feature-rich password manager designed for families and individuals. Built with a focus on security and ease of use, it helps you manage your digital life safely. This application was built using Next.js, React, Firebase, and ShadCN UI.

## Key Features

-   **Secure Credential Management**: Easily add, edit, and delete login credentials for all your websites and applications.
-   **End-to-End Encryption**: Your sensitive data (usernames, passwords, notes) is encrypted on your device using AES-256 before being stored, ensuring only you can access it.
-   **Password Sharing**: Securely share specific credentials with family members you've added to your group.
-   **Password Health Report**: Proactively improve your security with a comprehensive report that identifies weak, reused, or compromised passwords using the 'Have I Been Pwned' service securely.
-   **Device Management**: View all devices that have logged into your account and remotely revoke access from any session you don't recognize or trust.
-   **Audit Logs**: Keep track of all important activities in your account, including sign-ins, credential changes, and family member updates.
-   **Family Group Management**: Add or remove family members to control who you can share credentials with.
-   **Settings & Profile Management**: Update your display name and manage your account security, including requesting password resets.
-   **Support & FAQ**: Get help with common questions and contact support directly through the app.

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
# Firebase Configuration
# Find these in your Firebase project settings -> General
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# SendGrid Configuration (for sending credentials via email)
# Create an API key in your SendGrid dashboard
SENDGRID_API_KEY=your_sendgrid_api_key
# This must be a verified sender identity in your SendGrid account
SENDGRID_FROM_EMAIL=your_verified_sendgrid_email
```

**Firebase Setup:**
1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  In your project, go to **Project Settings** > **General** and find your web app's configuration details to fill in the variables above.
3.  Go to **Authentication** > **Sign-in method** and enable **Email/Password** and **Google** providers.
4.  Go to **Firestore Database**, create a database, and start in **Production mode**. You will need to configure your security rules to allow authenticated users to read/write their own data.

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
