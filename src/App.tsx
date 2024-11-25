import { useState, useRef, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import './App.css';
import { getPresetThemes, Theme } from './utils/themes';
import { createCommands, HEADER, parseInput } from './utils/commands';
import { Session } from '@supabase/supabase-js';
import FontFaceObserver from 'fontfaceobserver';

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

const Header = styled.pre`
  font-family: 'UbuntuMono';
`;
const Main = styled.div`
  padding: 1ch;
`;
const Lines = styled.div``;
const Line = styled.div``;
const Prompt = styled.div`
  display: flex;
  align-items: center;
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
`;

function App() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [session, setSession] = useState<Session | null>(null);
  const [lineHead, setLineHead] = useState<string>('guest@terminalD:~$');
  const lineHeadLength = lineHead.length + 2;
  const [loading, setLoading] = useState<boolean>(false);
  const [themes, setThemes] = useState<Record<string, Theme>>(getPresetThemes());
  const [activeTheme, setActiveTheme] = useState<Theme>(themes['dark']);
  const [inputValue, setInputValue] = useState('');
  const [caretLeft, setCaretLeft] = useState(lineHeadLength);
  const [lineHistory, setLineHistory] = useState<Array<string>>([]);
  const [commandHistory, setCommandHistory] = useState<Array<string>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mainInput = useRef<HTMLInputElement | null>(null);
  const promptRef = useRef<HTMLDivElement | null>(null);

  const getActiveTheme = () => {
    return activeTheme;
  };

  const getThemes = () => {
    return themes;
  };

  const COMMANDS = createCommands(
    setActiveTheme,
    getActiveTheme,
    setThemes,
    getThemes,
    setLoading,
    setLineHistory,
    setSession
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
    if (event.key === 'Enter') {
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

  // evaluate input and return response
  const getResponse = async (inputValue: string) => {
    const newLine = `${lineHead} ${inputValue}`;
    const { command, args, options } = parseInput(inputValue);

    if (command && COMMANDS[command]) {
      const cmd = COMMANDS[command];
      setLineHistory([...lineHistory, newLine]);
      const response = await cmd.execute(args, options);

      if (response != '') {
        if (typeof response == 'string') {
          setLineHistory([...lineHistory, newLine, '<br>', response, '<br>']);
        } else {
          setLineHistory([...lineHistory, newLine, '<br>', ...response, '<br>']);
        }
      }
    } else {
      const emptyResponse = inputValue.trim() === '' ? '' : `Unsupported Command: ${inputValue}`;
      setLineHistory([...lineHistory, newLine, emptyResponse]);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (bottomRef.current && lineHistory.length > 0) {
      bottomRef.current.scrollIntoView();
    }
  }, [lineHistory]);

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

  useEffect(() => {
    if (session) {
      setLineHead(`${session.user.email?.split('@')[0]}@terminalD:~$`);
      setCaretLeft(`${session.user.email?.split('@')[0]}@terminalD:~$`.length + 3);
    } else {
      setLineHead('guest@terminalD:~$');
      setCaretLeft('guest@terminalD:~$'.length + 2);
    }
    console.log('session');
  }, [session]);

  // loading resources
  useEffect(() => {
    const font = new FontFaceObserver('UbuntuMono');
    font
      .load()
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true)); // Handle failure gracefully
  }, []);

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={activeTheme}>
      <Blanket onClick={setFocus}>
        <Main style={{ fontFamily: 'UbuntuMono' }}>
          <Lines>
            <Header>{HEADER}</Header>
            {lineHistory.map((line, index) => (
              <Line
                key={index}
                data-key={index}
              >
                {line === '<br>' ? <br /> : line}
              </Line>
            ))}
          </Lines>
          {loading && 'Loading...'}
          <Prompt ref={promptRef}>
            {lineHead}
            <CaretSpan $leftposition={caretLeft} />
            <Input
              ref={mainInput}
              autoFocus
              type='text'
              value={inputValue}
              onChange={(e) => handleInputChange(e)}
              onKeyDown={(e) => handleKeyPress(e)}
            ></Input>
            <div ref={bottomRef} />
          </Prompt>
        </Main>
      </Blanket>
    </ThemeProvider>
  );
}

export default App;
