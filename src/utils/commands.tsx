import { Dispatch, SetStateAction } from 'react';
import { Theme } from './themes.tsx';
import supabase from './supabase.ts';
import { Session } from '@supabase/supabase-js';

// #region Type Declarations
type Command = {
  description: string[];
  argsAllowed: boolean;
  optionsAllowed: boolean;
  isListed: boolean;
  execute: (
    args: string[],
    options: Record<string, string | boolean>
  ) => string | string[] | Promise<string | string[]>;
};

// interface ApiResponse {
//   data: string | null;
//   error: string | null;
// }

// #endregion

export const HEADER = `
████████ ███████ ██████  ███    ███ ██ ███    ██  █████  ██           ██████
   ██    ██      ██   ██ ████  ████ ██ ████   ██ ██   ██ ██           ██   ██
   ██    █████   ██████  ██ ████ ██ ██ ██ ██  ██ ███████ ██    █████  ██   ██
   ██    ██      ██   ██ ██  ██  ██ ██ ██  ██ ██ ██   ██ ██           ██   ██
   ██    ███████ ██   ██ ██      ██ ██ ██   ████ ██   ██ ███████      ██████
                                    A Terminal Themed Portfolio By Dewald Breed
  `;

// Houses objects for each valid command
export const createCommands = (
  setActiveTheme: Dispatch<SetStateAction<Theme>>,
  getActiveTheme: () => Theme,
  setThemes: Dispatch<SetStateAction<Record<string, Theme>>>,
  getThemes: () => Record<string, Theme>,
  setLoading: Dispatch<SetStateAction<boolean>>,
  setLineHistory: Dispatch<SetStateAction<string[]>>,
  setSession: Dispatch<SetStateAction<Session | null>>,
  setLineHead: Dispatch<React.SetStateAction<string>>,
  setCaretLeft: Dispatch<React.SetStateAction<number>>
): Record<string, Command> => {
  return {
    ['about']: {
      description: [''],
      argsAllowed: false,
      optionsAllowed: false,
      isListed: false,
      execute: () => {
        return `
          Terminal-D started as a simple idea: As a junior developer I wanted a portfolio to show off my work, but I also wanted it to be fun, interactive, and way more than just a “here’s my GitHub” link. 
          I’ve got a lot of various interests and ideas, so I needed something flexible—a sandbox to bring everything together. 
          That’s when I thought, “Why not a terminal?” It’s versatile and perfect for showcasing all kinds of functionality. 
          Plus, it’s been a great way for me to practice and experiment with different programming technologies and concepts. 
          With Terminal-D, I can turn my projects into commands and let people explore them while I keep learning and building.
        `;
      },
    },
    ['theme']: {
      description: ['Change the theme to a preset scheme, or create your own.'],
      argsAllowed: true,
      optionsAllowed: false,
      isListed: true,
      execute: (args, options) =>
        handleTheme(args, options, setThemes, setActiveTheme, getActiveTheme, getThemes),
    },
    ['clear']: {
      description: [
        'Clear the terminal screen, removing all previous commands and output displayed.',
      ],
      argsAllowed: false,
      optionsAllowed: false,
      isListed: true,
      execute: () => {
        setLineHistory([
          HEADER,
          'Welcome to Terminal-D!',
          'Type `help` to get started or `about` to learn more about Terminal-D. ',
          '<br>',
        ]);
        return '';
      },
    },
    ['date']: {
      description: ['Returns the current date/time. Args: date "dateString" to specify a date.'],
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
      description: [
        'Login with your username and password, or use the "new" keyword to register a new account.',
        'Example: `login new "yourEmailAddress" "yourPassWord"` to register.',
      ],
      argsAllowed: true,
      optionsAllowed: false,
      isListed: true,
      execute: async (args) => handleAuth(args, setLoading, setSession, setCaretLeft, setLineHead),
    },
    // ['dog']: {
    //   description: [''],
    //   argsAllowed: false,
    //   optionsAllowed: false,
    //   isListed: true,
    //   execute: async () => {
    //     setLoading(true);

    //     const { data, error } = await getRequest('https://random.dog/woof.json');
    //     if (error) {
    //       setLoading(false);
    //       return error.message;
    //     }
    //     const { fileSizeBytes, url } = data;
    //     console.log(data);
    //     const ascii = await imageUrlToAscii(url, 150);
    //     setLoading(false);
    //     return ascii;
    //   },
    // },
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
  args: string[],
  setLoading: Dispatch<SetStateAction<boolean>>,
  setSession: Dispatch<SetStateAction<Session | null>>,
  setCaretLeft: Dispatch<React.SetStateAction<number>>,
  setLineHead: Dispatch<React.SetStateAction<string>>
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
        const mailName = email.split('@')[0];
        setLineHead(`${mailName}@terminalD:~$`);
        setCaretLeft(`${mailName}@terminalD:~$`.length + 2);

        return data.user
          ? `Login successful! Welcome back, ${mailName}.`
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

    if (options['-l']) return Object.keys(allThemes).map((key) => key);

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

// const getRequest = async (url: string): Promise<ApiResponse> => {
//   try {
//     const response = await fetch(url);

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     return { data, error: null };
//   } catch (error: any) {
//     return { data: null, error: error.message || 'Something went wrong' };
//   }
// };

// async function imageUrlToAscii(imageUrl: string, canvasWidth: number): Promise<string[]> {
//   const asciiChars = '@%#*+=-:. '; // Characters for intensity mapping, from darkest to lightest.

//   return new Promise((resolve, reject) => {
//     const img = new Image();
//     img.crossOrigin = 'Anonymous'; // Enable CORS to fetch images from other domains.
//     img.src = imageUrl;

//     img.onload = () => {
//       // Calculate canvas height maintaining aspect ratio.
//       const aspectRatio = img.height / img.width;
//       const canvasHeight = Math.round(canvasWidth * aspectRatio);

//       // Create a canvas to process the image.
//       const canvas = document.createElement('canvas');
//       canvas.width = canvasWidth;
//       canvas.height = canvasHeight;

//       const ctx = canvas.getContext('2d');
//       if (!ctx) {
//         reject(new Error('Failed to get 2D context.'));
//         return;
//       }

//       // Draw the image on the canvas.
//       ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

//       // Get image data.
//       const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
//       const { data, width, height } = imageData;

//       const asciiArt: string[] = [];

//       // Convert pixels to ASCII characters.
//       for (let y = 0; y < height; y++) {
//         let line = '';
//         for (let x = 0; x < width; x++) {
//           const offset = (y * width + x) * 4;
//           const r = data[offset];
//           const g = data[offset + 1];
//           const b = data[offset + 2];

//           // Calculate grayscale value.
//           const grayscale = Math.round((r + g + b) / 3);

//           // Map grayscale to ASCII character.
//           const charIndex = Math.floor((grayscale / 255) * (asciiChars.length - 1));
//           line += asciiChars[charIndex];
//         }
//         line += '<ascii>';
//         asciiArt.push(line); // Add the line to the array.
//       }

//       resolve(asciiArt);
//     };

//     img.onerror = (err) => reject(err);
//   });
// }

// #endregion
