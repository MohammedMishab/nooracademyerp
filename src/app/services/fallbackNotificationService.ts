"use client";

import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export class FallbackNotificationService {
  private static instance: FallbackNotificationService;
  private sentNotifications: Set<string> = new Set();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): FallbackNotificationService {
    if (!FallbackNotificationService.instance) {
      FallbackNotificationService.instance = new FallbackNotificationService();
    }
    return FallbackNotificationService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if browser supports basic notifications
      if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        this.isInitialized = true;
        return;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        this.isInitialized = true;
        return;
      }

      this.isInitialized = true;
      console.log('Fallback notification service initialized');
    } catch (error) {
      console.error('Error initializing fallback notification service:', error);
      this.isInitialized = true;
    }
  }

  public async subscribeToNotifications(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check if device is mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
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
            
            // Only show notification if not on mobile device and browser supports it
            if (!isMobile && 'Notification' in window && Notification.permission === 'granted') {
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
            } else {
              console.log('Mobile device or unsupported browser - notification not shown as popup');
            }
          }
        });
      });
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  }

  private showNotification(title: string, options: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
      } catch (error) {
        console.warn('Failed to show notification:', error);
      }
    }
  }
}

export const fallbackNotificationService = FallbackNotificationService.getInstance();

