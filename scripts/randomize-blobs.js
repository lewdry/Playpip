// Randomize positions (and subtle scale/rotation) of decorative blobs each page load
// Keeps mobile layout centered and respects "prefers-reduced-motion"

// Limit how far blobs can stray outside the hero area (in pixels)
const BLOB_OUTER_PADDING_PX = 50;

document.addEventListener('DOMContentLoaded', function () {
  const blobs = document.querySelectorAll('.hero-decor .blob');
  if (!blobs.length) return;

  const smallScreen = () => window.matchMedia('(max-width: 480px)').matches;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rand = (min, max) => Math.random() * (max - min) + min;

  function placeBlobs() {
    const container = document.querySelector('.hero-decor');
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cw = rect.width || 1; // avoid division by zero
    const ch = rect.height || 1;

    const small = smallScreen();
    const reducedMotion = reducedMotionQuery.matches;

    blobs.forEach((el) => {
      // Horizontal placement (allow small overhang unless on tiny screens)
      if (small) {
        el.style.left = '50%';
      } else {
        const minX = -BLOB_OUTER_PADDING_PX;
        const maxX = cw + BLOB_OUTER_PADDING_PX;
        const x = rand(minX, maxX);
        const leftPct = (x / cw) * 100;
        el.style.left = leftPct + '%';
      }

      // Compute base (untransformed) height in pixels so we can ensure the blob
      // stays fully inside the hero vertically after scaling.
      const computedHeight = parseFloat(window.getComputedStyle(el).height) || 0;
      let baseHeight = computedHeight;
      if (!baseHeight && el.getBBox) {
        // fallback to SVG bbox if computedStyle wasn't available
        const bbox = el.getBBox();
        baseHeight = bbox ? bbox.height : 0;
      }

      // Determine scale + rotation (unless user prefers reduced motion)
      let scale = 1;
      let rotate = 0;
      if (!reducedMotion) {
        scale = Number(rand(0.92, 1.18).toFixed(3));
        rotate = Number(rand(-16, 16).toFixed(1));
      }

      // Clamp vertical placement so the blob is never above the top or below the bottom
      const scaledHeight = baseHeight * scale || 0;
      const maxTopPx = Math.max(0, ch - scaledHeight);
      const y = rand(0, maxTopPx);
      const topPct = (y / ch) * 100;
      el.style.top = topPct + '%';

      // Apply transforms (always include horizontal centering translate)
      if (reducedMotion) {
        el.style.transform = 'translateX(-50%) translateY(0)';
      } else {
        el.style.transform = `translateX(-50%) translateY(0) scale(${scale}) rotate(${rotate}deg)`;
      }
    });
  }

  // initial placement
  placeBlobs();

  // Reposition on resize (debounced) so mobile/desktop rules are respected
  let timeoutId = null;
  window.addEventListener('resize', function () {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(placeBlobs, 140);
  });
});
