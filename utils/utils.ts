import { Dimensions, Platform, StatusBar } from "react-native";

import * as Haptics from "expo-haptics";

export const screenWidth = Dimensions.get("screen").width;

export const screenHeight = Dimensions.get("screen").height;

export const windowHeight = Dimensions.get("window").height;

export const windowWidth = Dimensions.get("window").width;

export const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const safeAreaViewAndroid =
  Platform.OS === "android" ? StatusBar.currentHeight : 0;

export const provideHapticFeedback = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
