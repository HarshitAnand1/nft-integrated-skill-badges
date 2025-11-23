// Application color palette - Premium & Minimalistic
export const allColors = [
  "#1A1A2E", // Deep Navy
  "#16213E", // Dark Blue
  "#0F3460", // Royal Blue
  "#533483", // Deep Purple
  "#E94560", // Accent Red
  "#F8F9FA", // Off White
  "#E8E8E8", // Light Gray
  "#6C757D", // Medium Gray
  "#343A40", // Dark Gray
  "#FFD700", // Gold Accent
  "#4A5568", // Slate
  "#2D3748"  // Charcoal
];

// Named colors for specific use cases
export const colors = {
  // Primary
  primary: "#1A1A2E",
  primaryDark: "#16213E",
  primaryLight: "#0F3460",
  
  // Accent
  accent: "#E94560",
  accentDark: "#D63447",
  gold: "#FFD700",
  
  // Neutrals
  white: "#FFFFFF",
  offWhite: "#F8F9FA",
  lightGray: "#E8E8E8",
  mediumGray: "#6C757D",
  darkGray: "#343A40",
  slate: "#4A5568",
  charcoal: "#2D3748",
  
  // Status
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  
  // Legacy (for backward compatibility)
  lightBlue: "#E8E8E8",
  lightYellow: "#F8F9FA",
  orange: "#E94560",
  pink: "#E94560",
  lightPink: "#FEF2F2",
  lightMint: "#F0FDF4",
  blue: "#0F3460",
  darkRed: "#D63447",
  rose: "#E94560",
  peach: "#FEE2E2",
  cream: "#F8F9FA"
};

// Background gradients using the color palette
export const backgrounds = {
  primary: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.lightBlue} 100%)`,
  secondary: `linear-gradient(135deg, ${colors.orange} 0%, ${colors.gold} 100%)`,
  accent: `linear-gradient(135deg, ${colors.darkRed} 0%, ${colors.rose} 100%)`,
  light: `linear-gradient(135deg, ${colors.lightPink} 0%, ${colors.cream} 100%)`,
  success: `linear-gradient(135deg, ${colors.lightMint} 0%, ${colors.lightBlue} 100%)`,
};
