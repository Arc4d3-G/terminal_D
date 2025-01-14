import React from 'react';
import styled from 'styled-components';
import { Theme } from '../utils/themes';
import { Prompt } from '../pages/TerminalD';

type LineHeadProps = {
  username?: string;
  cwd: string;
  activeTheme: Theme;
  nameSpace: string;
  children?: React.ReactNode;
  isPrompting?: Prompt | null;
};

const LineHeadContainer = styled.span`
  /* font-weight: bold; */
`;

const Part = styled.span<{ color?: string; bold?: boolean }>`
  color: ${({ color }) => color || 'inherit'};
  font-weight: ${({ bold }) => (bold ? 'bold' : 'inherit')};
`;

const LineHead: React.FC<LineHeadProps> = ({
  username = 'guest',
  nameSpace = 'localhost',
  cwd,
  activeTheme,
  children,
  isPrompting = null,
}) => {
  if (isPrompting) {
    return <LineHeadContainer>{isPrompting.content}: </LineHeadContainer>;
  }
  return (
    <LineHeadContainer>
      <Part
        bold={true}
        color={activeTheme.primary}
      >
        {username}@{nameSpace}
      </Part>
      :<Part color={activeTheme.secondary}>{cwd}</Part>$ {children}
    </LineHeadContainer>
  );
};

export default LineHead;
