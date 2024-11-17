import { Dispatch, SetStateAction } from 'react';
import { Theme, dark, retro } from './themes.tsx';
import supabase from './supabase.ts';
import { Session } from '@supabase/supabase-js';

type Command = {
  description: string;
  argsAllowed: boolean;
  execute: (args: string[], options: Record<string, string | boolean>) => string | Promise<string>;
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
  setTheme: Dispatch<SetStateAction<Theme>>,
  getTheme: () => Theme,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setLineHistory: Dispatch<SetStateAction<string[]>>,
  setSession: Dispatch<SetStateAction<Session | null>>
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
      // TODO add an arg?
      description: 'Returns the current date/time. Options: -d="dateString" to specify a date.',
      argsAllowed: false,
      execute: (args, options) => {
        const dateString = options['-d'] as string | undefined;
        console.log(args);
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
      description:
        "Login or Register a user account. Arguments: 'new' to register. Options: -email=[emailAddress] to provide email to login/register, -pass=[password] to provide password to login/register.",
      argsAllowed: true,
      execute: async (args, options) => {
        setLoading(true);
        const isNew = args[0] == 'new';
        const email = options['-email'] as string | undefined;
        const password = options['-pass'] as string | undefined;

        try {
          if (isNew) {
            if (email && password) {
              // Register
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
              return 'To Register, please provide a valid email address and password. (i.e. login new -e="youremail@mail.com" -p="yourpassword"';
            }
          } else {
            // LOGIN
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
              return 'To Login, please provide your email and password. (i.e., login -e="youremail@mail.com" -p="yourpassword")';
            }
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            return `Error: ${error.message}`;
          } else {
            return 'An unknown error occurred';
          }
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
