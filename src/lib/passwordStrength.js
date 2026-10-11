import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as en from "@zxcvbn-ts/language-en";

export const MIN_PASSWORD_LENGTH = 12;

const zxcvbn = new ZxcvbnFactory({
  dictionary: { ...common.dictionary, ...en.dictionary },
  graphs: common.adjacencyGraphs,
  translations: en.translations,
});

// Bars shown under the password field: 0 while the password is shorter than
// the minimum length, then 1-4 mapped from the zxcvbn score.
export function strengthBars(password) {
  const value = password || "";
  if (value.length < MIN_PASSWORD_LENGTH) return 0;
  const { score } = zxcvbn.check(value);
  if (score <= 1) return 1;
  return Math.min(score, 4);
}
