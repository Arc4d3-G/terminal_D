import { Dispatch, SetStateAction } from 'react';
import { Theme } from './themes.tsx';
import supabase from './supabase.ts';
import { Session } from '@supabase/supabase-js';

type Command = {
  description: string | string[];
  argsAllowed: boolean;
  optionsAllowed: boolean;
  execute: (
    args: string[],
    options: Record<string, string | boolean>
  ) => string | string[] | Promise<string>;
};

type ParsedInput = {
  command: string | undefined;
  args: string[];
  options: Record<string, string | boolean>;
};

export const parseInput = (input: string): ParsedInput => {
  // Split by spaces, respecting quoted substrings
  const inputArr = (input.match(/(?:[^\s"]+|"[^"]*")+/g) || []).map((part) => {
    return part.replace(/['"]/g, '');
  });

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
  console.log({ command, args, options });
  return { command, args, options };
};

export const createCommands = (
  setActiveTheme: Dispatch<SetStateAction<Theme>>,
  getActiveTheme: () => Theme,
  setThemes: Dispatch<SetStateAction<Record<string, Theme>>>,
  getThemes: () => Record<string, Theme>,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setLineHistory: Dispatch<SetStateAction<string[]>>,
  setSession: Dispatch<SetStateAction<Session | null>>
): Record<string, Command> => {
  return {
    ['theme']: {
      description: 'Change the theme to a preset scheme, or create your own.',
      argsAllowed: true,
      optionsAllowed: false,
      execute: (args, options) =>
        handleTheme(args, options, setThemes, setActiveTheme, getActiveTheme, getThemes),
    },
    ['clear']: {
      description:
        'Clear the terminal screen, removing all previous commands and output displayed.',
      argsAllowed: false,
      optionsAllowed: false,
      execute: () => {
        setLineHistory([]);
        return '';
      },
    },
    ['date']: {
      description: 'Returns the current date/time. Args: date "dateString" to specify a date.',
      argsAllowed: true,
      optionsAllowed: false,
      execute: (args) => {
        const dateString = args[0]?.toLowerCase();
        if (dateString) {
          return getDate(dateString);
        } else {
          return getDate();
        }
      },
    },
    ['load']: {
      description: 'test',
      argsAllowed: false,
      optionsAllowed: false,
      execute: async () => {
        setLoading(true);

        try {
          const result = await simulateAsync(5000); // Wait for the promise to resolve
          setLoading(false); // Turn off loading after promise resolution

          if (result === 'Done') {
            return 'done loading';
          } else {
            return 'Something went wrong';
          }
        } catch (error) {
          setLoading(false); // Ensure loading state is reset even if an error occurs
          return `Error: ${error}`;
        }
      },
    },
    ['login']: {
      description: [
        'Login with your username and password, or use the "new" keyword to register a new account.',
        'Example: `login new "yourEmailAddress" "yourPassWord"` to register.',
      ],
      argsAllowed: true,
      optionsAllowed: false,
      execute: async (args) => handleAuth(args, setLoading, setSession),
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

function simulateAsync(delay: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('Done');
    }, delay);
  });
}

export const HEADER = `
████████ ███████ ██████  ███    ███ ██ ███    ██  █████  ██           ██████  
   ██    ██      ██   ██ ████  ████ ██ ████   ██ ██   ██ ██           ██   ██ 
   ██    █████   ██████  ██ ████ ██ ██ ██ ██  ██ ███████ ██    █████  ██   ██ 
   ██    ██      ██   ██ ██  ██  ██ ██ ██  ██ ██ ██   ██ ██           ██   ██ 
   ██    ███████ ██   ██ ██      ██ ██ ██   ████ ██   ██ ███████      ██████  
                                    A Terminal Themed Portfolio By Dewald Breed
`;

const handleAuth = async (
  args: string[],
  setLoading: Dispatch<SetStateAction<boolean>>,
  setSession: Dispatch<SetStateAction<Session | null>>
) => {
  setLoading(true);
  const isNew = args[0]?.toLowerCase() === 'new';

  try {
    if (isNew) {
      // Register
      const email = args[1];
      const password = args[2];
      if (email && password) {
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
        });

        if (error) {
          throw new Error(error.message);
        }

        setSession(data.session);
        return data.user
          ? `Registration successful! Welcome, ${email}.`
          : 'Registration complete, but no user data returned.';
      } else {
        return 'To Register, please provide a valid email address and password. (i.e. login new "youremail@mail.com" "yourpassword"';
      }
    } else {
      // LOGIN
      const email = args[0];
      const password = args[1];

      if (email && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (error) {
          throw new Error(error.message);
        }

        setSession(data.session);
        return data.user
          ? `Login successful! Welcome back, ${email}.`
          : 'Login successful, but no user data returned.';
      } else {
        return 'To Login, please provide your email and password. (i.e., login "youremail@mail.com" "yourpassword"';
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    } else {
      return 'An unknown error occurred';
    }
  } finally {
    setLoading(false);
  }
};

const handleTheme = (
  args: string[],
  options: Record<string, string | boolean>,
  setThemes: Dispatch<SetStateAction<Record<string, Theme>>>,
  setActiveTheme: Dispatch<SetStateAction<Theme>>,
  getActiveTheme: () => Theme,
  getThemes: () => Record<string, Theme>
) => {
  const isNew = args[0]?.toLowerCase() === 'new';

  if (isNew) {
    // create new theme
    const name: string = args[1]?.toLowerCase();
    const bgColor = options['-bg'] as string | undefined;
    const textColor = options['-text'] as string | undefined;

    if (bgColor && textColor) {
      const newTheme: Theme = {
        bg: bgColor,
        primary: textColor,
        font: textColor,
      };
      setThemes((prev) => ({ ...prev, [name]: newTheme }));
      setActiveTheme(newTheme);
      return `New theme "${name}" has been successfully created.`;
    } else {
      return [
        `Please provide a valid colors string (i.e. blue, black, azure ect.).`,
        `Example: theme new "themeName" -bg="backgroundColorName" -text="textColorName"`,
      ];
    }
  } else {
    // select preset
    const activeTheme = getActiveTheme();
    const allThemes = getThemes();
    const themeArg = args[0]?.toLowerCase();

    if (!themeArg || themeArg.trim() === '')
      return [
        'Please provide a valid theme name, or use the "new" keyword to create a new theme.',
        'Example: theme new -bg="backgroundColor" -text="fontColor"',
      ];

    const validTheme = allThemes[themeArg];
    if (validTheme && validTheme !== activeTheme) {
      setActiveTheme(validTheme);
      return `Theme set to ${themeArg}.`;
    } else {
      if (validTheme) {
        return `Theme is already set to ${themeArg}.`;
      } else {
        return `Theme ${themeArg} does not exist.`;
      }
    }
  }
};
