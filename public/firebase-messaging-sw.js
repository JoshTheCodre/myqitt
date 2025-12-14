// public/firebase-messaging-sw.js
// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyA0iqGS04NPAEqpvqmeWwMMT66ov0qr7i8",
  authDomain: "qitt-e87a1.firebaseapp.com",
  projectId: "qitt-e87a1",
  storageBucket: "qitt-e87a1.firebasestorage.app",
  messagingSenderId: "935131186150",
  appId: "1:935131186150:web:f534f8e23ceede70b74c27"
})

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload)

  const notificationTitle = payload.notification?.title || 'MyQitt Update'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new update',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: false,
    vibrate: [200, 100, 200]
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click received.')
  
  event.notification.close()

  // Determine where to navigate based on notification type
  let urlToOpen = '/'
  
  if (event.notification.data) {
    const { type } = event.notification.data
    
    if (type === 'timetable_updated') {
      urlToOpen = '/timetable'
    } else if (type === 'assignment_added' || type === 'assignment_updated') {
      urlToOpen = '/assignment'
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window/tab open with the target URL
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i]
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus()
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})
