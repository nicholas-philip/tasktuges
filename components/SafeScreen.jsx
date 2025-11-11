import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SafeScreen({ children }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-black"
      style={{
        paddingTop: insets.top,
      }}
    >
      {children}
    </View>
  );
}
