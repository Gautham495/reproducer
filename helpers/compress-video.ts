import { Video } from "react-native-compressor";

export const compressVideo = async (fileUri) => {
  const result = await Video.compress(fileUri, {
    compressionMethod: "auto",
  });

  return result;
};
