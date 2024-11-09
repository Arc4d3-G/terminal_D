import { useState, useRef, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import './App.css';
import { dark, Theme } from './utils/themes';
import { createCommands, HEADER } from './utils/commands';

const Blanket = styled.div`
  height: 100%;
  width: 100%;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.font};
`;
const Main = styled.div`
  margin-left: 10px;
  /* padding: 1rem; */
`;
const Lines = styled.div``;
const Line = styled.div``;
const Prompt = styled.div``;
const PromptSpan = styled.span``;
const CaretSpan = styled.span`
  position: relative;
  width: 0.6rem;
  background-color: white;
  animation: blink 1s steps(2, start) infinite;
  pointer-events: none;
  cursor: none;

  @keyframes blink {
    0%,
    50% {
      opacity: 1;
    }
    50.1%,
    100% {
      opacity: 0;
    }
  }
`;

const HiddenInput = styled.input`
  width: 0px;
  height: 0px;
  border: none;
  outline: none;
  color: transparent;
  background-color: transparent;
  padding: 0px;
  margin: 0px;
`;
// const Input = styled.input`
//   background-color: transparent;
//   border: none;
//   outline: none;
//   color: transparent;
//   font-size: inherit;
//   font-family: inherit;
//   padding: 0px;
//   caret-color: transparent; /* Hide the default caret */
// `;

function App() {
  const [theme, setTheme] = useState<Theme>(dark);
  const [inputValue, setInputValue] = useState('');
  const [lineHistory, setLineHistory] = useState<Array<string>>([]);
  const [commandHistory, setCommandHistory] = useState<Array<string>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mainInput = useRef<HTMLInputElement | null>(null);
  const lineHead = 'guest@terminalD:~$ ';

  const getTheme = () => {
    return theme;
  };

  const COMMANDS = createCommands(setTheme, getTheme /*handleLoading*/, setLineHistory);

  // set input value on change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  // handle key presses
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (!commandHistory.includes(inputValue) && inputValue.trim() != '') {
        setCommandHistory([inputValue, ...commandHistory]);
      }
      getResponse(inputValue);
      setInputValue('');
    }

    if (event.key === 'ArrowUp') {
      console.log(historyIndex);
      if (mainInput.current && commandHistory.length > 0) {
        if (historyIndex < commandHistory.length - 1) {
          setHistoryIndex(historyIndex + 1);
          setInputValue(commandHistory[historyIndex + 1]);
        } else {
          setInputValue(commandHistory[historyIndex]);
        }
      }
    }

    if (event.key === 'ArrowDown') {
      console.log(historyIndex);
      if (mainInput.current && commandHistory.length > 0) {
        if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
          setInputValue(commandHistory[historyIndex - 1]);
        } else {
          setHistoryIndex(-1); // Reset index when reaching the end
          setInputValue(''); // Clear input when reaching beyond the start CHANGE THIS TO use original input value instead
        }
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
  const getResponse = (inputValue: string) => {
    const newLine = lineHead + inputValue;

    // Regex to split by spaces, respecting quoted substrings
    const inputArr = (inputValue.match(/(?:[^\s"]+|"[^"]*")+/g) || []).map((arg) =>
      arg.replace(/(^"|"$)/g, '')
    );

    // Remove quotes around quoted substrings
    inputArr.map((arg) => arg.replace(/(^"|"$)/g, ''));

    const [command, ...args] = inputArr;

    if (command && COMMANDS[command]) {
      const response = COMMANDS[command].execute(args);
      if (response != '') {
        setLineHistory([...lineHistory, newLine, response]);
      }
    } else {
      const emptyResponse =
        inputValue.trim() === '' ? inputValue : `Unsupported Command: ${inputValue}`;
      setLineHistory([...lineHistory, newLine, emptyResponse]);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (bottomRef.current && lineHistory.length > 0) {
      bottomRef.current.scrollIntoView();
    }
  }, [lineHistory]);

  return (
    <ThemeProvider theme={theme}>
      <Blanket onClick={setFocus}>
        <Main>
          <Lines>
            <pre>{HEADER}</pre>
            {lineHistory.map((line, index) => (
              <Line
                key={index}
                data-key={index}
              >
                {line}
              </Line>
            ))}
          </Lines>
          <Prompt>
            <HiddenInput
              ref={mainInput}
              autoFocus
              type='text'
              value={inputValue}
              onChange={(e) => handleInputChange(e)}
              onKeyDown={(e) => handleKeyPress(e)}
            />
            {lineHead}
            <PromptSpan>
              {inputValue}
              <CaretSpan>|</CaretSpan>
            </PromptSpan>
            <div ref={bottomRef} />
          </Prompt>
        </Main>
      </Blanket>
    </ThemeProvider>
  );
}

export default App;
