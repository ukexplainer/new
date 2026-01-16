
(function () {
  function onReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(fn, 1);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  onReady(function () {
    var path = (location.pathname || "").toLowerCase();
    var isIndex = /(^\/$|index\.html$)/.test(path) || path.endsWith("/");
    var isLander = /lander\.html$|lande\.html$/.test(path);

    if (!isIndex && !isLander) return;

    if (sessionStorage.getItem("aimforce_popup_shown") === "1") return;
    sessionStorage.setItem("aimforce_popup_shown", "1");

    var overlay = document.createElement("div");
    overlay.id = "af-overlay";
    overlay.className = "af-overlay";

    overlay.innerHTML = [
      '<div class="af-modal" role="dialog" aria-modal="true" aria-labelledby="af-title">',
      '  <button class="af-close" aria-label="Close">×</button>',
      '  <div class="af-logo">',
      '    <img src="' + (document.querySelector(\'link[rel="icon"]\')?.href || "assets/img/aimforce-logo.svg") + '" alt="AimForce" />',
      "  </div>",
      '  <h2 id="af-title">Privacy & Terms</h2>',
      '  <p class="af-text">We use basic cookies and collect minimal analytics to improve gameplay and content. By continuing, you acknowledge our Privacy Policy and agree to our Terms.</p>',
      '  <div class="af-actions">',
      '    <button class="af-btn af-accept">Accept</button>',
      '    <button class="af-btn af-secondary af-decline">Close</button>',
      "  </div>",
      "</div>",
    ].join("");

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    function cleanup() {
      document.body.style.overflow = "";
      overlay.remove();
    }

    function goto(url) {
      window.location.href = url;
    }

    overlay.querySelector(".af-close").addEventListener("click", function () {
      cleanup();
      if (isIndex) goto("privacy.html");
      else if (isLander) goto("terms.html");
    });

    overlay.querySelector(".af-decline").addEventListener("click", function () {
      cleanup();
      if (isIndex) goto("privacy.html");
      else if (isLander) goto("terms.html");
    });

    overlay.querySelector(".af-accept").addEventListener("click", function () {
      cleanup();
      if (isIndex) goto("terms.html");
      else if (isLander) goto("terms.html");
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        cleanup();
        if (isIndex) goto("privacy.html");
        else if (isLander) goto("terms.html");
      }
    });
  });
})();
