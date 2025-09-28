
'use client';

import { useEffect } from 'react';
import InstallButton from './components/InstallButton';
import { notificationService } from './services/notificationService';
import { fallbackNotificationService } from './services/fallbackNotificationService';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Register service worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', registration.scope);
          } catch (error) {
            console.error('Service Worker registration failed:', error);
          }
        }

        // Initialize notification service (with error handling)
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
