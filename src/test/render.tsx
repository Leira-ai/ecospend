import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { DemoProvider } from "@/components/dashboard/demo-store";
import type { DemoState } from "@/components/dashboard/types";

export const DEMO_STORAGE_KEY = "ecospend-demo-state-v2";

export function renderWithDemo(
  ui: ReactElement,
  options: RenderOptions & { state?: DemoState } = {},
) {
  const { state, ...renderOptions } = options;
  if (state) {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  }

  return render(ui, {
    wrapper: ({ children }) => <DemoProvider>{children}</DemoProvider>,
    ...renderOptions,
  });
}
