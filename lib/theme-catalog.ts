import { isLightColor, mix, withAlpha } from './color.ts';

export type Palette = {
  text: string;
  mutedText: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  primaryFill: string;
  primaryText: string;
  onPrimaryMuted: string;
  onPrimarySoft: string;
  onPrimaryTrack: string;
  onPrimaryHairline: string;
  accentSoft: string;
  shadow: string;
};

export type ListMarkerShape =
  | 'dot'
  | 'sparkle'
  | 'square'
  | 'diamond'
  | 'dash'
  | 'ring'
  | 'chevron'
  | 'plus'
  | 'heart'
  | 'star';

export type BackdropPatternKind = 'stripes' | 'scanlines' | 'grid' | 'dots';

export type BackdropGradient = {
  colors: string[];
  positions: number[];
  radialCenter?: { x: number; y: number };
};

export type Backdrop = {
  gradient?: BackdropGradient;
  pattern?: { kind: BackdropPatternKind; color: string; spacing: number };
};

export type CardStyle = 'soft' | 'bevel';

export type Shape = {
  radius: number;
  borderWidth: number;
  cardStyle: CardStyle;
  bevel?: { highlight: string; shade: string };
};

export type Glass = { tint: 'light' | 'dark'; fill: string };

export type Traits = {
  isDark: boolean;
  listMarker: ListMarkerShape;
  backdrop: Backdrop | null;
  glass: Glass | null;
  shape: Shape;
  metalRim?: readonly string[];
};

export type ThemeDefinition = {
  title: string;
  subtitle: string;
  palette: Palette;
  traits: Traits;
};

type PaletteSeed = {
  background: string;
  surface: string;
  surfaceAlt?: string;
  border: string;
  text: string;
  mutedText: string;
  primary: string;
  primaryFill?: string;
  primaryText: string;
};

const ACCENT_TINT_ON_LIGHT = 0.1;
const ACCENT_TINT_ON_DARK = 0.16;

export function buildPalette(seed: PaletteSeed): Palette {
  const primaryFill = seed.primaryFill ?? seed.primary;
  const isLightOnFill = isLightColor(seed.primaryText);
  const isLightCanvas = isLightColor(seed.background);

  return {
    text: seed.text,
    mutedText: seed.mutedText,
    background: seed.background,
    surface: seed.surface,
    surfaceAlt: seed.surfaceAlt ?? mix(seed.surface, seed.text, 0.06),
    border: seed.border,
    primary: seed.primary,
    primaryFill,
    primaryText: seed.primaryText,
    onPrimaryMuted: withAlpha(seed.primaryText, 0.9),
    onPrimarySoft: isLightOnFill ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)',
    onPrimaryTrack: isLightOnFill ? 'rgba(0,0,0,0.2)' : withAlpha(seed.primaryText, 0.2),
    onPrimaryHairline: withAlpha(seed.primaryText, isLightOnFill ? 0.35 : 0.25),
    accentSoft: mix(
      seed.background,
      seed.primary,
      isLightCanvas ? ACCENT_TINT_ON_LIGHT : ACCENT_TINT_ON_DARK
    ),
    shadow: isLightCanvas ? 'rgba(10,11,13,0.12)' : 'rgba(0,0,0,0.6)',
  };
}

const SOFT_SHAPE: Shape = { radius: 16, borderWidth: 1, cardStyle: 'soft' };

export const THEMES = {
  light: {
    title: 'Light',
    subtitle: 'Paper white with one blue',
    palette: {
      text: '#0A0B0D',
      mutedText: '#5B6472',
      background: '#FFFFFF',
      surface: '#F4F6F9',
      surfaceAlt: '#EBEEF3',
      border: '#E2E6EC',
      primary: '#2158DA',
      primaryFill: '#1D4ED8',
      primaryText: '#FFFFFF',
      onPrimaryMuted: 'rgba(255,255,255,0.78)',
      onPrimarySoft: 'rgba(0,0,0,0.2)',
      onPrimaryTrack: 'rgba(0,0,0,0.2)',
      onPrimaryHairline: 'rgba(255,255,255,0.35)',
      accentSoft: '#E8EEFF',
      shadow: 'rgba(10,11,13,0.12)',
    },
    traits: { isDark: false, listMarker: 'dot', backdrop: null, glass: null, shape: SOFT_SHAPE },
  },
  dark: {
    title: 'Dark',
    subtitle: 'Midnight black with one blue',
    palette: {
      text: '#F5F7FA',
      mutedText: '#8A93A3',
      background: '#0A0B0D',
      surface: '#14161A',
      surfaceAlt: '#1C1F26',
      border: '#23262E',
      primary: '#4287F6',
      primaryFill: '#1D4ED8',
      primaryText: '#FFFFFF',
      onPrimaryMuted: 'rgba(255,255,255,0.78)',
      onPrimarySoft: 'rgba(0,0,0,0.2)',
      onPrimaryTrack: 'rgba(0,0,0,0.2)',
      onPrimaryHairline: 'rgba(255,255,255,0.35)',
      accentSoft: '#0D1B3A',
      shadow: 'rgba(0,0,0,0.6)',
    },
    traits: { isDark: true, listMarker: 'dot', backdrop: null, glass: null, shape: SOFT_SHAPE },
  },
  ember: {
    title: 'Ember',
    subtitle: 'Glowing orange with frosted glass',
    palette: {
      text: '#FFF4E6',
      mutedText: '#D4BBA6',
      background: '#0E0806',
      surface: '#1A0F0A',
      surfaceAlt: '#2D1A11',
      border: 'rgba(255,170,110,0.16)',
      primary: '#FF8A33',
      primaryFill: '#FF7A1A',
      primaryText: '#1A0B05',
      onPrimaryMuted: 'rgba(26,11,5,0.78)',
      onPrimarySoft: 'rgba(255,244,230,0.3)',
      onPrimaryTrack: 'rgba(26,11,5,0.2)',
      onPrimaryHairline: 'rgba(26,11,5,0.25)',
      accentSoft: '#3A1A0A',
      shadow: 'rgba(0,0,0,0.6)',
    },
    traits: {
      isDark: true,
      listMarker: 'sparkle',
      backdrop: {
        gradient: {
          colors: ['#050302', '#1A0804', '#6E1E06', '#6C2609', '#5B320E'],
          positions: [0, 0.45, 0.72, 0.88, 1],
        },
        pattern: { kind: 'stripes', color: 'rgba(0,0,0,0.22)', spacing: 4 },
      },
      glass: { tint: 'dark', fill: 'rgba(28,16,11,0.72)' },
      shape: SOFT_SHAPE,
    },
  },
  paper: {
    title: 'Paper Ink',
    subtitle: 'Warm paper and fountain-pen blue',
    palette: buildPalette({
      background: '#FFFCF0',
      surface: '#F2F0E5',
      surfaceAlt: '#E6E4D9',
      border: '#DAD8CE',
      text: '#100F0F',
      mutedText: '#5E5D59',
      primary: '#205EA6',
      primaryText: '#FFFCF0',
    }),
    traits: {
      isDark: false,
      listMarker: 'dot',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  dawn: {
    title: 'Dawn',
    subtitle: 'Rosy cream, soft and slow',
    palette: buildPalette({
      background: '#FAF4ED',
      surface: '#FFFAF3',
      surfaceAlt: '#F2E9E1',
      border: '#E6DCD3',
      text: '#464261',
      mutedText: '#66627F',
      primary: '#9A4A62',
      primaryText: '#FFFAF3',
    }),
    traits: {
      isDark: false,
      listMarker: 'heart',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  toast: {
    title: 'Toast',
    subtitle: 'Butter yellow and burnt orange',
    palette: buildPalette({
      background: '#FBF1C7',
      surface: '#F2E5BC',
      surfaceAlt: '#EBDBB2',
      border: '#D5C4A1',
      text: '#3C3836',
      mutedText: '#665C54',
      primary: '#AA3A05',
      primaryText: '#FBF1C7',
    }),
    traits: {
      isDark: false,
      listMarker: 'square',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  matcha: {
    title: 'Matcha',
    subtitle: 'Whisked green on rice paper',
    palette: buildPalette({
      background: '#F1EFE6',
      surface: '#FBFAF5',
      border: '#DEDBCD',
      text: '#2F3A2B',
      mutedText: '#5F6857',
      primary: '#4A6328',
      primaryText: '#FBFAF5',
    }),
    traits: {
      isDark: false,
      listMarker: 'diamond',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  cottage: {
    title: 'Cottage',
    subtitle: 'Linen, terracotta and cross-stitch',
    palette: buildPalette({
      background: '#F5EEDC',
      surface: '#FFFAF0',
      border: '#E5D9BF',
      text: '#3E3328',
      mutedText: '#6E6150',
      primary: '#924830',
      primaryText: '#FFFAF0',
    }),
    traits: {
      isDark: false,
      listMarker: 'plus',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  newsprint: {
    title: 'Newsprint',
    subtitle: 'Morning paper, red ink, hard rules',
    palette: buildPalette({
      background: '#F4F1EA',
      surface: '#FBF9F4',
      border: '#2A2A2A',
      text: '#111111',
      mutedText: '#555555',
      primary: '#B3001B',
      primaryText: '#FFFFFF',
    }),
    traits: {
      isDark: false,
      listMarker: 'dash',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  mocha: {
    title: 'Mocha',
    subtitle: 'Soft cocoa dark with peach',
    palette: buildPalette({
      background: '#1E1E2E',
      surface: '#2A2A3C',
      border: '#3A3B52',
      text: '#CDD6F4',
      mutedText: '#A6ADC8',
      primary: '#FAB387',
      primaryText: '#1E1E2E',
    }),
    traits: {
      isDark: true,
      listMarker: 'sparkle',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  hearth: {
    title: 'Hearth',
    subtitle: 'Woodsmoke brown and campfire orange',
    palette: buildPalette({
      background: '#282828',
      surface: '#32302F',
      surfaceAlt: '#3C3836',
      border: '#45403D',
      text: '#EBDBB2',
      mutedText: '#BDAE93',
      primary: '#FE8019',
      primaryText: '#282828',
    }),
    traits: {
      isDark: true,
      listMarker: 'square',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  nocturne: {
    title: 'Nocturne',
    subtitle: 'Vampire purple after midnight',
    palette: buildPalette({
      background: '#282A36',
      surface: '#343746',
      border: '#44475A',
      text: '#F8F8F2',
      mutedText: '#AAB2DA',
      primary: '#C6A2FA',
      primaryText: '#282A36',
    }),
    traits: {
      isDark: true,
      listMarker: 'ring',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  fjord: {
    title: 'Fjord',
    subtitle: 'Arctic slate behind frosted glass',
    palette: buildPalette({
      background: '#2E3440',
      surface: '#393F4F',
      surfaceAlt: '#414A5B',
      border: 'rgba(216,222,233,0.12)',
      text: '#ECEFF4',
      mutedText: '#B6BFCE',
      primary: '#94C6D4',
      primaryText: '#2E3440',
    }),
    traits: {
      isDark: true,
      listMarker: 'diamond',
      backdrop: {
        gradient: {
          colors: ['#242933', '#2E3440', '#3B4252', '#434C5E'],
          positions: [0, 0.4, 0.8, 1],
        },
      },
      glass: { tint: 'dark', fill: 'rgba(46,52,64,0.7)' },
      shape: SOFT_SHAPE,
    },
  },
  nightRain: {
    title: 'Night Rain',
    subtitle: 'Rain-blue city lights',
    palette: buildPalette({
      background: '#1A1B26',
      surface: '#232638',
      surfaceAlt: '#282C40',
      border: 'rgba(122,162,247,0.18)',
      text: '#C0CAF5',
      mutedText: '#A9B1D6',
      primary: '#7AA2F7',
      primaryText: '#1A1B26',
    }),
    traits: {
      isDark: true,
      listMarker: 'chevron',
      backdrop: {
        gradient: {
          colors: ['#16161E', '#1A1B26', '#24283B', '#2F2A4A'],
          positions: [0, 0.45, 0.8, 1],
        },
      },
      glass: { tint: 'dark', fill: 'rgba(26,27,38,0.72)' },
      shape: SOFT_SHAPE,
    },
  },
  signal: {
    title: 'Signal',
    subtitle: 'Black glass, dot-matrix, one red light',
    palette: buildPalette({
      background: '#000000',
      surface: '#111111',
      surfaceAlt: '#1A1A1A',
      border: '#262626',
      text: '#FFFFFF',
      mutedText: '#9A9A9A',
      primary: '#FF3B3B',
      primaryFill: '#B5141B',
      primaryText: '#FFFFFF',
    }),
    traits: {
      isDark: true,
      listMarker: 'ring',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  classic: {
    title: 'Classic',
    subtitle: 'Grey bevels from a 1995 desktop',
    palette: buildPalette({
      background: '#C0C0C0',
      surface: '#C0C0C0',
      surfaceAlt: '#D4D0C8',
      border: '#808080',
      text: '#000000',
      mutedText: '#3A3A3A',
      primary: '#000080',
      primaryText: '#FFFFFF',
    }),
    traits: {
      isDark: false,
      listMarker: 'square',
      backdrop: null,
      glass: null,
      shape: {
        radius: 0,
        borderWidth: 2,
        cardStyle: 'bevel',
        bevel: { highlight: '#FFFFFF', shade: '#404040' },
      },
    },
  },
  blueprint: {
    title: 'Blueprint',
    subtitle: 'White lines on drafting blue',
    palette: buildPalette({
      background: '#0F4C81',
      surface: '#135A96',
      border: 'rgba(255,255,255,0.35)',
      text: '#FFFFFF',
      mutedText: '#D3E3F5',
      primary: '#FFFFFF',
      primaryText: '#0F4C81',
    }),
    traits: {
      isDark: true,
      listMarker: 'plus',
      backdrop: null,
      glass: null,
      shape: SOFT_SHAPE,
    },
  },
  outrun: {
    title: 'Outrun',
    subtitle: 'Neon grid racing to a pink horizon',
    palette: buildPalette({
      background: '#0D0221',
      surface: '#180A38',
      surfaceAlt: '#26114E',
      border: 'rgba(5,217,232,0.35)',
      text: '#F9F7FF',
      mutedText: '#C3B8E6',
      primary: '#FF4F8B',
      primaryText: '#0D0221',
    }),
    traits: {
      isDark: true,
      listMarker: 'chevron',
      backdrop: {
        gradient: {
          colors: ['#0D0221', '#1A0638', '#3B0B5C', '#4C0F46', '#510D36'],
          positions: [0, 0.4, 0.68, 0.86, 1],
        },
      },
      glass: { tint: 'dark', fill: 'rgba(13,2,33,0.72)' },
      shape: SOFT_SHAPE,
    },
  },
  vapor: {
    title: 'Vapor',
    subtitle: 'Mall-fountain pink and cyan',
    palette: buildPalette({
      background: '#1B0F33',
      surface: '#3B2968',
      surfaceAlt: '#473278',
      border: '#01CDFE',
      text: '#FFFFFF',
      mutedText: '#DCCDF7',
      primary: '#FF7FD3',
      primaryText: '#1B0F33',
    }),
    traits: {
      isDark: true,
      listMarker: 'star',
      backdrop: {
        gradient: {
          colors: ['#120A26', '#2B1B4A', '#4A2370', '#54275F', '#163A61'],
          positions: [0, 0.35, 0.65, 0.85, 1],
        },
      },
      glass: { tint: 'dark', fill: 'rgba(27,15,51,0.7)' },
      shape: SOFT_SHAPE,
    },
  },
  aero: {
    title: 'Aero',
    subtitle: 'Glossy sky glass and fresh grass',
    palette: buildPalette({
      background: '#DFF3FF',
      surface: '#F4FBFF',
      surfaceAlt: '#F9FDFF',
      border: 'rgba(255,255,255,0.9)',
      text: '#0B2A4A',
      mutedText: '#365777',
      primary: '#005A8C',
      primaryText: '#FFFFFF',
    }),
    traits: {
      isDark: false,
      listMarker: 'dot',
      backdrop: {
        gradient: {
          colors: ['#9FD8FF', '#CDEBFF', '#EEF9FF', '#E3F6D2', '#B9E39A'],
          positions: [0, 0.3, 0.6, 0.85, 1],
        },
      },
      glass: { tint: 'light', fill: 'rgba(255,255,255,0.5)' },
      shape: SOFT_SHAPE,
    },
  },
  daydream: {
    title: 'Daydream',
    subtitle: 'Pastel haze of sky, lilac and peach',
    palette: buildPalette({
      background: '#E9DDFB',
      surface: '#FBF8FF',
      surfaceAlt: '#F1EAFD',
      border: '#E3D6F7',
      text: '#24163F',
      mutedText: '#4F4470',
      primary: '#6A22AE',
      primaryText: '#FFFFFF',
    }),
    traits: {
      isDark: false,
      listMarker: 'sparkle',
      backdrop: {
        gradient: {
          colors: ['#B7DCFA', '#D8C6F6', '#F4BCDD', '#FFC9B4', '#D2B1F5'],
          positions: [0, 0.3, 0.55, 0.78, 1],
        },
      },
      glass: { tint: 'light', fill: 'rgba(255,255,255,0.55)' },
      shape: SOFT_SHAPE,
    },
  },
  afterglow: {
    title: 'Afterglow',
    subtitle: 'A pane of light fading red to blue',
    palette: buildPalette({
      background: '#0B0A0F',
      surface: '#16131C',
      surfaceAlt: '#1F1A27',
      border: '#2A2333',
      text: '#F5EEF8',
      mutedText: '#BFB2CC',
      primary: '#FF7B8E',
      primaryText: '#14080C',
    }),
    traits: {
      isDark: true,
      listMarker: 'diamond',
      backdrop: {
        gradient: {
          colors: ['#0B0A0F', '#1A1020', '#4A1D3D', '#4C2B63', '#293374'],
          positions: [0, 0.35, 0.6, 0.82, 1],
        },
      },
      glass: { tint: 'dark', fill: 'rgba(11,10,15,0.72)' },
      shape: SOFT_SHAPE,
    },
  },
  ripple: {
    title: 'Ripple',
    subtitle: 'Crimson rings spreading into blue',
    palette: buildPalette({
      background: '#0B0509',
      surface: '#1A0D16',
      surfaceAlt: '#24121F',
      border: '#3A1D30',
      text: '#FFFFFF',
      mutedText: '#E6DDF5',
      primary: '#FFB0CC',
      primaryText: '#1A0610',
    }),
    traits: {
      isDark: true,
      listMarker: 'ring',
      backdrop: {
        gradient: {
          colors: [
            '#0B0509',
            '#3A0A1E',
            '#3A0A1E',
            '#7A1238',
            '#7A1238',
            '#7E0F3A',
            '#7E0F3A',
            '#6A2260',
            '#6A2260',
            '#4A3F9A',
            '#4A3F9A',
            '#2E4A94',
          ],
          positions: [0, 0.1, 0.16, 0.2, 0.28, 0.32, 0.42, 0.46, 0.58, 0.62, 0.76, 1],
          radialCenter: { x: 0, y: 0.85 },
        },
      },
      glass: { tint: 'dark', fill: 'rgba(11,5,9,0.7)' },
      shape: SOFT_SHAPE,
    },
  },
  cobalt: {
    title: 'Cobalt',
    subtitle: 'Deep blue with a drift of cream',
    palette: buildPalette({
      background: '#141A8C',
      surface: '#1A22A6',
      surfaceAlt: '#222BB8',
      border: 'rgba(255,248,234,0.18)',
      text: '#FFF8EA',
      mutedText: '#D8D4F2',
      primary: '#F3E7CC',
      primaryText: '#141A8C',
    }),
    traits: {
      isDark: true,
      listMarker: 'star',
      backdrop: {
        gradient: {
          colors: ['#141A8C', '#1E2BD6', '#2B3BE8', '#3A47E0', '#51529F'],
          positions: [0, 0.35, 0.6, 0.85, 1],
        },
      },
      glass: { tint: 'dark', fill: 'rgba(20,26,140,0.78)' },
      shape: SOFT_SHAPE,
    },
  },
  chrome: {
    title: 'Chrome',
    subtitle: 'Graphite with a living metal rim',
    palette: buildPalette({
      background: '#0D0E10',
      surface: '#17191C',
      surfaceAlt: '#202328',
      border: '#2A2D33',
      text: '#EEF1F4',
      mutedText: '#A2A8B1',
      primary: '#D4D9E0',
      primaryFill: '#1E2126',
      primaryText: '#F4F6F9',
    }),
    traits: {
      isDark: true,
      listMarker: 'diamond',
      backdrop: {
        gradient: { colors: ['#1A1C20', '#0D0E10', '#09090B'], positions: [0, 0.5, 1] },
      },
      glass: null,
      shape: SOFT_SHAPE,
      metalRim: ['#3C4148', '#C2CAD2', '#FFFFFF', '#8D959E', '#EEF2F6', '#454B52'],
    },
  },
} satisfies Record<string, ThemeDefinition>;

export type ThemeId = keyof typeof THEMES;

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];
