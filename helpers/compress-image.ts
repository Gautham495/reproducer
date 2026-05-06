import { Image } from "react-native-compressor";

export const compressImage = async (fileUri) => {
  const result = await Image.compress(fileUri, {
    compressionMethod: "auto",
  });
  return result;
};
