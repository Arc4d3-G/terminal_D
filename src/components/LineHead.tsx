import React from 'react';
import styled from 'styled-components';

type LineHeadProps = {
  username: string;
  cwd: string;
  usernameColor?: string;
  cwdColor?: string;
};

const LineHeadContainer = styled.span`
  display: flex;
  align-items: center;
`;

const Part = styled.span<{ color?: string }>`
  color: ${({ color }) => color || 'inherit'};
`;

const LineHead: React.FC<LineHeadProps> = ({ username, cwd, usernameColor, cwdColor }) => (
  <LineHeadContainer>
    <Part color={usernameColor}>{username}</Part>:<Part color={cwdColor}>{cwd}</Part>$
  </LineHeadContainer>
);

export default LineHead;
