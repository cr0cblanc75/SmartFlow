import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, TextInput, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { BottomTabInset, FontWeight, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { TouchableOpacity } from "react-native";

export default function TabTwoScreen() {
    const [text, setText] = useState("");

    const safeAreaInsets = useSafeAreaInsets();
    const insets = {
        ...safeAreaInsets,
        bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
    };
    const theme = useTheme();

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
        <ScrollView style={[styles.scrollView, { backgroundColor: theme.MainBackground }]} contentInset={insets} contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
            <ThemedText type="title" style={styles.centerText}>
                Welcome to SmartFlow
            </ThemedText>
            <ThemedText type="subtitle" style={styles.centerText}>
                Please log in.
            </ThemedText>

            <View style={styles.container}>
                <Text style={styles.label}>Identifiant :</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Tapez quelque chose ici..."
                    placeholderTextColor="#888"
                    value={text} // 1. Affiche ce qui est dans la mémoire
                    onChangeText={(val) => setText(val)} // 2. Met à jour la mémoire à chaque lettre
                />

                {/* Optionnel : On affiche en temps réel ce qui est écrit en dessous */}
                <Text style={styles.result}>Vous écrivez : {text}</Text>
            </View>

            <View>
                <TouchableOpacity style={[styles.button, { backgroundColor: theme.ButtonBackground }]} onPress={() => console.log("Bouton pressé")}>
                    <ThemedText style={[styles.buttonText, { color: theme.MainTextWhite }]}>Login</ThemedText>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    titleContainer: {
        gap: Spacing.three,
        alignItems: "center",
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.six,
    },
    centerText: {
        textAlign: "center",
    },

    // Styles for the login button
    button: {
        width: "100%",

        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.five,

        borderRadius: 12,
    },
    buttonText: {
        fontWeight: FontWeight.SemiBold,
        fontSize: 18,
    },

    // Styles for the label of the TextInput
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: "600",
    },
    // Je vais modifier tkt
    input: {
        height: 50, // Hauteur de la case
        borderColor: "#ccc", // Couleur de la bordure
        borderWidth: 1, // Épaisseur de la bordure
        borderRadius: 8, // Coins arrondis
        paddingHorizontal: 15, // Espace intérieur pour que le texte ne colle pas au bord
        fontSize: 16,
        backgroundColor: "#fff", // Fond blanc pour la case
        color: "#000", // Couleur du texte écrit
    },
    result: {
        marginTop: 15,
        fontStyle: "italic",
        color: "#555",
    },
});
