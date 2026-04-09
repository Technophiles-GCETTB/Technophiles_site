// ─── Technophiles PWA Client ──────────────────────────────────────────────────
// Handles: Service Worker registration, Push subscription, Install prompt

(function () {
  'use strict';

  // ─── Service Worker Registration ───────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[PWA] Service Worker registered:', reg.scope);

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });

        // Store registration globally
        window._swReg = reg;

        // Init push if user is logged in
        if (document.body.dataset.userId) {
          await initPushNotifications(reg);
        }

      } catch (err) {
        console.warn('[PWA] Service Worker registration failed:', err);
      }
    });

    // Listen for messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NOTIFICATIONS_UPDATED') {
        updateNotificationBadge(event.data.unread);
      }
    });
  }

  // ─── Push Notification Init ─────────────────────────────────────────────────
  async function initPushNotifications(registration) {
    try {
      // Check if already subscribed
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        window._pushSubscription = existing;
        updatePushUI(true);
        return;
      }
      updatePushUI(false);
    } catch (err) {
      console.warn('[PUSH] Init error:', err);
    }
  }

  // ─── Subscribe to Push ──────────────────────────────────────────────────────
  window.subscribeToPush = async function () {
    try {
      // Get VAPID public key from server
      const keyRes = await fetch('/push/vapid-key');
      const keyData = await keyRes.json();

      if (!keyData.configured) {
        showToast('Push notifications not configured on server. See .env setup.', 'info');
        return;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Notification permission denied. Enable in browser settings.', 'error');
        updatePushUI(false);
        return;
      }

      // Subscribe via Service Worker
      const reg = window._swReg || await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      // Save subscription to server
      const res = await fetch('/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
            auth: arrayBufferToBase64(subscription.getKey('auth')),
          },
          deviceName: detectDevice(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        window._pushSubscription = subscription;
        updatePushUI(true);
        showToast('🔔 Push notifications enabled!', 'success');
      }
    } catch (err) {
      console.error('[PUSH] Subscribe error:', err);
      showToast('Could not enable push notifications.', 'error');
    }
  };

  // ─── Unsubscribe from Push ──────────────────────────────────────────────────
  window.unsubscribeFromPush = async function () {
    try {
      const reg = window._swReg || await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await fetch('/push/unsubscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      window._pushSubscription = null;
      updatePushUI(false);
      showToast('Push notifications disabled.', 'info');
    } catch (err) {
      console.error('[PUSH] Unsubscribe error:', err);
    }
  };

  // ─── Update Push UI ─────────────────────────────────────────────────────────
  function updatePushUI(isSubscribed) {
    const btn = document.getElementById('push-toggle-btn');
    if (!btn) return;
    if (isSubscribed) {
      btn.textContent = '🔔 Notifications ON';
      btn.className = btn.className.replace('btn-neon', 'btn-neon') + ' text-neon';
      btn.onclick = window.unsubscribeFromPush;
    } else {
      btn.textContent = '🔕 Enable Notifications';
      btn.onclick = window.subscribeToPush;
    }
  }

  // ─── PWA Install Prompt ─────────────────────────────────────────────────────
  let deferredInstallPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallBanner();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideInstallBanner();
    showToast('✅ App installed successfully!', 'success');
  });

  window.installPWA = async function () {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('Installing Technophiles app...', 'info');
    }
    deferredInstallPrompt = null;
    hideInstallBanner();
  };

  function showInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('hidden');
      banner.classList.add('slide-in');
    } else {
      // Create banner dynamically
      const el = document.createElement('div');
      el.id = 'pwa-install-banner';
      el.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 card p-4 border-neon/30 bg-neon/5 slide-in flex items-center gap-3';
      el.innerHTML = `
        <div class="w-10 h-10 border border-neon flex items-center justify-center flex-shrink-0 rounded">
          <span class="text-neon font-display font-black text-sm">T</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white font-semibold text-sm">Install Technophiles</p>
          <p class="text-gray-500 text-xs">Add to home screen for offline access</p>
        </div>
        <button onclick="installPWA()" class="btn-neon-solid text-xs px-4 py-2 whitespace-nowrap">INSTALL</button>
        <button onclick="document.getElementById('pwa-install-banner').remove()" class="text-gray-500 hover:text-white ml-1 text-lg leading-none">×</button>
      `;
      document.body.appendChild(el);
    }
  }

  function hideInstallBanner() {
    document.getElementById('pwa-install-banner')?.remove();
  }

  // ─── Update Available Banner ────────────────────────────────────────────────
  function showUpdateBanner() {
    if (document.getElementById('pwa-update-banner')) return;
    const el = document.createElement('div');
    el.id = 'pwa-update-banner';
    el.className = 'fixed top-20 right-4 z-50 card p-4 border-neon/30 bg-neon/5 slide-in flex items-center gap-3 max-w-xs';
    el.innerHTML = `
      <span class="text-neon text-lg flex-shrink-0">🔄</span>
      <div class="flex-1 min-w-0">
        <p class="text-white text-sm font-semibold">Update Available</p>
        <p class="text-gray-500 text-xs">A new version of the app is ready.</p>
      </div>
      <button onclick="applyUpdate()" class="btn-neon text-xs px-3 py-1 whitespace-nowrap">UPDATE</button>
    `;
    document.body.appendChild(el);
  }

  window.applyUpdate = function () {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  // ─── Notification Badge Update ──────────────────────────────────────────────
  function updateNotificationBadge(count) {
    const badge = document.querySelector('[data-notif-badge]');
    if (badge) {
      badge.textContent = count > 0 ? count : '';
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
  }

  function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  function detectDevice() {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) return `Android (${/Chrome/.test(ua) ? 'Chrome' : 'Browser'})`;
    if (/iPhone|iPad/.test(ua)) return `iOS (${/Safari/.test(ua) ? 'Safari' : 'Browser'})`;
    if (/Windows/.test(ua)) return `Windows (${/Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : 'Browser'})`;
    if (/Mac/.test(ua)) return `Mac (${/Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Browser'})`;
    return 'Desktop';
  }

  // Expose showToast globally (may already be defined in main.js, skip if so)
  if (!window.showToast) {
    window.showToast = function(message, type = 'success') {
      const colors = { success: 'border-neon bg-neon/10 text-neon', error: 'border-red-500 bg-red-500/10 text-red-400', info: 'border-blue-500 bg-blue-500/10 text-blue-400' };
      const toast = document.createElement('div');
      toast.className = `fixed top-20 right-4 z-50 px-4 py-3 rounded border ${colors[type] || colors.success} text-sm font-mono slide-in shadow-lg max-w-sm`;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 4000);
    };
  }

  // ─── Check notification permission on load ──────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    if ('Notification' in window && Notification.permission === 'granted' && document.body.dataset.userId) {
      // Already granted — check subscription state
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          updatePushUI(!!sub);
        });
      });
    }
  });

})();
