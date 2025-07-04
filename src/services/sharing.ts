
'use server';
/**
 * @fileOverview A service to handle sharing items between users using admin privileges.
 */
import { z } from 'zod';
import { adminDb, isFirebaseAdminInitialized } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const ShareItemAndNotifyInputSchema = z.object({
  recipientUid: z.string(),
  itemType: z.enum(['credential', 'document']),
  itemData: z.any(),
  notificationData: z.any(),
});
export type ShareItemAndNotifyInput = z.infer<typeof ShareItemAndNotifyInputSchema>;

async function adminGetOrCreatePersonalVault(userId: string): Promise<string> {
  if (!adminDb) throw new Error('Admin DB not initialized');
  const vaultsCol = adminDb.collection('users').doc(userId).collection('vaults');
  const q = vaultsCol.where('name', '==', 'Personal').limit(1);
  const snapshot = await q.get();

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  } else {
    const docRef = await vaultsCol.add({
      name: 'Personal',
      ownerUid: userId,
      createdAt: FieldValue.serverTimestamp(),
    });
    return docRef.id;
  }
}

export async function shareItemAndNotify(input: ShareItemAndNotifyInput): Promise<{success: boolean, message: string}> {
  if (!isFirebaseAdminInitialized || !adminDb) {
    return {
      success: false,
      message: 'The sharing feature is not configured on the server. Firebase Admin is missing.'
    };
  }

  const { recipientUid, itemType, itemData, notificationData } = input;

  try {
    const batch = adminDb.batch();

    // 1. Share the item
    const personalVaultId = await adminGetOrCreatePersonalVault(recipientUid);
    const collectionName = itemType === 'credential' ? 'credentials' : 'secureDocuments';
    const itemsCol = adminDb.collection('users').doc(recipientUid).collection(collectionName);

    const { originalId } = itemData;

    if (!originalId) {
      return { success: false, message: 'Shared item is missing an originalId.' };
    }

    const q = itemsCol.where('originalId', '==', originalId).limit(1);
    const existingDocs = await q.get();

    const dataPayload: any = {
      ...itemData,
      vaultId: personalVaultId,
      lastModified: FieldValue.serverTimestamp(),
    };

    if (!existingDocs.empty) {
      const existingDocRef = existingDocs.docs[0].ref;
      delete dataPayload.createdAt;
      batch.update(existingDocRef, dataPayload);
    } else {
      dataPayload.createdAt = FieldValue.serverTimestamp();
      const newDocRef = itemsCol.doc(); // create ref for batch
      batch.set(newDocRef, dataPayload);
    }

    // 2. Add notification
    const notificationsCol = adminDb.collection('users').doc(recipientUid).collection('notifications');
    const newNotificationRef = notificationsCol.doc();
    const notificationPayload = {
      ...notificationData,
      createdAt: FieldValue.serverTimestamp(),
      read: false,
    };
    batch.set(newNotificationRef, notificationPayload);

    // 3. Commit batch
    await batch.commit();

    return { success: true, message: 'Item shared successfully.' };

  } catch (error: any) {
    console.error(`[Sharing] Failed to share item with ${recipientUid}:`, error);
    return { success: false, message: `Could not share item. Reason: ${error.message}` };
  }
}
