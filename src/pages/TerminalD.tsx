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
    display: flex;
    flex-direction: column;
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

const Main = styled.div`
  cursor: default;
  padding: 1ch;
`;

const Lines = styled.div`
  word-wrap: break-word;
  word-break: break-word;
`;

const Line = styled.div``;

const Prompt = styled.div``;

const Caret = styled.span<{ $isCaretMoving: boolean }>`
  position: absolute;
  width: 1ch;
  height: 1.1em;
  background-color: ${({ theme }) => theme.font};
  animation: ${({ $isCaretMoving }) =>
    $isCaretMoving ? 'none' : 'blink 1s steps(2, start) infinite'};
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

const PromptPre = styled.pre`
  position: relative;
  font-family: inherit;
  color: inherit;
  font-size: inherit;
  padding: 0px;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
`;

const HiddenTextAreaInput = styled.textarea`
  position: absolute;
  left: -9999px;
  opacity: 0;
  pointer-events: none;
`;

// #endregion
const App: React.FC = () => {
  const [cwd, setCwd] = useState('~');
  const [isReady, setIsReady] = useState<boolean>(false);
  const [session, setSession] = useState<User | null>(null);
  const [lineHead, setLineHead] = useState<string>('guest@localMachine:~$');
  const [loading, setLoading] = useState<boolean>(false);
  const [themes, setThemes] = useState<Record<string, Theme>>(getPresetThemes());
  const [activeTheme, setActiveTheme] = useState<Theme>(themes['dark']);
  const [inputValue, setInputValue] = useState('');
  const [caretPosition, setCaretPosition] = useState(0);
  const [lineHistory, setLineHistory] = useState<Array<string>>([]);
  const [commandHistory, setCommandHistory] = useState<Array<string>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isIntroTyping, setIsIntroTyping] = useState<boolean>(true);
  const [isCaretMoving, setIsCaretMoving] = useState(false);
  const [inputDisabled, setInputDisabled] = useState<boolean>(true);
  const [isPrompting, setIsPrompting] = useState<string | null>(null);
  const [inputBuffer, setInputBuffer] = useState<Array<string>>([]);
  const mainInput = useRef<HTMLTextAreaElement | null>(null);
  const promptRef = useRef<HTMLDivElement | null>(null);
  const introText = './initTerminalD.sh';
  const defaultLineHead = `guest@terminalD:${cwd}$`;

  // #region State Getters
  const getActiveTheme = () => {
    return activeTheme;
  };

  const getThemes = () => {
    return themes;
  };

  const getIsPrompting = () => {
    return isPrompting;
  };

  const getInputBuffer = () => {
    return inputBuffer;
  };

  const getSession = () => {
    return session;
  };

  const getCwd = () => {
    return cwd;
  };
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
    setIsPrompting,
    getIsPrompting,
    setInputBuffer,
    getInputBuffer,
    getSession,
    setCwd,
    getCwd,
    defaultLineHead
  );

  // #region Caret Logic functions
  const updateCaretPosition = () => {
    const position = mainInput.current?.selectionStart || 0;
    setCaretPosition(position);
  };

  const renderInputWithCaret = () => {
    const beforeCaret = inputValue.slice(0, caretPosition);
    const afterCaret = inputValue.slice(caretPosition);

    return (
      <>
        {beforeCaret}
        <Caret $isCaretMoving={isCaretMoving} />
        {afterCaret}
      </>
    );
  };
  // #endregion

  // #region Input & Event handlers

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    updateCaretPosition();
  };

  const handleKeyUp = () => {
    setIsCaretMoving(false);
    updateCaretPosition();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (inputDisabled) return;
    if (!isCaretMoving) setIsCaretMoving(true);
    requestAnimationFrame(updateCaretPosition);

    if (event.key === 'Enter') {
      event.preventDefault();
      if (isIntroTyping) {
        setIsIntroTyping(false);
      }
      if (inputValue.trim() != '' && !isPrompting) {
        if (!commandHistory.includes(inputValue)) {
          setCommandHistory([inputValue, ...commandHistory]);
        } else {
          const tempHistory = commandHistory.filter((line) => line !== inputValue);
          setCommandHistory([inputValue, ...tempHistory]);
        }
      }
      getResponse(inputValue);
      setInputValue('');
      setHistoryIndex(-1);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (mainInput.current && commandHistory.length > 0) {
        if (historyIndex < commandHistory.length - 1) {
          const newCommand = commandHistory[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);
          setInputValue(newCommand);
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
        } else {
          setHistoryIndex(-1);
          setInputValue('');
        }
      }
    }
  };

  const setFocus = () => {
    if (mainInput.current) {
      mainInput.current.focus();
    }
  };

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

  const getResponse = async (inputValue: string) => {
    const newLine = `${lineHead} ${inputValue}`;
    const { command, args, options } = parseInput(inputValue);

    if (isPrompting) {
      executeCommand(isPrompting, [inputValue], {}, newLine);
      return;
    }

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

    function displayHelp(newLine: string) {
      const response: string[] = [];
      Object.entries(COMMANDS).forEach(([key, value]) => {
        if (!value.isListed) return;
        response.push(key.toUpperCase(), value.description, '<br>');
      });

      setLineHistory((prevHistory) => [...prevHistory, newLine, '<br>', ...response, '<br>']);
    }

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

    function handleUnsupportedCommand(newLine: string, inputValue: string) {
      const response =
        inputValue.trim() === ''
          ? '' // Empty input
          : `Unsupported Command: ${inputValue}`;
      setLineHistory((prevHistory) => [...prevHistory, newLine, response]);
    }
  };
  // #endregion

  // #region UseEffects

  // Set line header according to session
  useEffect(() => {
    if (session) {
      setLineHead(`${session.email.split('@')[0]}@terminalD:${cwd}$`);
    } else if (!session && !isIntroTyping) {
      setLineHead(defaultLineHead);
    }
  }, [session, isIntroTyping, defaultLineHead, cwd]);

  // Auto scroll to bottom
  useEffect(() => {
    if (promptRef.current && lineHistory.length > 0) {
      promptRef.current.scrollIntoView();
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
    if (!isIntroTyping || !isReady) return;

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
      finalizeIntro();
    };

    const handleReturningUser = () => {
      setLineHistory([
        HEADER,
        `Welcome back to Terminal-D!<br>Type \`help\` to get started or \`about\` to learn more about Terminal-D.<br><br>`,
      ]);
      finalizeIntro();
    };

    const handleTypingAnimation = () => {
      setIsCaretMoving(true);
      const timeout = setTimeout(() => {
        updateCaretPosition();
        setInputValue((prev) => introText.slice(0, prev.length + 1));
      }, 100);

      return () => clearTimeout(timeout);
    };

    const finalizeIntro = () => {
      setIsIntroTyping(false);
      setIsCaretMoving(false);
      setInputDisabled(false);
      setInputValue('');
      setLoading(false);
    };

    // Intro logic
    if (isIntroTyping && inputValue === introText && !session) {
      setLoading(true);
      displayIntroMessages();
    } else if (session) {
      handleReturningUser();
    } else {
      return handleTypingAnimation();
    }
  }, [inputValue, isIntroTyping, lineHead, session, isReady, introText, defaultLineHead]);

  // Load resources, hiding the main app until it's ready
  useEffect(() => {
    const getUserData = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        // get user data using token via api
        const { data } = await fetchUserData(token);

        if (data) {
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
          {loading && !isIntroTyping && <Line>Loading...</Line>}
          <Prompt ref={promptRef}>
            <PromptPre>
              <span>{lineHead} </span>
              {renderInputWithCaret()}
            </PromptPre>
            <HiddenTextAreaInput
              ref={mainInput}
              value={inputValue}
              onChange={(e) => handleInputChange(e)}
              onKeyDown={(e) => handleKeyDown(e)}
              onKeyUp={() => handleKeyUp()}
              readOnly={inputDisabled}
              autoFocus
              rows={1}
            />
          </Prompt>
        </Main>
      </Blanket>
    </ThemeProvider>
  );
};

export default App;
