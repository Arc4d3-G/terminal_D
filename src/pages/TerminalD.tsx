import { useState, useRef, useEffect } from 'react';
import styled, { createGlobalStyle, ThemeProvider } from 'styled-components';
import { getPresetThemes, Theme } from '../utils/themes';
import { createCommands, HEADER, simulateAsync } from '../utils/commands';
import FontFaceObserver from 'fontfaceobserver';
import { fetchUserData, User } from '../utils/auth';
import LineHead from '../components/LineHead';
import LineHistory, { Line } from '../components/LineHistory';

// #region Type Declarations
type ParsedInput = {
  command: string | undefined;
  args: string[];
  options: Record<string, string | boolean>;
};

export type Prompt = {
  for: string;
  content: string;
  step: string;
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

const LineDiv = styled.div``;

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
  const [nameSpace, setNameSpace] = useState<string>('localMachine');
  const [loading, setLoading] = useState<boolean>(false);
  const [themes, setThemes] = useState<Record<string, Theme>>(getPresetThemes());
  const [activeTheme, setActiveTheme] = useState<Theme>(themes['dark']);
  const [inputValue, setInputValue] = useState('');
  const [caretPosition, setCaretPosition] = useState(0);
  const [lineHistory, setLineHistory] = useState<Array<Line>>([]);
  const [commandHistory, setCommandHistory] = useState<Array<string>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isIntroTyping, setIsIntroTyping] = useState<boolean>(true);
  const [isCaretMoving, setIsCaretMoving] = useState(false);
  const [inputDisabled, setInputDisabled] = useState<boolean>(true);
  const [isPrompting, setIsPrompting] = useState<Prompt | null>(null);
  const [inputBuffer, setInputBuffer] = useState<Array<string>>([]);
  const mainInput = useRef<HTMLTextAreaElement | null>(null);
  const promptRef = useRef<HTMLDivElement | null>(null);
  const introText = './initTerminalD.sh';

  // #region State Getters & util
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

  const createLine = (inputValue: string, includesHeader: boolean = true): Line => {
    let lineHead = null;
    if (includesHeader) {
      lineHead = {
        username: session ? session.username : 'guest',
        nameSpace: nameSpace,
        cwd: cwd,
      };
    }
    return {
      header: lineHead,
      content: inputValue,
    };
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
    setIsPrompting,
    getIsPrompting,
    setInputBuffer,
    getInputBuffer,
    getSession,
    setCwd,
    getCwd
  );

  // #region Caret Logic
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

  // Handle input and return response
  const getResponse = async (inputValue: string) => {
    const newLine = createLine(inputValue);
    console.log(lineHistory);
    const newLineNoHeader = createLine(inputValue, false);
    const { command, args, options } = parseInput(inputValue);

    if (isPrompting) {
      executeCommand(isPrompting.for, [inputValue], {}, newLine);
      return;
    }

    // If no command is entered, echo the input
    if (!command) {
      setLineHistory((prevHistory) => [...prevHistory, newLine, newLineNoHeader]);
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

    function displayHelp(newLine: Line) {
      const response: Line[] = [];
      Object.entries(COMMANDS).forEach(([key, value]) => {
        if (!value.isListed) return;
        response.push(createLine(`${key.toUpperCase()} - ${value.description}`, false));
      });

      setLineHistory((prevHistory) => [...prevHistory, newLine, ...response]);
    }

    async function executeCommand(
      command: string,
      args: string[],
      options: Record<string, string | boolean>,
      newLine: Line
    ) {
      const cmd = COMMANDS[command];
      setLineHistory((prevHistory) => [...prevHistory, newLine]);

      const response = await cmd.execute(args, options);

      setLineHistory((prevHistory) => [...prevHistory, createLine(response, false)]);
    }

    function handleUnsupportedCommand(newLine: Line, inputValue: string) {
      const response = createLine(
        inputValue.trim() === ''
          ? '' // Empty input
          : `Unsupported Command: ${inputValue}`,
        false
      );
      setLineHistory((prevHistory) => [...prevHistory, newLine, response]);
    }
  };
  // #endregion

  // #region UseEffects

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
        { content: introText, header: { username: 'guest', nameSpace: 'LocalMachine', cwd: '~' } },
        { content: '[INFO] Initializing Terminal-D...', header: null },
        { content: '[INFO] Loading environment variables...', header: null },
        { content: '[INFO] Setting up system paths...', header: null },
        { content: '[INFO] Terminal-D initialized successfully.', header: null },
      ];

      for (const message of messages) {
        setLineHistory((prevHistory) => [...prevHistory, message]);
        await simulateAsync(500); // Simulate delay between messages
      }

      setLineHistory((prevHistory) => [
        ...prevHistory,
        { header: null, content: HEADER },
        {
          header: null,
          content: `Welcome to Terminal-D!<br>Type \`help\` to get started or \`about\` to learn more about Terminal-D.<br><br>`,
        },
      ]);
      finalizeIntro();
    };

    const handleReturningUser = () => {
      setLineHistory([
        { header: null, content: HEADER },
        {
          header: null,
          content: `Welcome back to Terminal-D!<br>Type \`help\` to get started or \`about\` to learn more about Terminal-D.<br><br>`,
        },
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
      setNameSpace('terminalD');
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
  }, [inputValue, isIntroTyping, session, isReady, introText]);

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
          <LineHistory
            lineHistory={lineHistory}
            activeTheme={activeTheme}
          />
          {loading && !isIntroTyping && <LineDiv>Loading...</LineDiv>}
          <Prompt ref={promptRef}>
            <PromptPre>
              <LineHead
                username={session?.username}
                cwd={cwd}
                activeTheme={activeTheme}
                nameSpace={nameSpace}
                isPrompting={isPrompting}
              />
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
