import { COLORS } from "../theme.js";

export type HeaderProps = {
  sessionName?: string;
};

export const Header = ({ sessionName }: HeaderProps) => (
  <box
    width="100%"
    border
    borderStyle="rounded"
    borderColor={COLORS.blue}
    paddingX={1}
    flexDirection="row"
    alignItems="center"
    justifyContent="space-between"
    backgroundColor={COLORS.bg}
    flexShrink={0}
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
