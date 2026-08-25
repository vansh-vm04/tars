import { COLORS } from "../theme.js";

export type HeaderProps = {
  sessionName?: string;
};

export const Header = ({ sessionName }: HeaderProps) => (
  <box
    width="100%"
    flexDirection="row"
    alignItems="center"
    justifyContent="space-between"
    paddingX={1}
    flexShrink={0}
    backgroundColor={COLORS.bg}
  >
    <text fg={COLORS.green}>
      <strong>TARS</strong>
    </text>

    {sessionName ? (
      <text fg={COLORS.front}>{sessionName}</text>
    ) : (
      <text fg={COLORS.dim}>New Session</text>
    )}
  </box>
);
