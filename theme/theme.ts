import { DefaultTheme as PaperDefaultTheme } from "react-native-paper";

import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";

import { colors } from "./colors";

export const defaultTheme = {
  ...NavigationDefaultTheme,
  ...PaperDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    ...PaperDefaultTheme.colors,
    text: colors.text,
    primary: colors.primary,
    backgroundColor: "#EFEEFE",
  },
};

export const darkTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: colors.primary,
    text: "#FDFFFF",
    backgroundColor: "#15202B",
  },
};
