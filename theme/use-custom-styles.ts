import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";

import { responsiveFont } from "@/helpers/responsive-fonts";

import { screenWidth } from "@/utils/utils";

import { normalFont } from "@/theme/fonts";

const getStyles = (props) =>
  StyleSheet.create({
    wholeContainer: {
      backgroundColor: props.colors.backgroundColor,
      flex: 1,
    },
    primaryButton: {
      backgroundColor: props.colors.primary,
      padding: 13,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 27,
      width: screenWidth * 0.9,
    },
    primaryDisabledButton: {
      backgroundColor: props.colors.disabled,
      padding: 13,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 27,
      width: screenWidth * 0.9,
    },
    thumbText: {
      color: props.colors.text,
      fontFamily: normalFont,
      fontSize: responsiveFont(4.3),
      lineHeight: 30,
    },

    normalText: {
      color: props.colors.text,
      fontFamily: normalFont,
      fontSize: responsiveFont(4),
      lineHeight: 30,
    },
  });

function useCustomStyles() {
  const { colors } = useTheme();

  const styles = useMemo(() => getStyles({ colors }), [colors]);

  return styles;
}

export default useCustomStyles;
