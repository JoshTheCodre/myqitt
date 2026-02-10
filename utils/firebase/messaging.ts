import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, MessagePayload, isSupported } from 'firebase/messaging';
import { firebaseConfig, vapidKey, isFirebaseConfigured } from './config';

let app: FirebaseApp;
let messaging: Messaging | null = null;

// Initialize Firebase
export const initializeFirebase = () => {
  if (typeof window === 'undefined') return null;
  
  if (!isFirebaseConfigured()) {
    console.error('Cannot initialize Firebase: Configuration is incomplete');
    return null;
  }
  
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    return app;
  } catch (error) {
    console.error('Error initializing Firebase app:', error);
    return null;
  }
};

// Initialize Firebase Messaging
export const initializeMessaging = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Check if messaging is supported
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.warn('Firebase Messaging is not supported on this browser');
      return null;
    }

    if (!messaging) {
      const firebaseApp = initializeFirebase();
      if (!firebaseApp) return null;
      messaging = getMessaging(firebaseApp);
    }
    return messaging;
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
    return null;
  }
};

// Check if FCM is supported on current platform
const isFCMSupported = async (): Promise<boolean> => {
  // FCM requires service workers and notifications
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  if (!('serviceWorker' in navigator)) return false;
  
  // Check Firebase Messaging support
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('Firebase Messaging is not supported');
      return false;
    }
  } catch (error) {
    console.error('Error checking FCM support:', error);
    return false;
  }
  
  // Check if it's iOS (FCM doesn't work well on iOS browsers except Safari 16.4+)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    console.warn('Running on iOS - FCM support may be limited');
    // Check iOS version
    const match = navigator.userAgent.match(/OS (\d+)_/);
    const version = match ? parseInt(match[1]) : 0;
    if (version < 16) {
      console.error('iOS version too old for web push notifications');
      return false;
    }
  }
  
  return true;
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string> => {
  try {
    console.log('Starting FCM token request...');
    
    // Check if FCM is supported
    const supported = await isFCMSupported();
    if (!supported) {
      throw new Error('Push notifications are not supported on this device/browser');
    }

    // Check Firebase configuration first
    if (!isFirebaseConfigured()) {
      console.error('Firebase is not configured');
      throw new Error('Firebase configuration is missing. Please check environment variables.');
    }

    console.log('Requesting notification permission...');
    
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied by user');
      throw new Error('Notification permission was denied. Please enable notifications in your browser settings.');
    }

    console.log('Permission granted, registering service worker...');

    // Register service worker
    let registration;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('Service Worker registered successfully:', registration.scope);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service Worker is ready');
      } catch (swError) {
        console.error('Service Worker registration failed:', swError);
        throw new Error(`Failed to register service worker: ${swError instanceof Error ? swError.message : 'Unknown error'}`);
      }
    } else {
      throw new Error('Service workers are not supported in this browser');
    }

    console.log('Initializing Firebase Messaging...');
    
    // Get FCM token
    const messagingInstance = await initializeMessaging();
    if (!messagingInstance) {
      console.error('Failed to initialize messaging instance');
      throw new Error('Failed to initialize Firebase Messaging. This may not be supported on your device.');
    }

    console.log('Getting FCM token...');
    
    const token = await getToken(messagingInstance, { 
      vapidKey,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('FCM Token obtained successfully:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.error('No registration token available from Firebase');
      throw new Error('Failed to get FCM token from Firebase');
    }
  } catch (error) {
    console.error('Error in requestNotificationPermission:', error);
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to enable notifications. Please try again.');
  }
};

// Listen for foreground messages
export const onForegroundMessage = async (callback: (payload: MessagePayload) => void) => {
  const messagingInstance = await initializeMessaging();
  if (!messagingInstance) return () => {};

  return onMessage(messagingInstance, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

// Check if notifications are enabled
export const isNotificationEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
};
