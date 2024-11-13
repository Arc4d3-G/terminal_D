import { Dispatch, SetStateAction } from 'react';
import { Theme, dark, retro } from './themes.tsx';

type Command = {
  description: string;
  argsAllowed: boolean;
  execute: (args: string[], options: Record<string, string | boolean>) => string;
};

type ParsedInput = {
  command: string;
  args: string[];
  options: Record<string, string | boolean>;
};

export const parseInput = (input: string): ParsedInput => {
  // Split by spaces, respecting quoted substrings
  const inputArr = (input.match(/(?:[^\s"]+|"[^"]*")+/g) || []).map(
    (arg) => arg.replace(/(^"|"$)/g, '') // Remove quotes around quoted substrings
  );

  const [command, ...rest] = inputArr;
  const args: string[] = [];
  const options: Record<string, string | boolean> = {};

  rest.forEach((part) => {
    if (part.startsWith('-')) {
      // If option has an '=', treat it as key-value; otherwise, it's a boolean flag
      const [option, value] = part.split('=');
      options[option] = value ?? true;
    } else {
      args.push(part);
    }
  });

  return { command, args, options };
};

export const createCommands = (
  setTheme: Dispatch<SetStateAction<Theme>>,
  getTheme: () => Theme,
  setLineHistory: Dispatch<SetStateAction<string[]>>
): Record<string, Command> => {
  return {
    ['retro']: {
      description: 'Set the theme to "retro" mode.',
      argsAllowed: false,
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
      argsAllowed: false,
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
      argsAllowed: false,
      execute: () => {
        setLineHistory([]);
        return '';
      },
    },
    ['date']: {
      description: 'Returns the current date/time. Options: -d=[dateString] to specify a date.',
      argsAllowed: true,
      execute: (args, options) => {
        const dateString = options['-d'] as string | undefined;

        if (dateString) {
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
