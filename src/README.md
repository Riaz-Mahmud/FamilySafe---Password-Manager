
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
-   **Memory Vault**: A secure, encrypted space to preserve life memories, stories, and photos as a digital family heirloom.

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
-   **Browser Extension & Smart Sync**: Build a browser extension for autofilling credentials. This would be the foundation for features like **Smart Sync**, which could suggest saving passwords for frequently visited sites by analyzing local browser history securely.
-   **Localization & Internationalization**: Help make FamilySafe accessible to a global audience.
-   **Third-Party Integrations**: Develop a plugin or extension system for integrating with other services.
-   **Enhanced Testing**: Improve our test coverage with more unit, integration, and end-to-end tests.
-   **CI/CD Workflow Improvements**: Help streamline our development and deployment pipeline.

Below are proposals for advanced features that would require significant architectural work and expertise.

### 💡 Advanced Feature Proposal: "Memory Vault"

-   **Purpose**: To securely preserve important life memories and digital family history, creating a living, encrypted digital heirloom for future generations.
-   **Core Concepts**:
    -   **Legacy Messaging**: Record secure, time-locked audio or text messages to be delivered to a loved one in the future (e.g., when they turn 18).
    -   **Advice Capsules**: Encrypted notes attached to life milestones (e.g., "When you go to college, read this").
    -   **Story Cards**: Structured templates to share family origin stories with photos and values. The current "Memories" feature is the first step toward this.
    -   **Family Time Capsule**: Configure memories to unlock on specific future dates.

### 📍 Advanced Feature Proposal: "Geo-Smart Vaults"

-   **Purpose**: To add a layer of physical security by allowing access to specific vaults only from trusted geographical locations (e.g., "Bills Vault" only opens at home).
-   **Security Warning**: A purely client-side implementation of this is **not secure**, as browser location can be easily spoofed. A robust implementation is required.
-   **Proposed Architecture**:
    1.  **Per-Vault Encryption**: Each vault must have its own unique encryption key, separate from the user's master key.
    2.  **Key Wrapping**: The user's master key is used to encrypt each individual vault key. These encrypted vault keys are stored in Firestore.
    3.  **Location Verification**: When accessing a geo-locked vault, the app sends the device's current coordinates to a secure Firebase Function.
    4.  **Conditional Key Release**: The Firebase Function verifies if the coordinates are within the vault's pre-defined geofence. **Only if the location is valid** does the function return the *encrypted vault key* to the client.
    5.  **Client-Side Decryption**: The client uses the master key to decrypt the received vault key, which it can then use to decrypt the vault's contents. This ensures that the client never has access to the vault's key unless the physical location is verified by the server.

### 🧬 Advanced Feature Proposal: "Digital DNA" Behavioral Biometrics

-   **Purpose**: To create a secure identity recovery path for users who have lost their master password AND their recovery kit, by verifying their identity through unique behavioral patterns.
-   **Core Concept**: The system continuously and passively learns a user's unique patterns—such as typing rhythm, mouse movement, and navigation habits—to create a "behavioral fingerprint."
-   **Proposed Architecture**:
    1.  **Behavioral Data Collection (Client-Side)**: Capture raw data (e.g., `keydown` timings, mouse velocity) locally in the browser. This data **never** leaves the device.
    2.  **On-Device Profile Generation (Client-Side)**: Use a library like **TensorFlow.js** to process the raw data into an abstract statistical model (the "fingerprint"). This model, not the raw data, is what gets stored.
    3.  **Secure Fingerprint Storage**: The generated fingerprint is encrypted using the user's key and stored in a private Firestore collection. The server only ever sees an encrypted blob.
    4.  **Identity Verification (Client + Firebase Functions)**:
        -   During recovery, a user performs a challenge (e.g., types a sentence). A live fingerprint is generated.
        -   The app fetches the encrypted stored fingerprint. The user is prompted for their master password **only** to decrypt this stored fingerprint locally.
        -   Both the live and the decrypted stored fingerprints (both are abstract models) are sent to a secure Firebase Function.
        -   The Function, protected by **App Check**, compares the two fingerprints and returns a confidence score.
        -   Based on the score, the app either grants access or requires another recovery method.

### 💡 Advanced Feature Proposal: "Digital Guardian" – Contextual Risk Advisor AI

-   **Purpose**: To create an AI-powered assistant that proactively watches over a family's digital hygiene, offering contextual advice, warnings, and educational moments.
-   **Core Concept**: An intelligent agent that understands the context of actions within the vault and provides helpful, non-intrusive guidance to improve security posture.
-   **Key Capabilities**:
    -   **Contextual Suggestions**: "You added a Netflix login but haven’t assigned it to a vault yet — would you like to share it with the Family vault?"
    -   **Hygiene Enforcement**: "This password is now used for 4 different sites. Using unique passwords is much safer. Let's fix that."
    -   **Reminder System**: "You haven't generated a new Recovery Kit in over a year. It's a good idea to refresh it."
    -   **Parental Guidance**: "It looks like a child's account just saved a credit card number in their 'Gaming' vault. You may want to review this."
-   **Personality Modes**: To make the advice more engaging, the Guardian could have different personalities the user can choose from:
    -   **Gentle Coach**: Friendly, encouraging, and helpful.
    -   **Strict Security Nerd**: Technical, precise, and focused on maximum security.
    -   **Family Humor Mode**: Uses light-hearted jokes and relatable family scenarios ("Don't reuse that password, Dad! Even the dog knows better.").
-   **Proposed Architecture**:
    1.  **Event-Driven Genkit Flows**: Most user actions (e.g., `addCredential`, `updateFamilyMember`) would trigger a non-blocking call to a central "guardian" Genkit flow.
    2.  **Contextual Analysis**: The flow would receive the action type (e.g., `REUSED_PASSWORD_DETECTED`) and relevant context (e.g., the credential involved). It would use an LLM to analyze the situation and decide if a suggestion is warranted.
    3.  **Suggestion Generation**: If a risk is identified, the LLM would generate a helpful message tailored to the chosen personality mode. The output would be a structured object (e.g., `{ suggestion: "...", severity: "low", action_url: "/settings/security" }`).
    4.  **Notification System Integration**: The generated suggestion would be pushed to a new 'suggestions' or 'guardian' collection in Firestore for the user.
    5.  **UI Component**: A dedicated UI component (e.g., a dismissible banner, a popover from a mascot icon) would listen to this collection and display the suggestions to the user.


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

    