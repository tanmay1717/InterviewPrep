// Light/dark theme for the extension popup. Loaded in <head> so the saved theme applies before first paint.
(function () {
  try { if (localStorage.getItem("theme") === "light") document.documentElement.dataset.theme = "light"; } catch (e) {}
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("theme-btn");
    if (!btn) return;
    function sync() {
      var light = document.documentElement.dataset.theme === "light";
      btn.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    }
    btn.addEventListener("click", function () {
      var light = document.documentElement.dataset.theme !== "light";
      if (light) document.documentElement.dataset.theme = "light";
      else delete document.documentElement.dataset.theme;
      try { localStorage.setItem("theme", light ? "light" : "dark"); } catch (e) {}
      sync();
    });
    sync();
  });
})();
