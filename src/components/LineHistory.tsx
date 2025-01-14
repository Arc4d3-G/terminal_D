import React from 'react';
import LineHead from './LineHead';
import styled from 'styled-components';
import { Theme } from '../utils/themes';

const LineContainer = styled.div`
  display: flex;
  margin: 0px;
  padding: 0px;
  width: 100%;
`;
const LineSpan = styled.span``;
const LineDiv = styled.div``;

export type LineHeader = {
  username: string;
  nameSpace: string;
  cwd: string;
};

export type Line = {
  header: LineHeader | null;
  content: string;
};

type LineHistoryProps = {
  lineHistory: Array<Line>;
  activeTheme: Theme;
};

const LineHistory: React.FC<LineHistoryProps> = ({ lineHistory, activeTheme }) => {
  if (lineHistory.length === 0) {
    return null;
  }

  return (
    <>
      {lineHistory.map((line, index) => {
        const { content, header } = line;
        if (header) {
          const { username, cwd, nameSpace } = header;
          return (
            <LineContainer key={index}>
              <LineHead
                key={`linehead-${index}`}
                username={username}
                cwd={cwd}
                nameSpace={nameSpace}
                activeTheme={activeTheme}
              >
                <LineSpan
                  key={index}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </LineHead>
            </LineContainer>
          );
        }

        return (
          <LineDiv
            key={index}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      })}
    </>
  );
};

export default LineHistory;
