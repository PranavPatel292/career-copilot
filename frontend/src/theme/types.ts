export interface ThemeTokens {
  surface: {
    base: string;
    card: string;
    elevated: string;
    hover: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    body: string;
  };
  border: {
    default: string;
    emphasis: string;
    strong: string;
  };
  grounded: {
    bg: string;
    text: string;
  };
  suggested: {
    bg: string;
    label: string;
    body: string;
  };
  chip: {
    bg: string;
    text: string;
  };
  status: {
    failedBg: string;
    failedText: string;
    failedBorder: string;
  };
  interactive: {
    sendButtonBg: string;
    sendButtonText: string;
    sendButtonHoverBg: string;
    disabledBg: string;
    disabledText: string;
    deleteIconHover: string;
    navActiveTabBg: string;
    navActiveTabText: string;
    navInactiveTabHoverText: string;
  };
}
