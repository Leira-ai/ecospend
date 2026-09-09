import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

vi.mock("next/dynamic", () => ({
  default: () => function DynamicComponent() {
    return null;
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});
