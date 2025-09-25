
'use client';

import { useEffect } from 'react';
import InstallButton from './components/InstallButton';
import { notificationService } from './services/notificationService';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeApp = async () => {
      // Register service worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration.scope);
          
          // Initialize notification service
          await notificationService.initialize();
          
          // Subscribe to real-time notifications
          await notificationService.subscribeToNotifications();
          
          // Show welcome notification if permission is granted
          if ('Notification' in window && Notification.permission === 'granted') {
            registration.showNotification('Welcome to Noor Academy!', {
              body: 'You will now receive notifications for new updates.',
              icon: '/icon-192x192.png',
              badge: '/icon-192x192.png',
              tag: 'welcome'
            });
          }
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }

      // Request notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
        } else {
          console.log('Notification permission denied.');
        }
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
