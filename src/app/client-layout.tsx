
'use client';

import { useEffect } from 'react';
import InstallButton from './components/InstallButton';
import { notificationService } from './services/notificationService';
import { fallbackNotificationService } from './services/fallbackNotificationService';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Register Firebase Messaging service worker first (required for FCM)
        let serviceWorkerRegistration = null;
        if ('serviceWorker' in navigator) {
          try {
            // Register Firebase messaging service worker
            serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Firebase Messaging Service Worker registered:', serviceWorkerRegistration.scope);
            
            // Wait for service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('Service Worker is ready');
            
            // Also register the main service worker for caching
            try {
              await navigator.serviceWorker.register('/sw.js');
              console.log('Main Service Worker registered');
            } catch (error) {
              console.warn('Main Service Worker registration failed (non-critical):', error);
            }
          } catch (error) {
            console.error('Firebase Messaging Service Worker registration failed:', error);
            // Continue without Firebase messaging if service worker fails
          }
        }

        // Initialize notification service (with error handling)
        // The notification service will handle service worker registration internally
        try {
          await notificationService.initialize();
          
          // Subscribe to real-time notifications
          await notificationService.subscribeToNotifications();
        } catch (error) {
          console.warn('Firebase notification service failed, trying fallback:', error);
          
          // Try fallback notification service
          try {
            await fallbackNotificationService.initialize();
            await fallbackNotificationService.subscribeToNotifications();
            console.log('Fallback notification service initialized successfully');
          } catch (fallbackError) {
            console.warn('Fallback notification service also failed:', fallbackError);
            // Continue without notifications - app should still work
          }
        }

        // Request notification permission (only if supported)
        if ('Notification' in window) {
          try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              console.log('Notification permission granted.');
            } else {
              console.log('Notification permission denied.');
            }
          } catch (error) {
            console.warn('Failed to request notification permission:', error);
          }
        }
      } catch (error) {
        console.error('App initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <>
      {children}
      <InstallButton />
    </>
  );
}
