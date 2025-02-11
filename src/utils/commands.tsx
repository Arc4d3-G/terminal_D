import { Dispatch, SetStateAction } from 'react';
import { Theme } from './themes.tsx';
import { loginUser, registerUser, User } from './auth.ts';
import { Line } from '../components/LineHistory.tsx';
import { Prompt } from '../pages/TerminalD.tsx';

// #region Type Declarations
type Command = {
  description: string;
  argsAllowed: boolean;
  optionsAllowed: boolean;
  isListed: boolean;
  execute: (args: string[], options: Record<string, string | boolean>) => string | Promise<string>;
};

type FileSystemNode =
  | { type: 'directory'; content: Record<string, FileSystemNode> }
  | { type: 'file'; content: string };

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
  setLineHistory: Dispatch<SetStateAction<Line[]>>,
  setSession: Dispatch<SetStateAction<User | null>>,
  setIsPrompting: React.Dispatch<React.SetStateAction<Prompt | null>>,
  getIsPrompting: () => Prompt | null,
  setInputBuffer: Dispatch<React.SetStateAction<string[]>>,
  getInputBuffer: () => string[],
  getSession: () => User | null,
  setCwd: React.Dispatch<React.SetStateAction<string>>,
  getCwd: () => string
): Record<string, Command> => {
  return {
    ['about']: {
      description: '',
      argsAllowed: false,
      optionsAllowed: false,
      isListed: false,
      execute: () => {
        return `<br>Welcome to Terminal-D<br>
        Terminal-D started as a way to make my portfolio more interactive and engaging—something beyond a simple GitHub link. I wanted a flexible, creative space to showcase my work and explore my interests, and a terminal emulator felt like the perfect fit.
        It’s versatile, interactive, and a great way to experiment with different programming technologies. With Terminal-D, I can turn my projects into commands, giving others a fun way to explore my work while I continue learning and building.<br><br>`;
      },
    },
    ['ls']: {
      description: `Displays the contents of the current directory or a specified directory. It lists files and subdirectories, helping you explore the file system.`,
      argsAllowed: false,
      optionsAllowed: false,
      isListed: true,
      execute: () => {
        const cwd = getCwd();
        const cwdParts = cwd.split('/');

        let path = mockFileSystem['~'];
        for (const directory of cwdParts) {
          if (path.type === 'directory' && path.content[directory]) {
            path = path.content[directory];
          }
        }

        return Object.keys(path.content).join(' ');
      },
    },
    ['cd']: {
      description: `Changes the current working directory to the specified directory. If no directory is specified, it defaults to the home directory (~).`,
      argsAllowed: true,
      optionsAllowed: false,
      isListed: true,
      execute: (args) => {
        const targetPath = args[0] || '~';

        // Handle home directory shortcut
        if (targetPath === '~') {
          setCwd('~');
          return '';
        }

        const cwd = getCwd(); // Current working directory
        const resolvedPath = normalizePath(targetPath, cwd);
        const dir = traverseFileSystem(resolvedPath, mockFileSystem);

        if (dir && dir.type === 'directory') {
          setCwd(resolvedPath);
          return '';
        } else if (dir && dir.type === 'file') {
          return `${targetPath}: Not a directory`;
        } else {
          return `${targetPath}: No such file or directory exists`;
        }
      },
    },
    ['cat']: {
      description: 'Display the content of a file',
      argsAllowed: true,
      optionsAllowed: false,
      isListed: true,
      execute: (args: string[]) => {
        const targetFile = args[0];

        if (!targetFile) {
          return 'Usage: cat [filename]';
        }

        const cwd = getCwd(); // Get current directory
        const resolvedPath = normalizePath(targetFile, cwd);
        const dir = traverseFileSystem(resolvedPath, mockFileSystem);

        if (dir && dir.type === 'file') {
          return dir.content; // Return file content
        } else if (dir && dir.type === 'directory') {
          return `${targetFile}: Is a directory`;
        } else {
          return `${targetFile}: No such file exists`;
        }
      },
    },
    ['theme']: {
      description:
        'Change the theme to a preset scheme, or create your own. Args: -bg, -text, -primary (optional), -secondary (optional).',
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
          { header: null, content: HEADER },
          {
            header: null,
            content: `Welcome to Terminal-D!<br>Type \`help\` to get started or \`about\` to learn more about Terminal-D.<br><br>`,
          },
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
      description: `Login with email and provide your password when prompted. Example: login -u your@emailAddress.com`,
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
          setIsPrompting({ for: 'login', step: 'login_pass_1', content: 'PASSWORD' });
          setInputBuffer([username]);
          return '';
        } else if (isPrompting && isPrompting.step === 'login_pass_1') {
          // attempt to login in with credentials
          const bufferUsername = getInputBuffer()[0];
          const password = args[0];

          return handleAuth(
            bufferUsername,
            password,
            false,
            setLoading,
            setSession,
            setInputBuffer,
            setIsPrompting
          );
        } else {
          return 'To Login, please provide your email (i.e., login -u your@emailAddress.com) and when prompted, provide your password.';
        }
      },
    },
    ['register']: {
      description: `Register with email and provide your password when prompted. Example: register -u yourEmailAddress.`,
      argsAllowed: true,
      optionsAllowed: false,
      isListed: true,
      execute: async (args, options) => {
        if (getSession()) return 'Cannot register while logged in. Please log out and try again.';

        const usernameOption = options['-u'];
        const username = args[0]?.toLocaleLowerCase();
        const isPrompting = getIsPrompting();

        if (usernameOption && username) {
          //prompt for password

          setIsPrompting({
            for: 'register',
            step: 'register_pass_1',
            content: 'Enter Your Password',
          });
          setInputBuffer([username]);
          return 'Password must be 8 characters.';
        } else if (isPrompting?.step === 'register_pass_1') {
          // confirm password

          const firstPassword = args[0];
          setInputBuffer((prev) => [...prev, firstPassword]);
          setIsPrompting({
            for: 'register',
            step: 'register_pass_2',
            content: 'Confirm Your Password',
          });
          return '';
        } else if (isPrompting?.step === 'register_pass_2') {
          // attempt to login in with credentials

          const [bufferUsername, firstPass] = getInputBuffer();
          const secondPass = args[0];

          if (firstPass !== secondPass) {
            setInputBuffer([bufferUsername]); // Send back to previous step
            setIsPrompting({
              for: 'register',
              step: 'register_pass_1',
              content: 'Enter Your Password',
            });
            return 'Passwords do not match. Please try again';
          }

          return handleAuth(
            bufferUsername,
            firstPass,
            true,
            setLoading,
            setSession,
            setInputBuffer,
            setIsPrompting
          );
        } else {
          return 'To Register, please provide your email (i.e., register -u your@emailAddress.com ) and when prompted, provide your password.';
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

const mockFileSystem: Record<string, FileSystemNode> = {
  '~': {
    type: 'directory',
    content: {
      skills: {
        type: 'directory',
        content: {
          languages: { type: 'file', content: 'JavaScript, TypeScript, Java, C#, SQL, PHP' },
          frameworks: {
            type: 'file',
            content: 'React, Angular, Spring Boot, Express.js, .NET Core',
          },
          tools: {
            type: 'file',
            content:
              'Git, Docker, Vite, VS Code, IntelliJ IDEA, Postman, AWS, GitHub Actions, Netlify, SupaBase',
          },
          databases: { type: 'file', content: 'MySQL, SQLite, MongoDB' },
        },
      },
      projects: {
        type: 'directory',
        content: {
          react_business_card: {
            type: 'file',
            content:
              'My first react project, a digital business card.<br>Link: <a target="_blank" href="https://dbc.dewaldbreed.co.za/">https://dbc.dewaldbreed.co.za</a>',
          },
          js_metronome: {
            type: 'file',
            content:
              'A vanilla javascript musical metronome.<br>Link: <a target="_blank" href="https://metronome.dewaldbreed.co.za/">https://metronome.dewaldbreed.co.za</a>',
          },
          react_podstream: {
            type: 'file',
            content:
              'My first larger scale react app, a podcast streaming site using a mock data api. Link: <a target="_blank" href="https://pod-stream.netlify.app/">https://pod-stream.netlify.app</a>',
          },
          express_auth_api: {
            type: 'file',
            content:
              'An express.js (node) project consisting of a user authentication system. Terminal-D\'s login` and `register` commands use this api as a proof of concept. Link: <a target="_blank" href="https://github.com/Arc4d3-G/auth-api">https://github.com/Arc4d3-G/auth-api</a>',
          },
          angular_iou: {
            type: 'file',
            content:
              'My first Angular project, in active development, is an informal debt tracking system for small groups wanting to track their `I.O.U\'s`. Link: <a target="_blank" href="https://github.com/Arc4d3-G/iou">https://github.com/Arc4d3-G/iou</a>',
          },
          java_iou_api: {
            type: 'file',
            content:
              'A Spring Boot (Java) project consisting of a RESTful API for the IOU project. Link: <a target="_blank" href="https://github.com/arc4d3-g/iou-api">https://github.com/arc4d3-g/iou-api</a>',
          },
          java_task_manager: {
            type: 'file',
            content:
              'A Java project consisting of a simple task manager with a winforms GUI and SQLite for data persistence. Link: <a target="_blank" href="https://github.com/Arc4d3-G/JavaTaskManager">https://github.com/Arc4d3-G/JavaTaskManager</a>',
          },
        },
      },
      contact: {
        type: 'directory',
        content: {
          email: { type: 'file', content: 'You can contact me at: dewaldbreed@gmail.com' },
          github: {
            type: 'file',
            content:
              '<a target="_blank" href="https://github.com/Arc4d3-G" target="_blank">https://github.com/Arc4d3-G</a>',
          },
          linkedin: {
            type: 'file',
            content:
              '<a target="_blank" href="https://www.linkedin.com/in/dewald-breed-a2297a272/" target="_blank">https://www.linkedin.com/in/dewald-breed-a2297a272</a>',
          },
          // website: {
          //   type: 'file',
          //   content:
          //     '<a target="_blank" href="https://dewaldbreed.co.za" target="_blank">https://dewaldbreed.co.za</a>',
          // },
        },
      },
      // resume: { type: 'file', content: 'coming soon' },
    },
  },
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
  setInputBuffer: Dispatch<SetStateAction<string[]>>,
  setIsPrompting: Dispatch<SetStateAction<Prompt | null>>
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
        return 'To Register, please provide your email (i.e., register -u youremail@mail.com) and when prompted, provide your password.';
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
    const primary = options['-primary'] as string | undefined;
    const secondary = options['-secondary'] as string | undefined;

    if (bgColor && textColor) {
      const newTheme: Theme = {
        bg: bgColor,
        primary: primary ? primary : textColor,
        secondary: secondary ? secondary : textColor,
        font: textColor,
      };
      setThemes((prev) => ({ ...prev, [name]: newTheme }));
      setActiveTheme(newTheme);
      return `New theme "${name}" has been successfully created.`;
    } else {
      return `
      Please provide a valid colors string (i.e. blue, black, azure ect.). Example: theme new "themeName" -bg="backgroundColorName" -text="textColorName"`;
    }
  } else {
    // select preset

    const activeTheme = getActiveTheme();
    const allThemes = getThemes();
    const themeArg = args[0]?.toLowerCase();

    if (options['-l'])
      return Object.keys(allThemes)
        .map((key) => key)
        .join(' ');

    if (!themeArg || themeArg.trim() === '')
      return `Please provide a valid theme name, or use the "new" keyword to create a new theme. Example: theme new -bg="backgroundColor" -text="fontColor"`;

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

// Normalize the path (handles '.', '..', and absolute/relative paths)
const normalizePath = (path: string, cwd: string): string => {
  const parts = path.startsWith('/')
    ? path.split('/') // Absolute path
    : (cwd + '/' + path).split('/'); // Relative path

  const stack: string[] = [];
  for (const part of parts) {
    if (part === '.' || part === '') continue; // Ignore current directory or empty parts
    if (part === '..') stack.pop(); // Go up one directory
    else stack.push(part); // Add to stack
  }

  return stack.length ? stack.join('/') : '/'; // Return normalized path
};

// Traverse the mock file system to find the resolved path
const traverseFileSystem = (
  path: string,
  fileSystem: Record<string, FileSystemNode>
): FileSystemNode | null => {
  const parts = path.split('/').filter((dir) => dir !== '~'); // Split into parts, ignoring root '/'
  let current: FileSystemNode | null = fileSystem['~']; // Start from root

  for (const part of parts) {
    if (current?.type === 'directory' && current.content[part]) {
      current = current.content[part];
    } else {
      return null; // Path doesn't exist
    }
  }

  return current;
};
// #endregion
