// Firebase Cloud Messaging Service Worker
// This file must be in the public directory and served from the root

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// IMPORTANT: Replace these values with your Firebase config from lib/firebase/config.ts
// Service workers cannot import TypeScript modules, so values must be hardcoded here
firebase.initializeApp({
  apiKey: "AIzaSyA0iqGS04NPAEqpvqmeWwMMT66ov0qr7i8",
  authDomain: "qitt-e87a1.firebaseapp.com",
  projectId: "qitt-e87a1",
  storageBucket: "qitt-e87a1.firebasestorage.app",
  messagingSenderId: "935131186150",
  appId: "1:935131186150:web:f534f8e23ceede70b74c27"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  // Get the action URL from notification data
  const actionUrl = event.notification.data?.action_url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: actionUrl
          });
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});
