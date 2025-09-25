import { messaging, getToken, onMessage } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

// VAPID key for Firebase Cloud Messaging
const VAPID_KEY = 'BAIM2fr_JYQRT4gQsqrQ6MJPfktlnjT3Wi48YK0yLPbvvLt-bX0dAFiNB__8cjQaUEFNJ_veG0E3EZjEgGhBndU';

export class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;
  private isInitialized = false;

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
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
      }

      // Get FCM token
      if (messaging) {
        this.fcmToken = await getToken(messaging, {
          vapidKey: VAPID_KEY
        });

        if (this.fcmToken) {
          console.log('FCM Token:', this.fcmToken);
          // Store token in localStorage for debugging
          localStorage.setItem('fcmToken', this.fcmToken);
        } else {
          console.warn('No FCM token available');
        }

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          console.log('Message received in foreground:', payload);
          this.showNotification(payload.notification?.title || 'New Notification', {
            body: payload.notification?.body || 'You have a new notification',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'notification',
            data: payload.data
          });
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  public getFCMToken(): string | null {
    return this.fcmToken;
  }

  public async subscribeToNotifications(): Promise<void> {
    try {
      // Listen for new notifications in real-time
      const notificationsQuery = query(
        collection(db, 'notification'),
        orderBy('date', 'desc'),
        limit(1)
      );

      onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const notification = change.doc.data();
            console.log('New notification detected:', notification);
            
            // Show notification
            this.showNotification(
              notification.heading || 'New Notification',
              {
                body: notification.content || 'You have a new notification',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                tag: 'notification',
                data: {
                  id: change.doc.id,
                  url: '/notification'
                }
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

  public async sendTestNotification(): Promise<void> {
    if (this.fcmToken) {
      try {
        // This would typically be called from your backend
        // For now, we'll just show a test notification
        this.showNotification('Test Notification', {
          body: 'This is a test notification from Noor Academy',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'test'
        });
      } catch (error) {
        console.error('Error sending test notification:', error);
      }
    }
  }
}

export const notificationService = NotificationService.getInstance();
