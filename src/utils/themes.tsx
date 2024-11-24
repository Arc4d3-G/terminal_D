export type Theme = {
  bg: string;
  primary: string;
  font: string;
};

export const getPresetThemes = (): Record<string, Theme> => {
  return {
    ['dark']: {
      bg: '#242424',
      primary: '#ffffffde',
      font: '#ffffffde',
    },
    ['retro']: {
      bg: '#0f0a01',
      primary: '#ffab0b',
      font: '#ffab0b',
    },
  };
};
