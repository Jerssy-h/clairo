import type { translations } from './i18n';

export type TranslationSet = typeof translations.en;

export type ActivityId = 'flashcard' | 'quiz' | 'sentence' | 'stroke';

export type ActivityConfig = {
  id: ActivityId;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  minWords: number;
  route: '/flashcard' | '/quiz' | '/sentence' | '/stroke';
};

export const shiftHue = (hex: string, degree: number) => {
  let r = parseInt(hex.substring(1, 3), 16) / 255;
  let g = parseInt(hex.substring(3, 5), 16) / 255;
  let b = parseInt(hex.substring(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  h = (h * 360 + degree) % 360;
  h /= 360;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r1 = l;
  let g1 = l;
  let b1 = l;

  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r1 = hue2rgb(p, q, h + 1 / 3);
    g1 = hue2rgb(p, q, h);
    b1 = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r1)}${toHex(g1)}${toHex(b1)}`;
};

export const buildActivities = ({
  t,
  baseColor,
  mode,
}: {
  t: TranslationSet;
  baseColor: string;
  mode: 'topic' | 'all-words';
}): ActivityConfig[] => {
  const sharedSubtitle = mode === 'all-words' ? t.allWords : undefined;

  return [
    {
      id: 'flashcard',
      title: t.flashcards,
      subtitle: sharedSubtitle ?? t.recognition,
      icon: '卡',
      color: baseColor,
      minWords: 1,
      route: '/flashcard',
    },
    {
      id: 'quiz',
      title: t.quiz,
      subtitle: sharedSubtitle ?? t.testing,
      icon: '测',
      color: baseColor,
      minWords: 4,
      route: '/quiz',
    },
    {
      id: 'sentence',
      title: t.sentenceBuilder,
      subtitle: sharedSubtitle ?? t.production,
      icon: '句',
      color: baseColor,
      minWords: 1,
      route: '/sentence',
    },
    {
      id: 'stroke',
      title: t.strokes,
      subtitle: sharedSubtitle ?? t.writing,
      icon: '笔',
      color: baseColor,
      minWords: 1,
      route: '/stroke',
    },
  ];
};
