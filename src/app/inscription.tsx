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

export default function HomeScreen() {
    const [ID, setID] = useState("");
    const [mdp, setMdp] = useState("");
    const [mail, setMail] = useState("");
    const [city, setCity] = useState("");
    const theme = useTheme();
    const router = useRouter();

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
        <AnimatedScreen type="slide-from-bottom" duration={300}>
            <View style={{ flex: 1 }}>
                <View style={[StyleSheet.absoluteFill, { zIndex: 1, pointerEvents: "none" }]}>
                    <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", top: -40, left: -80 }} />
                    <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", bottom: -50, right: -80 }} />
                </View>

                <ScrollView style={[styles.scrollView, { backgroundColor: theme.MainBackground, flex: 1 }]} contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
                    <View style={[styles.viewWelcomeFrame, { marginTop: Platform.OS === "web" ? 0 : 80 }]}>
                        <View style={{ width: "auto" }}>
                            <ThemedText style={styles.title}>SmartFlow</ThemedText>

                        </View>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.boxIncipit}>
                            <ThemedText style={[styles.textIncipitBold, { color: theme.TextBlackOpa60 }]}>Créer un compte.</ThemedText>
                            <ThemedText style={[styles.textIncipit, { color: theme.TextBlackOpa60 }]}>Rentrez vos informations ci-dessous pour créer un compte.</ThemedText>
                        </View>


                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.MainBackground100, color: theme.text, borderColor: theme.text }]}
                                placeholder="Identifiant..."
                                placeholderTextColor={theme.TextBlackOpa60}
                                value={ID} // 1. Affiche ce qui est dans la mémoire
                                onChangeText={(val) => setID(val)} // 2. Met à jour la mémoire à chaque lettre
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.MainBackground100, color: theme.text, borderColor: theme.text }]}
                                placeholder="Mail..."
                                placeholderTextColor={theme.TextBlackOpa60}
                                value={ID} // 1. Affiche ce qui est dans la mémoire
                                onChangeText={(val) => setMail(val)} // 2. Met à jour la mémoire à chaque lettre
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.MainBackground100, color: theme.text, borderColor: theme.text }]}
                                placeholder="City..."
                                placeholderTextColor={theme.TextBlackOpa60}
                                value={ID} // 1. Affiche ce qui est dans la mémoire
                                onChangeText={(val) => setCity(val)} // 2. Met à jour la mémoire à chaque lettre
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.MainBackground100, color: theme.text, borderColor: theme.text }]}
                                placeholder="Mot de passe..."
                                placeholderTextColor={theme.TextBlackOpa60}
                                value={mdp} // 1. Affiche ce qui est dans la mémoire
                                onChangeText={(val) => setMdp(val)} // 2. Met à jour la mémoire à chaque lettre
                            />
                        </View>
                    </View>

                    {/*Acceptez les termes et conditions*/}

                    <View style={[styles.formContainer, { paddingTop: 0, paddingBottom: 0 }]}>
                        <Pressable style={[styles.button, { backgroundColor: theme.ButtonBackground }]} onPress={() => router.push("/(main)/home_map")}>
                            <ThemedText style={[styles.buttonText, { color: theme.MainTextWhite }]}>S'inscrire</ThemedText>
                        </Pressable>
                    </View>
                </ScrollView>

                <ThemedText style={[styles.signatureText, { color: theme.MainTextBlack, bottom: insets.bottom }]}>@RuntimeTerror</ThemedText>
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

    title: {
        textAlign: "center",
        fontSize: 48,
        fontWeight: FontWeight.Bold,
        lineHeight: 34,
    },

    boxIncipit:{
        flexDirection: "column", 
        alignItems: "flex-start",
    },

    textIncipitBold: {
        fontSize: 17,
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
});