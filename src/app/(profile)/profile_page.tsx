import { useState } from "react";
import { useRouter } from "expo-router";

import { Image } from "expo-image";

import { Pressable, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FontWeight, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ThemedText } from "@/components/themed-text";

import {} from "react-native";
import { AnimatedScreen } from "@/components/AnimatedScreen";

export default function ProfilePage() {
    const theme = useTheme();
    const router = useRouter();

    // Dark/Light mode
    const [isDarkMode, setIsDarkMode] = useState(false); 
    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    // Récupération des insets de sécurité pour gérer les marges et le padding -> (doit être sur chaque page)
    const safeAreaInsets = useSafeAreaInsets();
    const insets = {
        ...safeAreaInsets,
        bottom: safeAreaInsets.bottom + Spacing.one,
    };

    const contentPlatformStyle = Platform.select({
        android: {
            paddingTop: insets.top,
            paddingLeft: insets.left,
            paddingRight: insets.right,
            paddingBottom: insets.bottom,
        },
        web: {
            paddingTop: Spacing.six,
            paddingBottom: Spacing.four,
        },
    });

    return (
        <AnimatedScreen type="fade" duration={200}>
            <View style={{ flex: 1 }}>
                <View style={[StyleSheet.absoluteFill, { zIndex: 1, pointerEvents: "none" }]}>
                    <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", top: -40, left: -80 }} />
                    <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", bottom: -50, right: -80 }} />
                </View>

                {/* ZONE DU HAUT */}
                <View style={[styles.topBackground, { backgroundColor: theme.MainBackground }]}>
                    {/*Dark/Light mode button*/}
                    <Pressable></Pressable>
                </View>

                {/* ZONE DU BAS */}
                <ScrollView></ScrollView>
            </View>
        </AnimatedScreen>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },

    topBackground: {
        flex: 1,
        height: "35%",
    },
});
