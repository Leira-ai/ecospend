import { describe, expect, it, vi } from "vitest";
import { debounce } from "../debounce";

describe("debounce", () => {
  it("delays function execution until wait period has elapsed", () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced("first");
    debounced("second");
    debounced("third");

    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(spy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith("third");

    vi.useRealTimers();
  });

  it("can be cancelled before execution", () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 100);

    debounced();
    debounced.cancel();

    vi.advanceTimersByTime(200);
    expect(spy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
