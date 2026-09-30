/** Shared, data-only character contract. No markup or external asset URLs. */
export const CHARACTER_SHAPES = Object.freeze([
  { id: 'aeri', label: 'Aeri' },
  { id: 'round', label: 'Round' },
  { id: 'cat', label: 'Cat' },
  { id: 'bot', label: 'Bot' },
]);
export const CHARACTER_EYES = Object.freeze([
  { id: 'friendly', label: 'Friendly' },
  { id: 'happy', label: 'Happy' },
  { id: 'calm', label: 'Calm' },
]);
export const CHARACTER_ACCESSORIES = Object.freeze([
  { id: 'none', label: 'None' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'headphones', label: 'Headphones' },
  { id: 'sprout', label: 'Leaf' },
]);
export const CHARACTER_COLORS = Object.freeze([
  { color: '#d0d6dc', label: 'Pearl' },
  { color: '#c4aff0', label: 'Lilac' },
  { color: '#edb0c6', label: 'Rose' },
  { color: '#a9d3bd', label: 'Sage' },
  { color: '#a7c9e9', label: 'Sky' },
  { color: '#e7c58e', label: 'Honey' },
]);
export const DEFAULT_APPEARANCE = Object.freeze({
  shape: 'aeri',
  color: '#d0d6dc',
  eyes: 'friendly',
  accessory: 'none',
});
export function appearanceForTone(tone) {
  return {
    ...DEFAULT_APPEARANCE,
    color: tone === 'rose' ? '#df84b2' : tone === 'lilac' ? '#a99cda' : DEFAULT_APPEARANCE.color,
  };
}
export function validateAppearance(input) {
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).some((key) => !Object.hasOwn(DEFAULT_APPEARANCE, key))
  )
    throw new Error('Invalid character.');
  for (const [key, choices] of [
    ['shape', CHARACTER_SHAPES],
    ['eyes', CHARACTER_EYES],
    ['accessory', CHARACTER_ACCESSORIES],
  ])
    if (!choices.some((choice) => choice.id === input[key]))
      throw new Error('Choose a valid shape, expression, and accessory.');
  if (typeof input.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(input.color))
    throw new Error('The color must be a six-digit hex value.');
  return {
    shape: input.shape,
    color: input.color.toLowerCase(),
    eyes: input.eyes,
    accessory: input.accessory,
  };
}
