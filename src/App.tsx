import { useState, useRef, useEffect } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import './App.css';
import { dark, retro, Theme } from './utils/themes';

const Blanket = styled.div`
  height: 100%;
  width: 100%;
  background: ${({ theme }) => theme.bg};
  color: ${({ theme }) => theme.font};
`;
const Main = styled.div`
  padding: 10px;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState('');
  const [lineHistory, setLineHistory] = useState<Array<string>>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mainInput = useRef<HTMLInputElement | null>(null);
  const inputDiv = useRef<HTMLDivElement | null>(null);

  // set input value on change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  // handle "ENTER", adding input value to lineHistory
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      setLineHistory([...lineHistory, inputValue]); // TODO figure out why this set line is slower than the one in handleLoading??
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
    if (inputValue === 'load') {
      handleLoading(inputValue);
    }
    if (inputValue === 'retro') {
      setTheme(retro);
    }
    if (inputValue === 'dark') {
      setTheme(dark);
    }
  };

  // set isLoading to true/false
  const handleLoading = (inputValue: string) => {
    console.log(lineHistory);
    setIsLoading(true);
    setLineHistory([...lineHistory, inputValue, 'LOADING']);
    setTimeout(() => {
      console.log('load started');
      setIsLoading(false);
      console.log('load ended');
    }, 3000);
  };

  // while isLoading, prevent input
  useEffect(() => {
    if (isLoading) {
      if (inputDiv.current) {
        inputDiv.current.style.display = 'none';
      }
    } else {
      if (inputDiv.current) {
        inputDiv.current.style.display = 'block';
        setFocus();
      }
    }
  }, [isLoading]);

  // Auto scroll to bottom
  useEffect(() => {
    if (bottomRef.current && lineHistory.length > 0) {
      bottomRef.current.scrollIntoView();
    }

    console.log('useEffect');
  }, [lineHistory]);

  const lineHead = '> ';
  return (
    <ThemeProvider theme={theme}>
      <Blanket onClick={setFocus}>
        <Main>
          <Lines>
            <>&gt; TEST LINE</>
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
