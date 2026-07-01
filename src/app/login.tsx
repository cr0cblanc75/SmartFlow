import { useState } from "react";

import { Image } from "expo-image";
import ImageGroup from "@/assets/Image_Group.svg";

import { Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { FontWeight, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function TabTwoScreen() {
    const [ID, setID] = useState("");
    const [mdp, setMdp] = useState("");
    const theme = useTheme();
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState("");

    // Message d'erreur pour mdp ou indentifiant manquant
    const handleLogin = () => {
        if (!ID.trim()) {
            setErrorMessage("L'identifiant ne peut pas être vide.");
            return;
        }
        if (!mdp.trim()) {
            setErrorMessage("Le mot de passe est requis.");
            return;
        }
        setErrorMessage("");
        router.push("/(main)/home_map");
    };

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
        <View style={{ flex: 1 }}>
            <View style={[StyleSheet.absoluteFill, { zIndex: 1, pointerEvents: "none" }]}>
                <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", top: -40, left: -80 }} />
                <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", bottom: -50, right: -80 }} />
            </View>

            <ScrollView style={[styles.scrollView, { backgroundColor: theme.MainBackground, flex: 1 }]} contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
                <View style={[styles.viewWelcomeFrame, { marginTop: Platform.OS === "web" ? 0 : 80 }]}>
                    <View style={{ width: "auto" }}>
                        <ThemedText style={styles.subtitle}>Bienvenue sur</ThemedText>
                        <ThemedText style={styles.title}>SmartFlow</ThemedText>
                    </View>
                    <View style={{ display: "flex", flexDirection: "column" }}>
                        <ThemedText style={[styles.textIncipit, { color: theme.TextBlackOpa60 }]}>Heureux de vous revoir !</ThemedText>
                        <ThemedText style={[styles.textIncipit, { color: theme.TextBlackOpa60 }]}>Identifiez-vous.</ThemedText>
                    </View>
                </View>

                <View style={{ alignItems: "center" }}>
                    <ImageGroup width={"100%"} height={245} preserveAspectRatio="xMidYMid meet" color={theme.LogoSplashPhone} />
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.MainBackground100, color: theme.text, borderColor: theme.text }]}
                            placeholder="Identifiant..."
                            placeholderTextColor={theme.TextBlackOpa60}
                            value={ID} // 1. Affiche ce qui est dans la mémoire
                            onChangeText={(val) => {
                                setID(val);
                                if (val.trim()) setErrorMessage("");
                            }}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.MainBackground100, color: theme.text, borderColor: theme.text }]}
                            placeholder="Mot de passe..."
                            placeholderTextColor={theme.TextBlackOpa60}
                            secureTextEntry={true}
                            value={mdp} // 1. Affiche ce qui est dans la mémoire
                            onChangeText={(val) => {
                                setMdp(val);
                                if (val.trim()) setErrorMessage("");
                            }}
                        />
                    </View>

                    {errorMessage ? (
                        <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
                    ) : null}

                    <Pressable style={[styles.button, { backgroundColor: theme.ButtonBackground }]} onPress={handleLogin}>
                        <ThemedText style={[styles.buttonText, { color: theme.MainTextWhite }]}>Login</ThemedText>
                    </Pressable>

                    <ThemedText style={[styles.registerText, { color: theme.MainTextBlack }]}>
                        {"Vous n'avez pas de compte ? "}
                        <ThemedText style={styles.hyperlink} onPress={() => router.push("/inscription")}>
                            Inscrivez-vous
                        </ThemedText>
                    </ThemedText>
                </View>
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
