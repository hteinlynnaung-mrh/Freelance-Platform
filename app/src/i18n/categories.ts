import type { TranslationKey } from "./translations";

const categoryKeys: Record<string, TranslationKey> = {
  "Business Support": "categoryBusinessSupport",
  "Data & Analytics": "categoryDataAnalytics",
  Design: "categoryDesign",
  Marketing: "categoryMarketing",
  Writing: "categoryWriting",
  Development: "categoryDevelopment",
  "Design & Creative": "categoryDesignCreative",
  "Writing & Content": "categoryWritingContent",
  "Mobile Development": "categoryMobileDevelopment",
  "Video & Animation": "categoryVideoAnimation",
};

export function localizeCategory(name: string, t: (key: TranslationKey) => string) {
  const key = categoryKeys[name];
  return key ? t(key) : name;
}
