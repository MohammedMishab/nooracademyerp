
'use client';

import { useEffect } from 'react';
import InstallButton from './components/InstallButton';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('scope is: ', registration.scope);
          if ('Notification' in window && Notification.permission === 'granted') {
            registration.showNotification('Install our app!', {
              body: 'Click here to install the app and receive notifications.',
              icon: '/icon-192x192.png'
            });
          }
        });
    }

    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
        }
      });
    }
  }, []);

  return (
    <>
      {children}
      <InstallButton />
    </>
  );
}
