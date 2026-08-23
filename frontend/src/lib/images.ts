const UNSPLASH = 'https://images.unsplash.com/photo-';

/**
 * Builds a sized Unsplash URL from a photo id.
 * Every id used in this project has been checked to resolve to a real photo.
 */
export function img(id: string, width = 800, height = 800): string {
  return `${UNSPLASH}${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

/** Wide banner crop, used for heroes, store covers and promo cards. */
export function banner(id: string, width = 1400, height = 700): string {
  return `${UNSPLASH}${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
}

/** Shown when a remote image fails to load. */
export const FALLBACK_IMAGE = img('1542838132-92c53300491e', 600, 600);
