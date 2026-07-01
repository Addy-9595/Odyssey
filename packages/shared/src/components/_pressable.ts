import type { PressableStateCallbackType } from "react-native";

/**
 * react-native-web exposes `hovered` and `focused` on the Pressable state
 * callback, but react-native's TypeScript types only declare `pressed`. This
 * models the web-provided fields so we can read them with a cast. (The base
 * type is a `type` alias, so it can't be augmented via interface merging.)
 */
export type PressableState = PressableStateCallbackType & {
  hovered?: boolean;
  focused?: boolean;
};
