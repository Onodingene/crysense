import { api } from './api';
 
// Convert a base64 VAPID key to the Uint8Array the browser needs
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
 
export const pushManager = {
  /** Check whether the browser supports push at all. */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },
 
  /** Register the service worker (call once on app start). */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) return null;
    return navigator.serviceWorker.register('/sw.js');
  },
 
  /** Ask permission and subscribe. Returns true if subscribed. */
  async enable(): Promise<boolean> {
    if (!this.isSupported()) {
      alert('Push notifications are not supported in this browser.');
      return false;
    }
 
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return false;
    }
 
    const registration = await navigator.serviceWorker.ready;
    const publicKey = await api.getPushPublicKey();
    if (!publicKey) {
      console.warn('No VAPID public key from server');
      return false;
    }
 
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
 
    await api.subscribePush(subscription);
    return true;
  },
 
  /** Unsubscribe from push. */
  async disable(): Promise<void> {
    if (!this.isSupported()) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await api.unsubscribePush(subscription.endpoint);
      await subscription.unsubscribe();
    }
  },
 
  /** Is the user currently subscribed? */
  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  },
};
 