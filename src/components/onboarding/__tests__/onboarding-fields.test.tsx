import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { defaultOnboardingValues } from "../model";
import { OnboardingFields } from "../onboarding-fields";

describe("OnboardingFields", () => {
  it("renders accessible required settings without financial credentials", () => {
    render(<OnboardingFields values={{ ...defaultOnboardingValues, displayName: "Rani" }} disabled={false} onChange={vi.fn()} />);

    expect(screen.getByRole("textbox", { name: "Nama lengkap" })).toBeRequired();
    expect(screen.getByRole("combobox", { name: "Mata uang utama" })).toHaveValue("IDR");
    expect(screen.getByRole("combobox", { name: "Zona waktu" })).toHaveValue("Asia/Jakarta");
    expect(screen.getByRole("spinbutton", { name: /Tanggal awal siklus/ })).toHaveAttribute("max", "28");
    expect(screen.getByRole("checkbox", { name: /Aktifkan estimasi jejak karbon/ })).toBeChecked();
    expect(screen.queryByLabelText(/nomor kartu|pin|rekening/i)).not.toBeInTheDocument();
  });

  it("reports preference changes", async () => {
    const onChange = vi.fn();
    render(<OnboardingFields values={defaultOnboardingValues} disabled={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: "Gelap" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ theme: "dark" }));
  });
});
