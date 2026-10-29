import { describe, expect, it } from 'vitest';
import { translations } from './translations';

describe('Mobile i18n translation parity', () => {
  it('has matching keys for English and Japanese', () => {
    const enKeys = Object.keys(translations.en).sort();
    const jaKeys = Object.keys(translations.ja).sort();
    expect(enKeys).toEqual(jaKeys);
  });
});

