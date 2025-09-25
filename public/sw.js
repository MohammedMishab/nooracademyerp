self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  if (event.data) {
    const data = event.data.json();
    console.log('Push data:', data);
    
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/icon-192x192.png',
      tag: data.tag || 'notification',
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-192x192.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      requireInteraction: true,
      silent: false,
      vibrate: [200, 100, 200], // Vibration pattern for mobile
      timestamp: Date.now()
    };
    
    const promiseChain = self.registration.showNotification(data.title || 'New Notification', options);
    event.waitUntil(promiseChain);
  } else {
    console.log('This push event has no data.');
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event.notification.tag, event.action);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/notification';
  const notifId = event.notification.data?.id;

  if (event.action === 'dismiss') {
    // Just close the notification
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(function(clientList) {
      // Check if there's already a window/tab open with the target URL
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window, open a new one
      if (clients.openWindow) {
        // Append id as query so app can mark as read
        const targetUrl = notifId ? `${urlToOpen}` : urlToOpen;
        return clients.openWindow(targetUrl);
      }
    })
  );
});
