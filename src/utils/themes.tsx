export type Theme = {
  bg: string;
  primary: string;
  secondary: string;
  font: string;
};

export const getPresetThemes = (): Record<string, Theme> => {
  return {
    ['dark']: {
      bg: '#333333',
      primary: '#4E9A06',
      secondary: '#3465A4',
      font: '#ffffffde',
    },
    ['retro']: {
      bg: '#0f0a01',
      primary: '#ffab0b',
      secondary: '#ffab0b',
      font: '#ffab0b',
    },
  };
};
