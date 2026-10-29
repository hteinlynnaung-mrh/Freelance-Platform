import { describe, expect, it } from "vitest";
import { formatMoney, toMinorUnits } from "./money";

describe("Web money formatting and minor unit conversion", () => {
  it("converts major units to integer minor units", () => {
    expect(toMinorUnits(10)).toBe(1000);
    expect(toMinorUnits(10.5)).toBe(1050);
    expect(toMinorUnits(0.99)).toBe(99);
    expect(toMinorUnits(0)).toBe(0);
  });

  it("formats USD without decimals and with dollar symbol", () => {
    const formatted = formatMoney(500000, "USD", "en-US");
    // 500000 minor units / 100 = 5000 USD -> $5,000
    expect(formatted).toBe("$5,000");
  });

  it("formats JPY with whole yen and no decimal places", () => {
    const formatted = formatMoney(1000000, "JPY", "en-US");
    // 1000000 minor units / 100 = 10000 JPY -> ¥10,000
    expect(formatted).toBe("¥10,000");
    expect(formatted).not.toContain(".");
  });
});

