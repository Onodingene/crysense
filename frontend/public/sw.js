self.addEventListener('push', (event) => {
  let data = { title: 'CrySense', body: 'New notification' };
  try {
    data = event.data.json();
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
 
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'crysense',
    vibrate: [200, 100, 200],
    data: { url: '/' },
  };
 
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});
 
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
