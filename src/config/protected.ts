/** Franchise characters and public-figure bait. Checked on plan text. */
export const PROTECTED_NAMES = [
  "pokemon",
  "pikachu",
  "disney",
  "elsa",
  "mickey",
  "motu",
  "patlu",
  "naruto",
  "doraemon",
  "spiderman",
  "spider-man",
  "batman",
  "hello kitty",
];

export function findProtected(text: string): string | null {
  const hay = text.toLowerCase();
  for (const name of PROTECTED_NAMES) {
    if (hay.includes(name)) return name;
  }
  return null;
}
