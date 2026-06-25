import React, { useState } from "react";
import { Image } from "expo-image";
import ImageGroup from "@/assets/Image_Group.svg";
import { Platform, ScrollView, StyleSheet, TextInput, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, FontWeight, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { TouchableOpacity } from "react-native";

export default function TabTwoScreen() {
    const [ID, setID] = useState("");
    const [mdp, setMdp] = useState("");
    const theme = useTheme();

    // Récupération des insets de sécurité pour gérer les marges et le padding -> (doit être sur chaque page)
    const safeAreaInsets = useSafeAreaInsets();
    const insets = {
        ...safeAreaInsets,
        bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
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
            <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
                <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", top: -40, left: -80 }} />
                <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", bottom: -50, right: -80 }} />
            </View>

            <ScrollView style={[styles.scrollView, { backgroundColor: theme.MainBackground }]} contentInset={insets} contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
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
                    <ImageGroup width={"100%"} height={245} preserveAspectRatio="xMidYMid meet" />
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Identifiant..."
                            placeholderTextColor={styles.placeholder.color}
                            value={ID} // 1. Affiche ce qui est dans la mémoire
                            onChangeText={(val) => setID(val)} // 2. Met à jour la mémoire à chaque lettre
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Mot de passe..."
                            placeholderTextColor={styles.placeholder.color}
                            value={mdp} // 1. Affiche ce qui est dans la mémoire
                            onChangeText={(val) => setMdp(val)} // 2. Met à jour la mémoire à chaque lettre
                        />
                    </View>
                </View>
                <View>
                    <TouchableOpacity style={[styles.button, { backgroundColor: theme.ButtonBackground }]} onPress={() => console.log("Bouton pressé")}>
                        <ThemedText style={[styles.buttonText, { color: theme.MainTextWhite }]}>Login</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        flexDirection: "column",
        justifyContent: "center",
    },
    container: {
        maxWidth: MaxContentWidth,
        flexGrow: 1,
    },

    // ------------------------- Welcome Frame -------------------------
    viewWelcomeFrame: {
        margin: "auto",
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
        lineHeight: 34,
    },
    textIncipit: {
        textAlign: "center",
        fontSize: 15,
        fontWeight: FontWeight.Medium,
    },

    // ------------------------- Styles for the login button -------------------------
    button: {
        width: "90%",

        display: "flex",
        justifyContent: "center",
        alignSelf: "center",

        paddingVertical: Spacing.three,
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
        borderRadius: 12,
    },
    inputWrapper: {
        marginBottom: 20,
    },

    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: FontWeight.SemiBold,
    },
    input: {
        height: 50,
        fontSize: 16,
        borderColor: "#000",
        borderWidth: 1,
        borderRadius: 27,
        paddingHorizontal: 10,
        backgroundColor: "#E8F7E3",
        color: "#000",
    },
    placeholder: {
        color: "#000",
        fontSize: 14,
        fontStyle: "italic",
    },
});

//                 <Image style={{ width: 235, height: 173, position: "absolute", left: -80, top: -40 }} contentFit="contain" />
//                 <Image source={require("@/assets/images/deco-shapes.png")} style={{ width: 235, height: 173, position: "absolute", left: 230, top: 710 }} contentFit="contain" />
