function canUseDom() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function detectChromeFamily() {
  if (!canUseDom()) return false;
  const ua = navigator.userAgent;
  const hasChromium = /Chrome|Chromium|Edg|OPR/.test(ua);
  const excluded = /Firefox|Safari\/(?!537\.36)/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
  return hasChromium && !excluded;
}

function detectWebGL2() {
  if (!canUseDom()) return false;
  const canvas = document.createElement("canvas");
  try {
    return !!canvas.getContext("webgl2", { antialias: true, alpha: true });
  } catch {
    return false;
  }
}

function detectHtmlInCanvas() {
  if (!canUseDom()) return false;
  const canvasProto = window.HTMLCanvasElement?.prototype;
  const context2dProto = window.CanvasRenderingContext2D?.prototype;
  return !!(
    canvasProto &&
    ("onpaint" in canvasProto || "requestPaint" in canvasProto) &&
    context2dProto &&
    "drawElementImage" in context2dProto
  );
}

export function detectVisualTier() {
  const isChromeFamily = detectChromeFamily();
  const hasWebGL2 = detectWebGL2();
  const hasHtmlInCanvas = detectHtmlInCanvas();
  const prefersReducedMotion =
    canUseDom() && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!isChromeFamily || !hasWebGL2) {
    return {
      tier: "fallback",
      isChromeFamily,
      hasWebGL2,
      hasHtmlInCanvas,
      prefersReducedMotion,
      reason: "WebGL2 unavailable or non-Chromium browser.",
    };
  }

  if (prefersReducedMotion) {
    return {
      tier: "reduced",
      isChromeFamily,
      hasWebGL2,
      hasHtmlInCanvas,
      prefersReducedMotion,
      reason: "Reduced motion requested by user.",
    };
  }

  return {
    tier: hasHtmlInCanvas ? "full" : "reduced",
    isChromeFamily,
    hasWebGL2,
    hasHtmlInCanvas,
    prefersReducedMotion,
    reason: hasHtmlInCanvas
      ? "Full Chrome experimental path active."
      : "Chrome WebGL path active; HTML-in-Canvas API not detected.",
  };
}
