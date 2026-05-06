import { Dimensions, PixelRatio, Platform } from "react-native";

export const responsiveFont = (size) => {
  const multiplier = Platform.isPad ? 3.8 : 2;

  const windowHeight = Dimensions.get("window").height;

  const windowWidth = Dimensions.get("window").width;

  const scale = (windowHeight / windowWidth) * multiplier;

  const newSize = size * scale;

  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
