/* One-time task imports. Each seed is merged into your saved data once (by id), never overwriting anything.
   Personal tasks live in localStorage / Secret GitHub Gist sync (or optional gitignored seeds.local.js) so this file stays safe for public hosting. */
window.WAL_SEEDS = window.WAL_LOCAL_SEEDS || [];
if (typeof location !== "undefined" && location.protocol === "file:" && typeof document !== "undefined" && typeof document.write === "function") {
  document.write('<script src="seeds.local.js"><\/script>');
}
