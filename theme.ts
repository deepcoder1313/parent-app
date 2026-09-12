// theme.ts  — shared design tokens (Parent App)
// Same palette as Driver App for consistency across the system

export const C = {
  // Backgrounds
  bgDark:    "#0F172A",
  bgMid:     "#1E293B",
  bgLight:   "#F1F5F9",
  bgCard:    "#FFFFFF",

  // Brand
  primary:   "#6366F1",
  primary2:  "#818CF8",
  primaryBg: "#EEF2FF",

  // Status
  success:   "#10B981",
  successBg: "#ECFDF5",
  warning:   "#F59E0B",
  warningBg: "#FFFBEB",
  danger:    "#F43F5E",
  dangerBg:  "#FFF1F2",

  // Parent-specific warm accents
  teal:      "#0EA5E9",   // for ETA / live info
  tealBg:    "#F0F9FF",
  purple:    "#8B5CF6",
  amber:     "#F59E0B",

  // Text
  textPrimary: "#0F172A",
  textSub:     "#475569",
  textMuted:   "#94A3B8",
  textOnDark:  "#F8FAFC",

  // Border
  border:    "#E2E8F0",
  borderDark:"#1E293B",
};

export const S = {
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  shadowMd: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 6,
  },
};
