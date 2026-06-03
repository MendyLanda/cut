// Progressive enhancement for Cut. The app is a server-rendered MPA; everything
// here is optional polish that degrades gracefully when JS is off.
(function () {
  "use strict";

  var COPIED_HTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg> Copied';

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return false;
        },
      );
    }
    return Promise.resolve(false);
  }

  // ── Copy-to-clipboard buttons ──────────────────────────────────────────
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-copy]");
    if (!btn) return;
    e.preventDefault();
    copy(btn.getAttribute("data-copy")).then(function (ok) {
      if (!ok) return;
      var original = btn.innerHTML;
      var wasAccent = btn.classList.contains("text-accent");
      btn.innerHTML = COPIED_HTML;
      btn.classList.add("text-accent");
      setTimeout(function () {
        btn.innerHTML = original;
        if (!wasAccent) btn.classList.remove("text-accent");
      }, 1800);
    });
  });

  // ── Show / hide password ───────────────────────────────────────────────
  document.addEventListener("click", function (e) {
    var toggle = e.target.closest && e.target.closest("[data-toggle-password]");
    if (!toggle) return;
    var field = toggle.closest("[data-password-field]");
    if (!field) return;
    var input = field.querySelector("input");
    var eye = field.querySelector("[data-eye]");
    var eyeOff = field.querySelector("[data-eye-off]");
    var show = input.type === "password";
    input.type = show ? "text" : "password";
    if (eye) eye.hidden = show;
    if (eyeOff) eyeOff.hidden = !show;
    toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
  });

  // ── Delete (and other) confirmations ───────────────────────────────────
  document.addEventListener("submit", function (e) {
    var form = e.target;
    var msg = form.getAttribute && form.getAttribute("data-confirm");
    if (msg && !window.confirm(msg)) e.preventDefault();
  });

  // ── Auto-submit sort <select> ──────────────────────────────────────────
  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.matches && el.matches("[data-autosubmit]")) {
      var form = el.form;
      if (form) (form.requestSubmit || form.submit).call(form);
    }
  });

  // ── datetime-local <-> epoch ms (timezone-correct on a UTC server) ──────
  function toLocalInput(ms) {
    var d = new Date(ms);
    var p = function (n) {
      return String(n).padStart(2, "0");
    };
    return (
      d.getFullYear() +
      "-" +
      p(d.getMonth() + 1) +
      "-" +
      p(d.getDate()) +
      "T" +
      p(d.getHours()) +
      ":" +
      p(d.getMinutes())
    );
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-link-form]"), function (form) {
    var epoch = form.querySelector("[data-expires-epoch]");
    var input = form.querySelector("[data-expires-input]");
    if (!epoch || !input) return;
    // Prefill the visible field from the stored epoch, in the browser's tz.
    if (epoch.value) input.value = toLocalInput(Number(epoch.value));
    function sync() {
      epoch.value = input.value ? String(new Date(input.value).getTime()) : "";
    }
    input.addEventListener("change", sync);
    form.addEventListener("submit", sync);
  });

  // ── Render absolute times in the browser's timezone ─────────────────────
  var fmt = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-time]"), function (el) {
    var ms = Number(el.getAttribute("data-time"));
    if (ms) el.textContent = fmt.format(new Date(ms));
  });

  // ── "Created" banner: auto-copy the new link ────────────────────────────
  var created = document.querySelector("[data-created-banner]");
  if (created) {
    var url = created.getAttribute("data-url");
    var label = created.querySelector("[data-created-label]");
    if (url) {
      copy(url).then(function (ok) {
        if (ok && label) label.textContent = "Created & copied to clipboard";
      });
    }
  }

  // ── KV consistency notice: a one-time FYI ───────────────────────────────
  // Show it only on the first visit, then never again. The × dismisses early.
  var SEEN_KEY = "kv-consistency-seen";
  var notice = document.querySelector("[data-consistency-banner]");
  if (notice) {
    var seen;
    try {
      seen = localStorage.getItem(SEEN_KEY);
    } catch (_) {
      seen = null;
    }
    if (!seen) {
      notice.hidden = false;
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch (_) {}
    }
  }
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-dismiss-banner]");
    if (!btn) return;
    var banner = btn.closest("[data-consistency-banner]");
    if (banner) banner.remove();
  });
})();
