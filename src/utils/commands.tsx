import { Dispatch, SetStateAction } from 'react';
import { Theme } from './themes.tsx';
import { loginUser, registerUser, User } from './auth.ts';

// #region Type Declarations
type Command = {
  description: string;
  argsAllowed: boolean;
  optionsAllowed: boolean;
  isListed: boolean;
  execute: (args: string[], options: Record<string, string | boolean>) => string | Promise<string>;
};

// interface ApiResponse {
//   data: string | null;
//   error: string | null;
// }

// #endregion

export const HEADER = `<pre style="font-size: clamp(0.8em, 1vw, 1em); font-family: 'UbuntuMono'">

████████ ███████ ██████  ███    ███ ██ ███    ██  █████  ██           ██████
   ██    ██      ██   ██ ████  ████ ██ ████   ██ ██   ██ ██           ██   ██
   ██    █████   ██████  ██ ████ ██ ██ ██ ██  ██ ███████ ██    █████  ██   ██
   ██    ██      ██   ██ ██  ██  ██ ██ ██  ██ ██ ██   ██ ██           ██   ██
   ██    ███████ ██   ██ ██      ██ ██ ██   ████ ██   ██ ███████      ██████
                                    A Terminal Themed Portfolio By Dewald Breed</pre>`;

// Houses objects for each valid command
export const createCommands = (
  setActiveTheme: Dispatch<SetStateAction<Theme>>,
  getActiveTheme: () => Theme,
  setThemes: Dispatch<SetStateAction<Record<string, Theme>>>,
  getThemes: () => Record<string, Theme>,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setLineHistory: Dispatch<SetStateAction<string[]>>,
  setSession: Dispatch<SetStateAction<User | null>>,
  setLineHead: Dispatch<React.SetStateAction<string>>,
  setIsPrompting: React.Dispatch<React.SetStateAction<string | null>>,
  getIsPrompting: () => string | null,
  setInputBuffer: Dispatch<React.SetStateAction<string[]>>,
  getInputBuffer: () => string[],
  getSession: () => User | null,
  defaultLineHead: string
): Record<string, Command> => {
  return {
    ['about']: {
      description: '',
      argsAllowed: false,
      optionsAllowed: false,
      isListed: false,
      execute: () => {
        return `Welcome to Terminal-D<br>
        Terminal-D started as a way to make my portfolio more interactive and engaging—something beyond a simple GitHub link. I wanted a flexible, creative space to showcase my work and explore my interests, and a terminal emulator felt like the perfect fit.
        It’s versatile, interactive, and a great way to experiment with different programming technologies. With Terminal-D, I can turn my projects into commands, giving others a fun way to explore my work while I continue learning and building.`;
      },
    },
    ['theme']: {
      description: 'Change the theme to a preset scheme, or create your own.',
      argsAllowed: true,
      optionsAllowed: false,
      isListed: true,
      execute: (args, options) =>
        handleTheme(args, options, setThemes, setActiveTheme, getActiveTheme, getThemes),
    },
    ['clear']: {
      description:
        'Clear the terminal screen, removing all previous commands and output displayed.',
      argsAllowed: false,
      optionsAllowed: false,
      isListed: true,
      execute: () => {
        setLineHistory([
          HEADER,
          `Welcome to Terminal-D!<br>Type \`help\` to get started or \`about\` to learn more about Terminal-D.<br><br>`,
        ]);
        return '';
      },
    },
    ['date']: {
      description: `Returns the current date/time. Args: date "dateString" to specify a date.`,
      argsAllowed: true,
      optionsAllowed: false,
      isListed: true,
      execute: (args) => {
        const dateString = args[0]?.toLowerCase();
        if (dateString) {
          return getDate(dateString);
        } else {
          return getDate();
        }
      },
    },
    ['login']: {
      description: `Login with email and provide your password when prompted.<br>
        Example: login -u yourEmailAddress.`,
      argsAllowed: true,
      optionsAllowed: false,
      isListed: true,
      execute: async (args, options) => {
        if (getSession())
          return 'Cannot login while already logged in. Please log out and try again.';
        const usernameOption = options['-u'];
        const username = args[0]?.toLocaleLowerCase();
        const isPrompting = getIsPrompting();

        if (usernameOption && username) {
          //prompt for password
          setIsPrompting('login');
          setInputBuffer([username]);
          setLineHead('Password:');
          return '';
        } else if (isPrompting && isPrompting === 'login') {
          // attempt to login in with credentials
          const bufferUsername = getInputBuffer()[0];
          const password = args[0];
          setLineHead(defaultLineHead);

          return handleAuth(
            bufferUsername,
            password,
            false,
            setLoading,
            setSession,
            setLineHead,
            setInputBuffer,
            setIsPrompting
          );
        } else {
          return 'To Login, please provide your email (i.e., login -u youremail@mail.com) and when prompted, provide your password.';
        }
      },
    },
    ['register']: {
      description: `Register with email and provide your password when prompted.<br>
        Example: register -u yourEmailAddress.`,
      argsAllowed: true,
      optionsAllowed: false,
      isListed: true,
      execute: async (args, options) => {
        if (getSession()) return 'Cannot register while logged in. Please log out and try again.';

        const usernameOption = options['-u'];
        const username = args[0]?.toLocaleLowerCase();
        const isPrompting = getIsPrompting();
        const inputBuffer = getInputBuffer();

        if (usernameOption && username) {
          //prompt for password

          setIsPrompting('register');
          setInputBuffer([username]);
          setLineHead('Enter your password:');
          return '';
        } else if (isPrompting === 'register' && inputBuffer.length == 1) {
          // confirm password

          const firstPassword = args[0];
          setInputBuffer((prev) => [...prev, firstPassword]);
          setLineHead('Confirm your password:');
          return '';
        } else if (isPrompting === 'register' && inputBuffer.length == 2) {
          // attempt to login in with credentials

          const [bufferUsername, firstPass] = getInputBuffer();
          const secondPass = args[0];

          if (firstPass !== secondPass) {
            setInputBuffer([bufferUsername]); // Send back to previous step
            setLineHead('Enter your password:');
            return 'Passwords do not match. Please try again';
          }

          setLineHead(defaultLineHead);

          return handleAuth(
            bufferUsername,
            firstPass,
            true,
            setLoading,
            setSession,
            setLineHead,
            setInputBuffer,
            setIsPrompting
          );
        } else {
          return 'To Register, please provide your email (i.e., Register -u youremail@mail.com) and when prompted, provide your password.';
        }
      },
    },
    ['logout']: {
      description: `Log out from your current session.`,
      argsAllowed: false,
      optionsAllowed: false,
      isListed: true,
      execute: () => {
        if (getSession()) {
          setSession(null);
          localStorage.removeItem('token');
          return 'Successfully logged out.';
        } else {
          return 'You are already logged out.';
        }
      },
    },
  };
};

// #region Misc command functions

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

export function simulateAsync(delay: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('Done');
    }, delay);
  });
}

const handleAuth = async (
  username: string,
  password: string,
  isRegistration: boolean,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setSession: Dispatch<SetStateAction<User | null>>,
  setLineHead: Dispatch<React.SetStateAction<string>>,
  setInputBuffer: Dispatch<SetStateAction<string[]>>,
  setIsPrompting: Dispatch<SetStateAction<string | null>>
) => {
  setLoading(true);

  try {
    if (isRegistration) {
      // Register
      if (username && password) {
        const { data, error } = await registerUser(username, password);

        if (error) {
          return error;
        }

        return data ? data : 'Something went wrong.';
      } else {
        return 'To Register, please provide your email (i.e., Register -u youremail@mail.com) and when prompted, provide your password.';
      }
    } else {
      // LOGIN
      if (username && password) {
        const { data, error } = await loginUser(username, password);

        if (error) {
          return error;
        }

        if (data) {
          setSession(data);
          // const username = data.email.split('@')[0];
          // setLineHead(`${username}@terminalD:~$`);
          return `Login successful! Welcome back, ${username}.`;
        } else {
          return 'Something went wrong.';
        }
      } else {
        return 'To Login, please provide your email (i.e., login -u youremail@mail.com) and when prompted, provide your password.';
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
    setIsPrompting(null);
    setInputBuffer([]);
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
      return `
      Please provide a valid colors string (i.e. blue, black, azure ect.)<br>
      Example: theme new "themeName" -bg="backgroundColorName" -text="textColorName"`;
    }
  } else {
    // select preset

    const activeTheme = getActiveTheme();
    const allThemes = getThemes();
    const themeArg = args[0]?.toLowerCase();

    // if (options['-l']) return Object.keys(allThemes).map((key) => key);

    if (!themeArg || themeArg.trim() === '')
      return `Please provide a valid theme name, or use the "new" keyword to create a new theme.<br>
        Example: theme new -bg="backgroundColor" -text="fontColor"
      `;

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
// #endregion
