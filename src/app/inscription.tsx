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
        <AnimatedScreen type="slide-from-bottom" duration={300}>
            <View style={{ flex: 1 }}>
                <View style={[StyleSheet.absoluteFill, { zIndex: 1, pointerEvents: "none" }]}>
                    <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", top: -40, left: -80 }} />
                    <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", bottom: -50, right: -80 }} />
                </View>

                <ScrollView style={[styles.scrollView, { backgroundColor: theme.MainBackground, flex: 1 }]} contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
                    <View style={[styles.viewWelcomeFrame, { marginTop: Platform.OS === "web" ? 0 : 80 }]}>
                        <View style={styles.titleFrame}>
                            <ThemedText style={styles.title}>SmartFlow</ThemedText>
                            <LogoRegister width={40} height={50} preserveAspectRatio="xMidYMid meet" />
                        </View>
                    </View>

                    <View style={styles.boxIncipit}>
                        <ThemedText style={[styles.textIncipitBold, { color: theme.TextBlackOpa60 }]}>Créer un compte.</ThemedText>
                        <ThemedText style={[styles.textIncipit, { color: theme.textSecondary }]}>Rentrez vos informations ci-dessous pour créer un compte.</ThemedText>
                    </View>

                    <View style={styles.formContainer}>
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
                                value={mail} // 1. Affiche ce qui est dans la mémoire
                                onChangeText={(val) => setMail(val)} // 2. Met à jour la mémoire à chaque lettre
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.MainBackground100, color: theme.text, borderColor: theme.text }]}
                                placeholder="City..."
                                placeholderTextColor={theme.TextBlackOpa60}
                                value={city} // 1. Affiche ce qui est dans la mémoire
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
                    <View style={styles.containerCheckbox}>
                        <Pressable style={[styles.checkboxBase, { borderColor: isChecked ? "#86D74F" : "#CCCCCC" }, isChecked && { backgroundColor: "#86D74F" }]} onPress={() => setIsChecked(!isChecked)}>
                            {isChecked && <View style={styles.checkboxCheckedInner} />}
                        </Pressable>
                        <Pressable style={styles.buttonCheckbox} onPress={() => setIsChecked(!isChecked)}>
                            <ThemedText style={styles.textCheckBox}>J'accepte les termes et conditions</ThemedText>
                        </Pressable>
                    </View>

                    <View style={styles.formContainer}>
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
        flexDirection: "column",
        alignItems: "flex-start",

        display: "flex",

        gap: 10,

        width: "90%",

        alignSelf: "center",

        padding: 16,
        paddingBottom: 6,

        borderRadius: 12,
    },

    textIncipitBold: {
        fontSize: 17,
        fontWeight: FontWeight.Bold,
        marginBottom: 5,
    },

    textIncipit: {
        fontSize: 14.5,
        fontWeight: FontWeight.Medium,
        marginBottom: 25,
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
        display: "flex",
        flexDirection: "column",
        gap: 20,

        width: "90%",

        alignSelf: "center",

        paddingBottom: 6,

        borderRadius: 12,
    },

    inputWrapper: {
        width: "100%",
        alignSelf: "center",
    },

    input: {
        height: 40,
        fontSize: 13,

        borderWidth: 1,
        borderRadius: 27,
        paddingLeft: 10,
    },

    placeholder: {
        fontSize: 13,
        fontStyle: "italic",
    },

    // ------------------------- Styles for the label of the Checkbox -------------------------

    containerCheckbox: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "center",
        padding: 0,
        marginTop: 25,
        marginBottom: 45,
    },
    checkboxBase: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    checkboxCheckedInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#FFFFFF",
    },
    buttonCheckbox: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",

        paddingLeft: 10,

        borderRadius: 12,
    },
    textCheckBox: {
        fontWeight: FontWeight.Regular,
        fontSize: 15,
    },
});
