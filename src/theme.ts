/**
 * Verdant design system — warm paper beige + deep botanical green.
 * Deliberately NOT the generic purple-gradient AI look:
 * paper textures, serif display type, sage accents, soft organic radii.
 */

export const palette = {
  // Backgrounds
  paper: '#F6F1E7', // warm beige app bg
  paperDeep: '#EFE7D5', // recessed sections
  card: '#FFFDF8', // message cards / sheets
  cardTint: '#F1EAD9', // pressed / tinted card
  white: '#FFFFFF',

  // Ink
  ink: '#1A2E28', // deep forest ink — headings + user bubble text on light
  inkSoft: '#33463F', // body text
  muted: '#75867E', // secondary text
  faint: '#A9B6AF', // placeholders, timestamps

  // Greens
  pine: '#1E4D3F', // primary — user bubbles, CTA
  pineDeep: '#14382D', // pressed CTA, header text on beige
  moss: '#2D6A4F', // secondary actions
  sage: '#9CAF88', // accents, dividers, leaf motif
  mint: '#DCE8DC', // assistant bubble tint edge
  mintSoft: '#EAF2E9', // chips, pills
  lime: '#DDE9B2', // tiny highlight (sparingly)

  // Lines & shadows
  line: '#E4DACA', // beige hairline
  lineSoft: '#EDE5D3',
  shadow: 'rgba(26, 46, 40, 0.10)',

  // Status
  danger: '#B0492F',
  dangerSoft: '#F7E3DB',
  amber: '#B07C2A',
  amberSoft: '#F6EAD0',
} as const;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** System serif for display headings (Georgia everywhere, no custom font download). */
export const fontDisplay = 'Georgia';
export const fontBody = 'System';

export const theme = {
  colors: palette,
  radius,
  spacing,
  fontDisplay,
  fontBody,
};

export type Theme = typeof theme;
