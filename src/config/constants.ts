export const TILE_SIZE = 48;

export const COLORS = {
  bg: 0x0a0a14,
  floor: 0x1a1a2e,
  floorAlt: 0x16162a,
  wall: 0x2d2d44,
  wallDark: 0x1f1f33,
  player: 0x7aa2f7,
  playerDark: 0x5a7ac0,
  bookshelf: 0x8b5a3c,
  bookshelfDark: 0x5a3a22,
  bookshelfHighlight: 0xb08050,
  book: 0xe06c75,
  bookAlt: 0xc678dd,
  bookCorrect: 0x98c379,
  clue: 0xffd866,
  clueGlow: 0xffa500,
  indexCard: 0xe8e8f0,
  indexCardBroken: 0xff6b6b,
  indexCardFixed: 0x6bff9f,
  hudBg: 0x1e1e2e,
  hudBorder: 0x3d3d5c,
  text: 0xe8e8f0,
  textDim: 0x8892b0,
  accent: 0x7aa2f7,
  success: 0x98c379,
  error: 0xff6b6b,
  warning: 0xffd866,
  locked: 0x5a5a7a,
  gridLine: 0x2a2a3c
} as const;

export type ColorKey = keyof typeof COLORS;

export const FONTS = {
  title: {
    small: {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#e8e8f0'
    },
    medium: {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#e8e8f0'
    },
    large: {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#e8e8f0'
    },
    huge: {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#e8e8f0'
    }
  }
};
