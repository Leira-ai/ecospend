import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AttachmentManager } from "./attachment-manager";

const fetchMock = vi.fn<typeof fetch>();

afterEach(() => { vi.unstubAllGlobals(); });

describe("AttachmentManager", () => {
  it("shows accepted type and size guidance and rejects an oversized selection", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<AttachmentManager transactionId="20000000-0000-4000-8000-000000000001" transactionName="Belanja" />);
    expect(screen.getByText(/JPEG, PNG, WebP, atau PDF · maksimum 10 MiB/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Belum ada lampiran untuk transaksi ini.")).toBeInTheDocument());

    const oversized = new File(["x"], "large.pdf", { type: "application/pdf" });
    Object.defineProperty(oversized, "size", { value: 10 * 1024 * 1024 + 1 });
    await user.upload(screen.getByLabelText("Pilih lampiran"), oversized);
    expect(screen.getByRole("alert")).toHaveTextContent("melebihi batas 10 MiB");
    expect(screen.getByRole("button", { name: "Unggah" })).toBeDisabled();
  });

  it("lists attachment type and size and requires confirmation before deletion", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ data: [{
      id: "30000000-0000-4000-8000-000000000001", transaction_id: "20000000-0000-4000-8000-000000000001",
      original_filename: "receipt.pdf", content_type: "application/pdf", size_bytes: 2048, created_at: "2026-09-08T00:00:00Z",
    }] }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<AttachmentManager transactionId="20000000-0000-4000-8000-000000000001" transactionName="Belanja" />);

    expect(await screen.findByText("receipt.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF · 2.0 KiB")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Hapus receipt.pdf" }));
    expect(screen.getByRole("dialog", { name: "Hapus lampiran?" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
