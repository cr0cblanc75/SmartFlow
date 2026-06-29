import * as Device from "expo-device";
import { useState } from "react";
import { Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FontWeight, Spacing } from "@/constants/theme";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Image } from "expo-image";
import LogoRegister from "@/assets/Logo-Register.svg";

export default function HomeScreen() {
    const [ID, setID] = useState("");
    const [mdp, setMdp] = useState("");
    const [mail, setMail] = useState("");
    const [city, setCity] = useState("");
    const theme = useTheme();
    const router = useRouter();

    const [isChecked, setIsChecked] = useState(false);

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
        <View style={{ flex: 1 }}>
            <View style={[StyleSheet.absoluteFill, { zIndex: 1, pointerEvents: "none" }]}>
                <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", top: -40, left: -80 }} />
                <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", bottom: -50, right: -80 }} />
            </View>

            <ScrollView style={[styles.scrollView, { backgroundColor: theme.MainBackground, flex: 1 }]} contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
                {/* HEADER (titre) */}
                <View style={[styles.viewWelcomeFrame, { marginTop: Platform.OS === "web" ? 0 : 80 }]}>
                    <View style={styles.titleFrame}>
                        <ThemedText style={styles.title}>SmartFlow</ThemedText>
                        <LogoRegister width={40} height={50} preserveAspectRatio="xMidYMid meet" />
                    </View>
                </View>

                {/* CENTRÉ AU MILIEU */}
                <AnimatedScreen type="slide-from-bottom" duration={300}>
                    <View style={styles.centerZone}>
                        <View style={styles.boxIncipit}>
                            <ThemedText style={[styles.textIncipitBold, { color: theme.TextBlackOpa60 }]}>Nous sommes heureux de vous voir bouger avec nous !!</ThemedText>
                            <ThemedText style={[styles.textIncipit, { color: theme.textSecondary }]}>We like to move it, move it :)</ThemedText>
                        </View>

                        {/* BOTTOM */}
                        <View style={styles.continueButton}>
                            <Pressable style={[styles.button, { backgroundColor: theme.ButtonBackground }]} onPress={() => router.push("/login")}>
                                <ThemedText style={[styles.buttonText, { color: theme.MainTextWhite }]}>Continuer</ThemedText>
                            </Pressable>
                        </View>
                    </View>
                </AnimatedScreen>
            </ScrollView>

            <ThemedText style={[styles.signatureText, { color: theme.MainTextBlack, bottom: insets.bottom }]}>@RuntimeTerror</ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },

    contentContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        paddingBottom: Spacing.five,
    },

    centerZone: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        marginVertical: "auto",
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

    // ------------------------- Welcome Frame -------------------------
    viewWelcomeFrame: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
    },

    titleFrame: {
        width: "auto",
        display: "flex",
        flexDirection: "row",
        gap: 10,

        padding: 20,

        alignItems: "center",
        justifyContent: "center",
    },

    title: {
        textAlign: "center",
        fontSize: 48,
        fontWeight: FontWeight.Bold,
        lineHeight: 38,
    },

    boxIncipit: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        alignSelf: "center",
        gap: 20,

        width: "90%",

        padding: 16,
    },

    textIncipitBold: {
        fontSize: 26,
        lineHeight: 42,
        fontWeight: FontWeight.Bold,
    },

    textIncipit: {
        fontSize: 14.5,
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

    // ------------------------- Bottom Button -------------------------
    continueButton: {
        display: "flex",
        flexDirection: "column",
        gap: 20,

        width: "90%",

        alignSelf: "center",

        paddingBottom: 6,

        borderRadius: 12,
    },
});
