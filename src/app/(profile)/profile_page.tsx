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
import { useCustomTheme } from "@/hooks/themeContext";

import {} from "react-native";
import { AnimatedScreen } from "@/components/AnimatedScreen";


export default function ProfilePage() {
    const theme = useTheme();
    const router = useRouter();

    // Dark/Light mode
    const { themeMode, toggleTheme } = useCustomTheme(); 
    const isDarkMode = themeMode === 'dark';

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

                {/* ZONE DU HAUT */}
                <View style={[styles.topBackground, { backgroundColor: theme.MainBackground200, paddingTop: safeAreaInsets.top + 10 }]}>
                    <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", top: -40, left: -80, opacity: 0.3, zIndex: 0 }}/>

                    <View style={styles.actionHeader}>
                        <Pressable style={styles.backButton} onPress={() => router.push("/(main)/home_map")}>
                            <ReturnButton height={30} preserveAspectRatio="xMidYMid meet" color={theme.MainTextBlack} />
                        </Pressable>

                        
                        {/*Dark/Light mode button*/}
                        <Pressable style={[styles.toggleTrack, {backgroundColor: theme.MainBackgroundGrey100}]} onPress={toggleTheme}>
                            <View style={[styles.toggleThumb, { backgroundColor: theme.MainTextWhite, top: isDarkMode ? 0 : 24 }]}/>

                            <View style={styles.iconContainer}>
                                <MoonIcon height={20} preserveAspectRatio="xMidYMid meet" color={theme.MainTextBlack} />
                            </View>
                            <View style={styles.iconContainer}>
                                <SunIcon height={20} preserveAspectRatio="xMidYMid meet" color={theme.MainTextBlack} />
                            </View>

                        </Pressable>
                    </View>
                </View>

                {/* ZONE DE L'AVATAR */}
                <View style={styles.avatarWrapper}>
                    <View style={[styles.avatar, { backgroundColor: theme.BackgroundAwardCards }]} />
                </View>

                {/* ZONE DU BAS */}
                <ScrollView style={[styles.scrollView, { backgroundColor: theme.MainBackground }]} contentContainerStyle={styles.scrollContent}>
                    <ThemedText style={[styles.welcomeText, { color: theme.MainTextBlack }]}>Hi,</ThemedText>
                    <ThemedText style={[styles.nameText, { color: theme.MainTextBlack }]}>François</ThemedText>
                </ScrollView>
            </View>
        </AnimatedScreen>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -30,
        zIndex: 5,
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
        overflow: "hidden",
    },
    iconContainer: {
        width: 22,
        height: 22,
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2,
    },
    toggleThumb: {
        position: "absolute",
        left: 2,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
        zIndex: 1,
    },


    // ------------------------- Avatar Part -------------------------
    avatarWrapper: {
        position: "absolute",
        top: 120,
        alignSelf: "center",
        zIndex: 99,
        elevation: 6,
    },

    avatar: {
        width: 130,
        height: 130,
        borderRadius: 65,
    },

    // ------------------------- Bottom part -------------------------
    scrollContent: {
        paddingTop: 90, // Laisse de l'espace pour que l'avatar ne cache pas le texte "Hi, François"
        paddingHorizontal: Spacing.five,
        paddingBottom: Spacing.five,
    },
    welcomeText: {
        fontSize: 18,
        fontWeight: FontWeight.Medium,
        lineHeight: 22,
    },
    nameText: {
        fontSize: 34,
        fontWeight: FontWeight.Bold,
        lineHeight: 38,
        marginTop: 2,
    },
});
