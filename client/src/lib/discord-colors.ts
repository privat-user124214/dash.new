export const discordColors = {
  // Main Discord colors
  blurple: '#5865F2',
  green: '#57F287',
  yellow: '#FEE75C',
  red: '#ED4245',
  dark: '#2F3136',
  secondary: '#36393F',
  tertiary: '#40444B',
  
  // Extended palette
  white: '#FFFFFF',
  greyple: '#99AAB5',
  darkButNotBlack: '#2C2F33',
  notQuiteBlack: '#23272A',
  
  // Status colors
  online: '#43B581',
  idle: '#FAA61A',
  dnd: '#F04747',
  offline: '#747F8D',
  invisible: '#747F8D',
  
  // Role colors (common ones)
  teal: '#1ABC9C',
  darkTeal: '#11806A',
  darkGreen: '#1F8B4C',
  blue: '#3498DB',
  darkBlue: '#206694',
  purple: '#9B59B6',
  darkPurple: '#71368A',
  luminousVividPink: '#E91E63',
  darkVividPink: '#AD1457',
  gold: '#F1C40F',
  darkGold: '#C27C0E',
  orange: '#E67E22',
  darkOrange: '#A84300',
  darkRed: '#992D22',
  lightGrey: '#979C9F',
  navy: '#34495E',
  darkNavy: '#2C3E50',
} as const;

export type DiscordColor = keyof typeof discordColors;

export function getDiscordColor(color: DiscordColor): string {
  return discordColors[color];
}

export function isValidDiscordColor(color: string): color is DiscordColor {
  return color in discordColors;
}

// Helper function to convert hex to HSL for CSS variables
export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Pre-computed HSL values for CSS variables
export const discordColorsHsl = {
  blurple: hexToHsl(discordColors.blurple), // 235 86% 65%
  green: hexToHsl(discordColors.green),     // 139 66% 68%
  yellow: hexToHsl(discordColors.yellow),   // 48 100% 67%
  red: hexToHsl(discordColors.red),         // 0 84% 60%
  dark: hexToHsl(discordColors.dark),       // 240 11% 19%
  secondary: hexToHsl(discordColors.secondary), // 240 6% 22%
  tertiary: hexToHsl(discordColors.tertiary),   // 240 7% 25%
} as const;

// CSS class mapping
export const discordCssClasses = {
  backgrounds: {
    blurple: 'discord-bg-blurple',
    green: 'discord-bg-green',
    yellow: 'discord-bg-yellow',
    red: 'discord-bg-red',
    dark: 'discord-bg-dark',
    secondary: 'discord-bg-secondary',
    tertiary: 'discord-bg-tertiary',
  },
  text: {
    blurple: 'discord-text-blurple',
    green: 'discord-text-green',
    yellow: 'discord-text-yellow',
    red: 'discord-text-red',
  },
  buttons: {
    primary: 'discord-button-primary',
    success: 'discord-button-success',
    warning: 'discord-button-warning',
    danger: 'discord-button-danger',
  },
} as const;

export function getTicketCategoryColor(color: string): {
  bg: string;
  text: string;
  badge: string;
} {
  switch (color) {
    case discordColors.blurple:
      return {
        bg: 'discord-bg-blurple',
        text: 'text-white',
        badge: 'discord-bg-blurple text-white'
      };
    case discordColors.red:
      return {
        bg: 'discord-bg-red',
        text: 'text-white',
        badge: 'discord-bg-red text-white'
      };
    case discordColors.green:
      return {
        bg: 'discord-bg-green',
        text: 'text-white',
        badge: 'discord-bg-green text-white'
      };
    case discordColors.yellow:
      return {
        bg: 'discord-bg-yellow',
        text: 'text-black',
        badge: 'discord-bg-yellow text-black'
      };
    default:
      return {
        bg: 'discord-bg-blurple',
        text: 'text-white',
        badge: 'discord-bg-blurple text-white'
      };
  }
}
