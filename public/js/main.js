// Technophiles - Client-side JS

// ─── Flash Messages ───────────────────────────────────────────────────────────
(function () {
  const urlParams = new URLSearchParams(window.location.search);
  const msg = urlParams.get('msg');
  if (msg) {
    const messages = {
      registered: { type: 'success', text: '✅ Successfully registered!' },
      already_registered: { type: 'warning', text: '⚠️ You are already registered.' },
      full: { type: 'error', text: '❌ This event is full.' },
      submitted: { type: 'success', text: '✅ Project submitted successfully!' },
      already_in_team: { type: 'warning', text: '⚠️ You are already in a team.' },
      team_full: { type: 'error', text: '❌ This team is already full.' },
      invalid_code: { type: 'error', text: '❌ Invalid invite code.' },
      role_updated: { type: 'success', text: '✅ User role updated.' },
      points_awarded: { type: 'success', text: '✅ Points awarded successfully.' },
      notifications_sent: { type: 'success', text: '✅ Notifications sent.' },
    };

    const m = messages[msg];
    if (m) showToast(m.text, m.type);
  }
})();

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  const colors = {
    success: 'border-neon bg-neon/10 text-neon',
    error: 'border-red-500 bg-red-500/10 text-red-400',
    warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
    info: 'border-blue-500 bg-blue-500/10 text-blue-400',
  };
  toast.className = `fixed top-20 right-4 z-50 px-4 py-3 rounded border ${colors[type] || colors.success} text-sm font-mono slide-in shadow-lg max-w-sm`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ─── Confirm Dialogs ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Add animation to cards
  const cards = document.querySelectorAll('.card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    observer.observe(card);
  });

  // Auto-resize textareas
  document.querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', function () {
      if (!this.classList.contains('resize-none')) {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      }
    });
  });
});

// ─── Copy to Clipboard ────────────────────────────────────────────────────────
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.classList.add('text-neon');
    setTimeout(() => { btn.textContent = orig; btn.classList.remove('text-neon'); }, 2000);
  });
}

// ─── Loading state for forms ──────────────────────────────────────────────────
document.addEventListener('submit', (e) => {
  const form = e.target;
  const btn = form.querySelector('[type="submit"]');
  if (btn && !form.dataset.noLoading) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<span class="spinner inline-block mr-2"></span>' + orig;
    btn.disabled = true;
    // Re-enable after 10s to prevent permanent lock
    setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; }, 10000);
  }
});
