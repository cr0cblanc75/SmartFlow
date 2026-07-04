import { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";

import { Image } from "expo-image";
import ReturnButton from "@/assets/ReturnButton.svg";
import MoonIcon from "@/assets/Lune_Icon.svg";
import SunIcon from "@/assets/Sun_Icon.svg";

import { Pressable, Platform, ScrollView, StyleSheet, TextInput, View, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FontWeight, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ThemedText } from "@/components/themed-text";
import { useCustomTheme } from "@/hooks/themeContext";

import {} from "react-native";
import { AnimatedScreen } from "@/components/AnimatedScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function ProfilePage() {
    const theme = useTheme();
    const router = useRouter();

    // Pour stocker l'utilisateurs utilisé actuellement
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
    const loadUserData = async () => {
        try {
            const storedUser = await AsyncStorage.getItem("current_user");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Erreur lors du chargement des données utilisateur :", error);
        }
    };

    loadUserData();
}, []);

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

    const animTop = useRef(new Animated.Value(isDarkMode ? 2 : 28)).current;
    useEffect(() => {
        Animated.timing(animTop, {
            toValue: isDarkMode ? 0 : 42,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [isDarkMode]);

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
                            <Animated.View style={[styles.toggleThumb, { backgroundColor: theme.MainTextWhite, top: animTop }]}/>

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
                    {/* USERNAME */}
                    <ThemedText style={[styles.nameText, { color: theme.MainTextBlack }]}>{user ? user.id : "Invité"}</ThemedText>

                    {/* USER INFO */}
                    <ThemedText style={[styles.sectionTitle, { color: theme.MainTextBlack }]}>
                        Mes informations
                    </ThemedText>

                    {/* VILLE */}
                    <ThemedText style={[styles.infoTextGrey, { color: theme.textSecondary} ]}>
                        Vous habitez à :
                    </ThemedText>
                    <ThemedText style={[styles.infoText, { color: theme.MainTextBlack} ]}>
                        {user ? user.city : "Ville ?"}
                    </ThemedText>

                    {/* MAIL */}
                    <ThemedText style={[styles.infoTextGrey, { color: theme.textSecondary} ]}>
                        Votre mail d'inscription :
                    </ThemedText>
                    <ThemedText style={[styles.infoText, { color: theme.MainTextBlack} ]}>
                        {user ? user.mail : "Mail ?"}
                    </ThemedText>
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
        height: 260,
        width: "100%",
        zIndex: 2,
    },
    actionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
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
        width: 40,
        height: 84,
        borderRadius: 20,
        padding: 10,
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
        width: 40,
        height: 42,
        borderRadius: 20,
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
        width: 180,
        height: 180,
        borderRadius: 95,
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

    sectionTitle: {
        fontSize: 24,
        fontWeight: FontWeight.Bold,
        textAlign: "center",
        marginTop: 35,
        marginBottom: 15,
        letterSpacing: 0.3,
    },
    infoText: {
        fontSize: 20,
        fontWeight: FontWeight.SemiBold,
        textAlign: "center",
        marginVertical: 8,
        letterSpacing: 0.5,
    },
    infoTextGrey: {
        fontSize: 16,
        fontWeight: FontWeight.Medium,
        textAlign: "left",
        marginTop: 20,
    },
});
