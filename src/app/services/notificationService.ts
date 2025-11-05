import { messaging, getToken, onMessage, db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

// VAPID key for Firebase Cloud Messaging
const VAPID_KEY = 'BAIM2fr_JYQRT4gQsqrQ6MJPfktlnjT3Wi48YK0yLPbvvLt-bX0dAFiNB__8cjQaUEFNJ_veG0E3EZjEgGhBndU';

export class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;
  private isInitialized = false;
  private sentNotifications: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return;
      }

      // Ensure Firebase messaging service worker is registered
      try {
        // Check if service worker is already registered
        const registrations = await navigator.serviceWorker.getRegistrations();
        const fcmSwRegistered = registrations.some(reg => 
          reg.active?.scriptURL?.includes('firebase-messaging-sw.js')
        );

        if (!fcmSwRegistered) {
          // Register Firebase messaging service worker
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Firebase Messaging Service Worker registered');
        }

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service Worker ready for messaging');
      } catch (error) {
        console.error('Failed to register service worker:', error);
        return;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // Wait for messaging to be initialized (it's loaded asynchronously)
      let messagingInstance = messaging;
      let retries = 0;
      while (!messagingInstance && retries < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        messagingInstance = messaging;
        retries++;
      }

      if (!messagingInstance) {
        console.warn('Firebase messaging not initialized yet');
        return;
      }

      // Wait a bit more to ensure service worker is fully ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get FCM token - Firebase will automatically use the registered service worker
      this.fcmToken = await getToken(messagingInstance, {
        vapidKey: VAPID_KEY
      });

      if (this.fcmToken) {
        console.log('FCM Token:', this.fcmToken);
        // Store token in localStorage for debugging
        localStorage.setItem('fcmToken', this.fcmToken);
        // Persist token to Firestore mapped to user for server-side push
        await this.persistTokenForCurrentUser(this.fcmToken);
      } else {
        console.warn('No FCM token available');
      }

      // Listen for foreground messages
      onMessage(messagingInstance, (payload: { notification?: { title?: string; body?: string }; data?: Record<string, unknown> }) => {
        console.log('Message received in foreground:', payload);
        this.showNotification(payload.notification?.title || 'New Notification', {
          body: payload.notification?.body || 'You have a new notification',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'notification',
          data: payload.data
        });
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  public getFCMToken(): string | null {
    return this.fcmToken;
  }

  private async persistTokenForCurrentUser(token: string): Promise<void> {
    try {
      const user = auth.currentUser;
      const userId = user?.uid || 'anonymous';
      const userEmail = user?.email || null;

      const userTokenDocRef = doc(db, 'userTokens', userId);
      await setDoc(
        userTokenDocRef,
        {
          userId,
          email: userEmail,
          tokens: arrayUnion(token),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to persist FCM token for user:', error);
    }
  }

  public async subscribeToNotifications(): Promise<void> {
    try {
      // Listen for new notifications in real-time
      const notificationsQuery = query(
        collection(db, 'notification'),
        orderBy('date', 'desc')
      );

      onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = change.doc.data();
            const notificationId = change.doc.id;
            
            // Check if we've already sent this notification
            if (this.sentNotifications.has(notificationId)) {
              console.log('Notification already sent:', notificationId);
              return;
            }
            
            console.log('New notification detected:', notification);
            
            // Mark as sent
            this.sentNotifications.add(notificationId);
            
            // Show notification with unique tag to prevent duplicates
            this.showNotification(
              notification.heading || 'New Notification',
              {
                body: notification.content || 'You have a new notification',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: `notification-${notificationId}`,
                data: {
                  id: notificationId,
                  url: `/notification?open=${notificationId}`
                },
                requireInteraction: true,
                silent: false
              }
            );
          }
        });
      });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  }

  private showNotification(title: string, options: NotificationOptions): void {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, options);
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, options);
    }
  }

}

export const notificationService = NotificationService.getInstance();
