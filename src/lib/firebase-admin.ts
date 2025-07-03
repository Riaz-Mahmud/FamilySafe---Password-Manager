
import admin from 'firebase-admin';

let isFirebaseAdminInitialized = false;

// This prevents initialization on every hot-reload in development
if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const missingVars = [
      !projectId && 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      !clientEmail && 'FIREBASE_CLIENT_EMAIL',
      !privateKey && 'FIREBASE_PRIVATE_KEY',
    ].filter(Boolean).join(', ');

    console.warn(`Firebase admin initialization skipped. Missing environment variables: ${missingVars}. Server-side features requiring admin privileges will be disabled.`);
  } else {
    try {
      const serviceAccount = {
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      };
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${projectId}.firebaseio.com`
      });
      isFirebaseAdminInitialized = true;
    } catch (error: any) {
      console.error('Firebase admin initialization error', error);
      // We don't re-throw to allow the app to run without admin features.
    }
  }
} else {
    isFirebaseAdminInitialized = true;
}

// Conditionally export to avoid "app not initialized" errors in dependent files
const adminAuth = isFirebaseAdminInitialized ? admin.auth() : null;
const adminDb = isFirebaseAdminInitialized ? admin.firestore() : null;

export { adminAuth, adminDb, isFirebaseAdminInitialized };
