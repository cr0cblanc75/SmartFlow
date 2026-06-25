import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.MainBackground,
        },
      }}
    />
  );
}

