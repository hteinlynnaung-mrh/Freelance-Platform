import { describe, expect, it } from "vitest";
import { translations, supplementalTranslations } from "./translations";

describe("Web i18n translation parity", () => {
  it("has matching keys for English and Japanese in primary translations", () => {
    const enKeys = Object.keys(translations.en).sort();
    const jaKeys = Object.keys(translations.ja).sort();
    expect(enKeys).toEqual(jaKeys);
  });

  it("has matching keys for English and Japanese in supplemental translations", () => {
    const enKeys = Object.keys(supplementalTranslations.en).sort();
    const jaKeys = Object.keys(supplementalTranslations.ja).sort();
    expect(enKeys).toEqual(jaKeys);
  });
});

