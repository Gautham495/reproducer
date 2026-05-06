import { createMMKV } from "react-native-mmkv";

export const reproducerStorage = createMMKV({
  encryptionKey: "reproducerkey",
  id: "reproducer",
});
