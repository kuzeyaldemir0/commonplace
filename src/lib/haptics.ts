type HapticPattern = number | number[];

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function triggerHaptic(pattern: HapticPattern) {
  if (
    prefersReducedMotion() ||
    typeof navigator === "undefined" ||
    typeof navigator.vibrate !== "function"
  ) {
    return false;
  }

  return navigator.vibrate(pattern);
}

export const haptics = {
  tap: () => triggerHaptic(8),
  selection: () => triggerHaptic(5),
  success: () => triggerHaptic([12, 32, 18]),
  error: () => triggerHaptic([28, 38, 28])
};
