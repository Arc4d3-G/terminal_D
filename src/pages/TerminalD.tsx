import { useState, useRef, useEffect } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { getPresetThemes, Theme } from '../utils/themes';
import { createCommands, HEADER, simulateAsync } from '../utils/commands';
import FontFaceObserver from 'fontfaceobserver';
import { fetchUserData, User } from '../utils/auth';

// #region Type Declarations
type ParsedInput = {
  command: string | undefined;
  args: string[];
  options: Record<string, string | boolean>;
};
// #endregion

// #region Styled-Components
const GlobalStyle = createGlobalStyle`
  html, body {
    line-height: 1.2;
    font-size: clamp(0.8em, 1vw, 1em);
    font-weight: 400;
    margin: 0px;
    padding: 0px;
  }
  
  #root {
    height: 100%;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  pre {
  margin: 0px 0px 0px 0px;
  }
`;

const Blanket = styled.div`
  min-height: 100vh;
  height: 100%;
  width: 100%;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.font};
  ::selection {
    background-color: ${({ theme }) => theme.primary};
    color: ${({ theme }) => theme.bg};
  }
`;

const LoadingScreen = styled.div`
  min-height: 100vh;
  height: 100%;
  width: 100%;
  background: ${({ theme }) => theme.bg};
`;

// const Header = styled.pre`
//   font-family: 'UbuntuMono';
//   font-size: clamp(0.8em, 1vw, 1em);
// `;

const Main = styled.div`
  cursor: default;
  padding: 1ch;
`;

const Lines = styled.div``;

const Line = styled.div``;

const Prompt = styled.div`
  display: flex;
  align-items: baseline;
`;

const CaretSpan = styled.span<{ $leftposition: number }>`
  position: absolute;
  left: ${({ $leftposition }) => `${$leftposition}ch`};
  width: 1ch;
  height: 1em;
  background-color: ${({ theme }) => theme.font};
  animation: blink 1s steps(2, start) infinite;
  pointer-events: none;
  cursor: none;

  @keyframes blink {
    0%,
    50% {
      opacity: 0.75;
    }
    50.1%,
    100% {
      opacity: 0;
    }
  }
`;

const Input = styled.input`
  width: -webkit-fill-available;
  height: -webkit-fill-available;
  margin-left: 1ch;
  background-color: transparent;
  border: none;
  outline: none;
  color: inherit;
  font-size: inherit;
  font-family: inherit;
  padding: 0px;
  caret-color: transparent;
  cursor: default;
`;
// #endregion
function App() {
  const introText = './initTerminalD.sh';
  const introLineHead = 'guest@localMachine:~$';
  const defaultLineHead = 'guest@terminalD:~$';
  const [isReady, setIsReady] = useState<boolean>(false);
  const [session, setSession] = useState<User | null>(null);
  const [lineHead, setLineHead] = useState<string>(introLineHead);
  const lineHeadLength = lineHead.length + 2;
  const [loading, setLoading] = useState<boolean>(false);
  const [themes, setThemes] = useState<Record<string, Theme>>(getPresetThemes());
  const [activeTheme, setActiveTheme] = useState<Theme>(themes['dark']);
  const [inputValue, setInputValue] = useState('');
  const [caretLeft, setCaretLeft] = useState(lineHeadLength);
  const [lineHistory, setLineHistory] = useState<Array<string>>([]);
  const [commandHistory, setCommandHistory] = useState<Array<string>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(true);
  const [inputDisabled, setInputDisabled] = useState<boolean>(true);
  const mainInput = useRef<HTMLInputElement | null>(null);
  const promptRef = useRef<HTMLDivElement | null>(null);

  // #region State Getters
  const getActiveTheme = () => {
    return activeTheme;
  };

  const getThemes = () => {
    return themes;
  };

  // const getSession = () => {
  //   return session;
  // };

  // #endregion

  // Create instance of COMMANDS and pass necessary state functions
  const COMMANDS = createCommands(
    setActiveTheme,
    getActiveTheme,
    setThemes,
    getThemes,
    setLoading,
    setLineHistory,
    setSession,
    setLineHead,
    setCaretLeft
  );

  // set input value on change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const curInputLen = event.target.value.length;
    const previousInputLen = inputValue.length;

    if (curInputLen > previousInputLen) {
      setCaretLeft(caretLeft + 1);
    }

    setInputValue(event.target.value);
  };

  // handle key presses
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (inputDisabled) return;

    if (event.key === 'Enter') {
      if (isTyping) {
        setIsTyping(false);
      }
      if (inputValue.trim() != '') {
        if (!commandHistory.includes(inputValue)) {
          setCommandHistory([inputValue, ...commandHistory]);
        } else {
          const tempHistory = commandHistory.filter((line) => line !== inputValue);
          setCommandHistory([inputValue, ...tempHistory]);
        }
      }
      getResponse(inputValue);
      setInputValue('');
      setCaretLeft(lineHeadLength);
      setHistoryIndex(-1);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (mainInput.current && commandHistory.length > 0) {
        if (historyIndex < commandHistory.length - 1) {
          const newCommand = commandHistory[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);
          setInputValue(newCommand);
          setCaretLeft(newCommand.length + lineHeadLength);
          if (mainInput.current) {
            mainInput.current.setSelectionRange(-1, -1);
          }
        }
      }
    }

    if (event.key === 'ArrowDown') {
      if (mainInput.current && commandHistory.length > 0) {
        if (historyIndex > 0) {
          const newCommand = commandHistory[historyIndex - 1];
          setHistoryIndex(historyIndex - 1);
          setInputValue(newCommand);
          setCaretLeft(newCommand.length + lineHeadLength);
        } else {
          setHistoryIndex(-1); // Reset index when reaching the end
          setInputValue(''); // Clear input when reaching beyond the start CHANGE THIS TO use original input value instead
          setCaretLeft(lineHeadLength);
        }
      }
    }

    if (event.key === 'Backspace') {
      if (caretLeft > lineHeadLength) {
        setCaretLeft(caretLeft - 1);
      }
    }

    if (event.key === 'ArrowLeft') {
      if (caretLeft > lineHeadLength) {
        setCaretLeft(caretLeft - 1);
      }
    }

    if (event.key === 'ArrowRight') {
      if (caretLeft < inputValue.length + lineHeadLength) {
        setCaretLeft(caretLeft + 1);
      }
    }
  };

  // set focus to main input
  const setFocus = () => {
    if (mainInput.current) {
      mainInput.current.focus();
    }
  };

  // Parse Input for getResponse
  const parseInput = (input: string): ParsedInput => {
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

  // Handle input and return response strings
  const getResponse = async (inputValue: string) => {
    const newLine = `${lineHead} ${inputValue}`;
    const { command, args, options } = parseInput(inputValue);

    // If no command is entered, echo the input
    if (!command) {
      setLineHistory((prevHistory) => [...prevHistory, newLine, inputValue]);
      return;
    }

    const commandToLower = command.toLowerCase();

    if (commandToLower === 'help') {
      displayHelp(newLine);
    } else if (COMMANDS[commandToLower]) {
      await executeCommand(commandToLower, args, options, newLine);
    } else {
      handleUnsupportedCommand(newLine, inputValue);
    }

    // Display the help response
    function displayHelp(newLine: string) {
      const response: string[] = [];
      Object.entries(COMMANDS).forEach(([key, value]) => {
        if (!value.isListed) return;
        response.push(key.toUpperCase(), value.description, '<br>');
      });

      setLineHistory((prevHistory) => [...prevHistory, newLine, '<br>', ...response, '<br>']);
    }

    // Execute a valid command
    async function executeCommand(
      command: string,
      args: string[],
      options: Record<string, string | boolean>,
      newLine: string
    ) {
      const cmd = COMMANDS[command];
      setLineHistory((prevHistory) => [...prevHistory, newLine]);

      const response = await cmd.execute(args, options);

      if (response) {
        setLineHistory((prevHistory) =>
          typeof response === 'string'
            ? [...prevHistory, '<br>', response, '<br>']
            : [...prevHistory, '<br>', ...response, '<br>']
        );
      }
    }

    // Handle unsupported or empty commands
    function handleUnsupportedCommand(newLine: string, inputValue: string) {
      const response =
        inputValue.trim() === ''
          ? '' // Empty input
          : `Unsupported Command: ${inputValue}`;
      setLineHistory((prevHistory) => [...prevHistory, newLine, response]);
    }
  };

  // #region UseEffects

  // Auto scroll to bottom
  useEffect(() => {
    if (mainInput.current && lineHistory.length > 0) {
      mainInput.current.scrollIntoView();
    }
  }, [lineHistory]);

  // Hide input field during loading
  useEffect(() => {
    if (promptRef.current) {
      if (loading) {
        promptRef.current.style.display = 'none';
      } else {
        promptRef.current.style.display = 'flex';
        setFocus();
      }
    }
  }, [loading]);

  // Intro animation
  useEffect(() => {
    if (!isTyping || !isReady) return;

    const displayIntroMessages = async () => {
      const messages = [
        `${lineHead} ${introText}`,
        '[INFO] Initializing Terminal-D...',
        '[INFO] Loading environment variables...',
        '[INFO] Setting up system paths...',
        '[INFO] Terminal-D initialized successfully.',
      ];

      for (const message of messages) {
        setLineHistory((prevHistory) => [...prevHistory, message]);
        await simulateAsync(500); // Simulate delay between messages
      }

      setLineHistory((prevHistory) => [
        ...prevHistory,
        HEADER,
        `Welcome to Terminal-D!<br>Type \`help\` to get started or \`about\` to learn more about Terminal-D.<br><br>`,
      ]);
      setLineHead(defaultLineHead);
      setCaretLeft(defaultLineHead.length + 2);
      finalizeIntro();
    };

    const handleReturningUser = (session: User) => {
      const username = session.email.split('@')[0];
      setLineHistory([
        HEADER,
        `Welcome back to Terminal-D!<br>Type \`help\` to get started or \`about\` to learn more about Terminal-D.<br><br>`,
      ]);
      setLineHead(`${username}@terminalD:~$`);
      setCaretLeft(`${username}@terminalD:~$`.length + 2);
      finalizeIntro();
    };

    const handleTypingAnimation = () => {
      const timeout = setTimeout(() => {
        setInputValue((prev) => introText.slice(0, prev.length + 1));
        setCaretLeft((prev) => prev + 1);
      }, 100);

      return () => clearTimeout(timeout);
    };

    const finalizeIntro = () => {
      setIsTyping(false);
      setInputDisabled(false);
      setInputValue('');
      setLoading(false);
    };

    // Intro logic
    if (isTyping && inputValue === introText && !session) {
      setLoading(true);

      displayIntroMessages();
    } else if (session) {
      handleReturningUser(session);
    } else {
      return handleTypingAnimation();
    }
  }, [inputValue, isTyping, caretLeft, lineHead, session, isReady, introText, defaultLineHead]);

  // Load resources, hiding the main app until it's ready
  useEffect(() => {
    const getUserData = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        // get user data using token via api
        const { data } = await fetchUserData(token);

        if (data) {
          console.log('Session Found');
          console.log(data);
          setSession(data);
        }
      }
    };

    const loadResources = async () => {
      const font = new FontFaceObserver('UbuntuMono');
      await font.load();
      await getUserData();
      setIsReady(true);
    };

    loadResources();
  }, []);
  // #endregion

  // Loading Screen
  if (!isReady) {
    return (
      <ThemeProvider theme={activeTheme}>
        <GlobalStyle />
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={activeTheme}>
      <GlobalStyle />
      <Blanket onClick={setFocus}>
        <Main style={{ fontFamily: 'UbuntuMono' }}>
          <Lines>
            {lineHistory.map((line, index) => (
              <Line
                key={index}
                data-key={index}
                dangerouslySetInnerHTML={{ __html: line }}
              />
            ))}
          </Lines>
          <Prompt ref={promptRef}>
            {lineHead}
            <CaretSpan $leftposition={caretLeft} />
            <Input
              spellCheck={false}
              ref={mainInput}
              autoFocus
              type='text'
              value={inputValue}
              onChange={(e) => handleInputChange(e)}
              onKeyDown={(e) => handleKeyPress(e)}
              readOnly={inputDisabled}
            ></Input>
          </Prompt>
        </Main>
      </Blanket>
    </ThemeProvider>
  );
}

export default App;
