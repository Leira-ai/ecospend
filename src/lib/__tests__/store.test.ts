import { describe, expect, it } from "vitest";
import { createDemoState } from "../demoData";
import { createDemoStore, parseState, stringifyState } from "../store";

describe("demo data and store", () => {
  it("generates deterministic, varied demo data", () => {
    const first = createDemoState();
    const second = createDemoState();
    expect(first).toEqual(second);
    expect(first.transactions.length).toBeGreaterThanOrEqual(120);
    expect(new Set(first.transactions.map((item) => item.date.slice(0, 7))).size).toBeGreaterThanOrEqual(4);
    expect(new Set(first.transactions.map((item) => item.paymentMethod)).size).toBeGreaterThanOrEqual(4);
    expect(first.accounts.length).toBeGreaterThanOrEqual(3);
    expect(first.goals.length).toBeGreaterThanOrEqual(2);
    expect(first.recurringTransactions.length).toBeGreaterThan(0);
    expect(first.transactions.some((item) => item.activity)).toBe(true);
  });

  it("round-trips bigint state safely", () => {
    const state = createDemoState();
    expect(parseState(stringifyState(state))).toEqual(state);
    expect(parseState("not json")).toBeUndefined();
  });

  it("works without localStorage on the server and supports filtering/reset", () => {
    const store = createDemoStore("test-store");
    const initialCount = store.getState().transactions.length;
    expect(store.filterTransactions({ direction: "income" }).every((item) => item.direction === "income")).toBe(true);
    store.deleteTransaction(store.getState().transactions[0].id);
    expect(store.getState().transactions.length).toBe(initialCount - 1);
    expect(store.reset().transactions.length).toBe(initialCount);
  });
});
