import { createContext } from "react";

// Define the possible theme values
export type Theme = "dark" | "light" | "system";

// Define the shape of the context state
export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// Define the initial state for the context
const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

// Create and export the context
export const ThemeProviderContext = createContext<ThemeProviderState>(initialState);
