export const COLORS = {
navy: "#12355B",
amber: "#F59E0B",
white: "#FFFFFF",
bg: "#F1F5F9",
green: "#16A34A",
red: "#DC2626",
slate: "#475569",
};

export function confidenceColor(c) {
if (c >= 0.85) return COLORS.green;
if (c >= 0.6) return COLORS.amber;
return COLORS.red;
}
