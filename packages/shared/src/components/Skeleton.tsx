import { useEffect, useRef } from "react";
import { Animated, type DimensionValue } from "react-native";
import { gray, radii, type RadiusToken } from "../tokens/index.ts";

export interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: RadiusToken;
}

/** Animated opacity-pulse placeholder for loading states. */
export function Skeleton({
  width = "100%",
  height = 16,
  radius = "sm",
}: SkeletonProps) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius: radii[radius],
        backgroundColor: gray[200],
        opacity: pulse,
      }}
    />
  );
}
