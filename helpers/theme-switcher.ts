import { createMMKV } from "react-native-mmkv";

export const themeStore = createMMKV({
  id: "theme",
});

export const setThemePreference = (isDarkTheme) => {
  themeStore.set("isDarkTheme", isDarkTheme ? "true" : "false");
};

export const getThemePreference = () => {
  return themeStore.getString("isDarkTheme") === "true";
};
