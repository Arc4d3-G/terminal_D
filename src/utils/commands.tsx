import { Dispatch, SetStateAction } from 'react';
import { Theme, dark, retro } from './themes.tsx';

type Command = {
  description: string;
  execute: (args: Array<string | null>) => string;
};

export const createCommands = (
  setTheme: Dispatch<SetStateAction<Theme>>,
  getTheme: () => Theme,
  setLineHistory: Dispatch<SetStateAction<string[]>>
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
    ['clear']: {
      description:
        'Clear the terminal screen, removing all previous commands and output displayed.',
      execute: () => {
        setLineHistory([]);
        return '';
      },
    },
    ['date']: {
      description: 'Returns the current date/time.',
      execute: (args) => {
        const [arg1, dateString] = args;
        if (arg1 === '-d' && dateString) {
          return getDate(dateString);
        } else {
          return getDate();
        }
      },
    },
  };
};

const getDate = (dateString: string | null = null) => {
  let date = new Date();

  // If -d "DATE_STRING" is provided, try parsing it
  if (dateString) {
    const parsedDate = new Date(dateString);
    // Check if parsedDate is a valid date
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate;
    } else {
      return 'Invalid date string.';
    }
  }

  return date
    .toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })
    .replace(/,/g, '');
};

// Examples:
// console.log(dateCommand()); // Default format, current date
// console.log(dateCommand('+%Y-%m-%d %H:%M:%S')); // Custom format
// console.log(dateCommand('+%a %b %d %H:%M:%S %Y')); // Another format example
// console.log(dateCommand('+%Y-%m-%d', '2024-11-08')); // Specific date
// console.log(dateCommand('+%Y-%m-%d %H:%M:%S', 'next Friday')); // Relative date

export const HEADER = `
████████ ███████ ██████  ███    ███ ██ ███    ██  █████  ██           ██████  
   ██    ██      ██   ██ ████  ████ ██ ████   ██ ██   ██ ██           ██   ██ 
   ██    █████   ██████  ██ ████ ██ ██ ██ ██  ██ ███████ ██    █████  ██   ██ 
   ██    ██      ██   ██ ██  ██  ██ ██ ██  ██ ██ ██   ██ ██           ██   ██ 
   ██    ███████ ██   ██ ██      ██ ██ ██   ████ ██   ██ ███████      ██████  
                                    A Terminal Themed Portfolio By Dewald Breed
`;
