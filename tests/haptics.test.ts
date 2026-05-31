import { afterEach, describe, expect, it, vi } from "vitest";
import { triggerHaptic } from "../src/lib/haptics";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("triggerHaptic", () => {
  it("is a no-op when vibration is unsupported", () => {
    vi.stubGlobal("navigator", {});
    expect(triggerHaptic(8)).toBe(false);
  });

  it("uses the browser vibration API when available", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: false }) });

    expect(triggerHaptic([12, 32, 18])).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([12, 32, 18]);
  });

  it("respects reduced-motion preferences", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });

    expect(triggerHaptic(8)).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
  });
});
