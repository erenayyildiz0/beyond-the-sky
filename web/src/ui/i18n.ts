import { tr, type Key } from "../i18n/tr";
import { en } from "../i18n/en";
import type { Lang } from "./format";

let lang: Lang = "tr";

export function setLang(l: Lang) {
  lang = l;
  document.documentElement.lang = l;
}
export const getLang = () => lang;

export function t(key: Key, vars: Record<string, string | number> = {}) {
  const s: string = (lang === "en" ? en : tr)[key];
  // \p{L}: yer tutucu adlarında Türkçe harfler olabilir ({yıl_de})
  return s.replace(/\{([\p{L}\d_]+)\}/gu, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
