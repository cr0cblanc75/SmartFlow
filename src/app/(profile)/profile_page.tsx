import { useState } from "react";
import { useRouter } from "expo-router";

import { Image } from "expo-image";

import { Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FontWeight, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ThemedText } from "@/components/themed-text";

import { Pressable } from "react-native";
import { AnimatedScreen } from "@/components/AnimatedScreen";

export default function ProfilePage() {
    const theme = useTheme();
    const router = useRouter();

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
            </View>
        </AnimatedScreen>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        flexDirection: "column",
        paddingBottom: Spacing.five,
    },

    // ------------------------- Welcome Frame -------------------------
    viewWelcomeFrame: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
    },
    subtitle: {
        textAlign: "right",
        fontSize: 16,
        fontWeight: FontWeight.SemiBold,
    },
    title: {
        textAlign: "center",
        fontSize: 48,
        fontWeight: FontWeight.Bold,
        lineHeight: 38,
    },
    textIncipit: {
        textAlign: "center",
        fontSize: 15,
        fontWeight: FontWeight.Medium,
    },

    // ------------------------- Styles for the login button -------------------------
    button: {
        width: "100%",
        height: 40,

        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",

        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.five,

        borderRadius: 12,
    },
    buttonText: {
        fontWeight: FontWeight.SemiBold,
        fontSize: 18,
    },
    errorText: {
        color: "#FF3B30", // Un beau rouge iOS / Android standard pour les erreurs
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 10,
        alignSelf: "flex-start", // S'aligne parfaitement sur le bord gauche de ton conteneur à 90%
        paddingLeft: 4,
    },

    // ------------------------- Styles for the label of the TextInput -------------------------
    formContainer: {
        alignSelf: "center",
        width: "90%",
        padding: 16,
        paddingBottom: 6,
        borderRadius: 12,
    },
    inputWrapper: {
        marginBottom: 20,
    },
    input: {
        height: 40,
        fontSize: 13,
        borderWidth: 1,
        borderRadius: 27,
        paddingHorizontal: 10,
    },
    placeholder: {
        fontSize: 13,
        fontStyle: "italic",
    },

    // ------------------------- Styles for the register button -------------------------
    registerText: {
        fontWeight: FontWeight.Regular,
        textAlign: "left",
        fontSize: 14,
    },
    hyperlink: {
        fontWeight: FontWeight.Regular,
        fontSize: 14,
        color: "#00E0FF",
    },

    signatureText: {
        textAlign: "center",
        position: "absolute",
        // see bottom properties inside the react part
        left: 0,
        right: 0,

        fontWeight: FontWeight.Light,
        fontStyle: "italic",
        fontSize: 12,
        letterSpacing: 3,
        zIndex: 999,
    },
});
