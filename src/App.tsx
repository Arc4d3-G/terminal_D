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
  padding: 10px 15px;
  width: 100%;
  height: 100%;
`;
const Lines = styled.div``;

const Line = styled.div``;

const Input = styled.input`
  background-color: transparent;
  border: none;
  outline: none;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.font};
  font-size: inherit;
  font-family: inherit;
  padding: 0px;
`;

function App() {
  const [theme, setTheme] = useState<Theme>(dark);
  // const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [lineHistory, setLineHistory] = useState<Array<string>>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mainInput = useRef<HTMLInputElement | null>(null);
  const inputDiv = useRef<HTMLDivElement | null>(null);

  const getTheme = () => {
    return theme;
  };

  // set isLoading to true/false
  // const handleLoading = () => {
  //   setIsLoading(true);
  //   setTimeout(() => {
  //     setIsLoading(false);
  //   }, 3000);
  // };

  const COMMANDS = createCommands(setTheme, getTheme /*handleLoading*/, setLineHistory);

  // set input value on change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  // handle "ENTER", adding input value to lineHistory
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setLineHistory([...lineHistory, inputValue]);
      getResponse(inputValue);
      setInputValue('');
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
    if (COMMANDS[inputValue]) {
      const response = COMMANDS[inputValue].execute();
      if (response != '') {
        setLineHistory([...lineHistory, inputValue, response]);
      }
    } else {
      setLineHistory([
        ...lineHistory,
        inputValue,
        `The term '${inputValue}' is not recognized as the name of a cmdlet`,
      ]);
    }
  };

  // while isLoading, prevent input
  // useEffect(() => {
  //   if (isLoading) {
  //     if (inputDiv.current) {
  //       inputDiv.current.style.display = 'none';
  //     }
  //   } else {
  //     if (inputDiv.current) {
  //       inputDiv.current.style.display = 'block';
  //       setFocus();
  //     }
  //   }
  // }, [isLoading]);

  // Auto scroll to bottom
  useEffect(() => {
    if (bottomRef.current && lineHistory.length > 0) {
      bottomRef.current.scrollIntoView();
    }

    console.log('useEffect');
  }, [lineHistory]);

  const lineHead = '$ ';
  return (
    <ThemeProvider theme={theme}>
      <Blanket onClick={setFocus}>
        <Main>
          <Lines>
            <pre style={{ marginBottom: '1rem' }}>{HEADER}</pre>
            {lineHistory.map((line, index) => (
              <Line
                key={index}
                data-key={index}
              >
                {lineHead}
                {line}
              </Line>
            ))}
          </Lines>
          <div ref={inputDiv}>
            <span>{lineHead}</span>
            <Input
              ref={mainInput}
              autoFocus
              type='text'
              value={inputValue}
              onChange={(e) => handleInputChange(e)}
              onKeyDown={(e) => handleKeyPress(e)}
            />
            <div ref={bottomRef} />
          </div>
        </Main>
      </Blanket>
    </ThemeProvider>
  );
}

export default App;
