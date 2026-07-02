import { ThemeProvider, DarkTheme, DefaultTheme, Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { AnimatedSplashOverlay } from "@/components/animated-icon";

export default function Layout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
            <AnimatedSplashOverlay />

            <Stack screenOptions={{ headerShown: false, animation: "none" }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="inscription" />
                <Stack.Screen name="inscription_validated" />
                <Stack.Screen name="(main)/home_map" />
                <Stack.Screen name="(main)/waypoints" />
                <Stack.Screen name="(main)/path" />
                <Stack.Screen name="(profile)/profile_page" />
            </Stack>
        </ThemeProvider>
    );
}
