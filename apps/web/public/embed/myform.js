/**
 * myFORM inline embed — loads the hosted form page in an iframe (same origin as this script).
 *
 * Usage on any site:
 * <script
 *   src="https://YOUR_APP_ORIGIN/embed/myform.js"
 *   data-form-slug="550e8400-e29b-41d4-a716-446655440000"
 *   data-height="520"
 *   async
 * ></script>
 *
 * Optional: data-source="embed" | "page" | "asksky" (passed to submit body; default embed).
 */
(function () {
  var s = document.currentScript;
  if (!s || !s.getAttribute) {
    return;
  }
  var slug = (s.getAttribute("data-form-slug") || "").trim();
  if (!slug) {
    console.warn("[myform.js] Missing data-form-slug on script tag.");
    return;
  }
  var srcUrl = new URL(s.src);
  var origin = srcUrl.origin;
  var height = parseInt(s.getAttribute("data-height") || "520", 10);
  if (!Number.isFinite(height) || height < 120) {
    height = 520;
  }
  var source = (s.getAttribute("data-source") || "embed").trim();
  var iframe = document.createElement("iframe");
  iframe.title = "Form";
  iframe.setAttribute("loading", "lazy");
  iframe.style.width = "100%";
  iframe.style.maxWidth = "32rem";
  iframe.style.border = "0";
  iframe.style.borderRadius = "8px";
  iframe.style.minHeight = height + "px";
  iframe.src =
    origin + "/embed/myform?slug=" + encodeURIComponent(slug) + "&source=" + encodeURIComponent(source);
  var mount = s.parentNode;
  if (mount) {
    mount.insertBefore(iframe, s.nextSibling);
  }
})();
