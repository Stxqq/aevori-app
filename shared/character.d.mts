export type CharacterAppearance = {
  shape: 'aeri' | 'round' | 'cat' | 'bot';
  color: string;
  eyes: 'friendly' | 'happy' | 'calm';
  accessory: 'none' | 'glasses' | 'headphones' | 'sprout';
};
export const CHARACTER_SHAPES: ReadonlyArray<{ id: CharacterAppearance['shape']; label: string }>;
export const CHARACTER_EYES: ReadonlyArray<{ id: CharacterAppearance['eyes']; label: string }>;
export const CHARACTER_ACCESSORIES: ReadonlyArray<{
  id: CharacterAppearance['accessory'];
  label: string;
}>;
export const CHARACTER_COLORS: ReadonlyArray<{ color: string; label: string }>;
export const DEFAULT_APPEARANCE: Readonly<CharacterAppearance>;
export function appearanceForTone(tone?: string): CharacterAppearance;
export function validateAppearance(input: unknown): CharacterAppearance;
