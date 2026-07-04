import { useState } from "react";
import { useRouter } from "expo-router";

import { Image } from "expo-image";
import ReturnButton from "@/assets/ReturnButton.svg";
import MoonIcon from "@/assets/Lune_Icon.svg";
import SunIcon from "@/assets/Sun_Icon.svg";

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
                <View style={[styles.topBackground, { backgroundColor: theme.MainBackground, paddingTop: safeAreaInsets.top + 10 }]}>
                    <View style={styles.actionHeader}>
                        <Pressable style={styles.backButton} onPress={() => router.push("/(main)/home_map")}>
                            <ReturnButton height={30} preserveAspectRatio="xMidYMid meet" color={theme.MainTextBlack} />
                        </Pressable>

                        
                        {/*Dark/Light mode button*/}
                        <Pressable style={styles.toggleTrack} onPress={toggleTheme}>
                            <View style={styles.iconContainer}>
                                <MoonIcon height={20} preserveAspectRatio="xMidYMid meet" color={theme.MainTextBlack} />
                            </View>
                            <View style={styles.iconContainer}>
                                <SunIcon height={20} preserveAspectRatio="xMidYMid meet" color={theme.MainTextBlack} />
                            </View>

                            <View style={[styles.toggleThumb, { backgroundColor: isDarkMode ? theme.MainTextWhite : theme.MainTextBlack, top: isDarkMode ? 2 : 26 }]}>
                                {/*<Ionicons 
                                    name={isDarkMode ? "moon-outline" : "sunny-outline"} 
                                    size={13} 
                                    color={isDarkMode ? "#FFFFFF" : "#000000"} 
                                />*/}
                            </View>
                        </Pressable>
                    </View>
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

    // ------------------------- Top part -------------------------
    topBackground: {
        height: 200,
        width: "100%",
        zIndex: 2,
    },
    actionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        paddingHorizontal: Spacing.five,
        width: "100%",
    },

    backButton:{
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },

    toggleTrack:{
        width: 26,
        height: 52,
        borderRadius: 13,
        padding: 2,
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
    },
    iconContainer: {
        width: 22,
        height: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    toggleThumb: {
        position: "absolute",
        left: 2,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },


    // ------------------------- Bottom part -------------------------
});
