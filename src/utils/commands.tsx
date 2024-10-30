import { Theme, dark, retro } from './themes.tsx';

type Command = {
  description: string;
  execute: () => string;
};

export const createCommands = (
  setTheme: React.Dispatch<React.SetStateAction<Theme>>,
  getTheme: () => Theme
  // handleLoading: () => void
): Record<string, Command> => {
  return {
    ['retro']: {
      description: 'Set the theme to "retro" mode.',
      execute: () => {
        if (getTheme() !== retro) {
          setTheme(retro);
          return 'Theme set to "retro" mode.';
        } else {
          return 'Theme is already set to "retro" mode.';
        }
      },
    },
    ['dark']: {
      description: 'Set the theme to "dark" mode.',
      execute: () => {
        if (getTheme() !== dark) {
          setTheme(dark);
          return 'Theme set to "dark" mode.';
        } else {
          return 'Theme is already set to "dark" mode.';
        }
      },
    },
  };
};

export const HEADER = `
████████ ███████ ██████  ███    ███ ██ ███    ██  █████  ██            ██████  
   ██    ██      ██   ██ ████  ████ ██ ████   ██ ██   ██ ██            ██   ██ 
   ██    █████   ██████  ██ ████ ██ ██ ██ ██  ██ ███████ ██      █████ ██   ██ 
   ██    ██      ██   ██ ██  ██  ██ ██ ██  ██ ██ ██   ██ ██            ██   ██ 
   ██    ███████ ██   ██ ██      ██ ██ ██   ████ ██   ██ ███████       ██████  
                                    A Terminal Themed Portfolio By Dewald Breed
`;
