import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { FontWeight, Spacing } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";

import HomeButton from "@/assets/Home_Button.svg";
import VectorButton from "@/assets/Vector.svg";
import LightningButton from "@/assets/Lightning.svg";
import ProfileButton from "@/assets/Profile.svg";
import LogoNavbar from "@/assets/Logo-NavBar.svg";
import StarIcon from "@/assets/Star Icon.svg";
import ClockButton from "@/assets/Clock.svg";

import { AnimatedScreen } from "@/components/AnimatedScreen";
import Map from "@/leaflet/leaflet";
import { ThemedText } from "@/components/themed-text";

export default function HomeScreen() {
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
            {/* MAP */}
            <View style={StyleSheet.absoluteFill}>
                <Map />
            </View>

            {/* GREEN BOX OVERLAY */}
            <View style={[styles.bottomBox, { backgroundColor: theme.MainBackground200, paddingBottom: safeAreaInsets.bottom + 30 }]}>
                {/* Destination displayer */}
                <View style={styles.destinationDisplayer}>
                    {/* Upper */}
                    <View style={[styles.upperframeDestinationDisplayer, { backgroundColor: theme.MainBackground100, borderBottomColor: theme.BackgroundAwardCards }]}>
                        <View style={styles.upperFrame}>
                            <LogoNavbar height={25} preserveAspectRatio="xMidYMid meet" />
                            <ThemedText style={[styles.destinationText, { color: theme.MainTextBlack }]}>Prochaine destination ?</ThemedText>
                        </View>
                    </View>

                    {/* Bottom */}
                    <View style={[styles.downframeDestinationDisplayer, { backgroundColor: theme.MainBackground100, borderBottomColor: theme.BackgroundAwardCards }]}>
                        <View style={styles.downFrame}>
                            <StarIcon height={25} preserveAspectRatio="xMidYMid meet" />
                            <ThemedText style={[styles.destinationText, { color: theme.MainTextBlack }]}>Waypoints</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Button Menu displayer */}
                <View style={styles.buttonColumn}>
                    <View style={styles.column}>
                        <Pressable style={styles.button} onPress={() => router.push("/login")}>
                            <HomeButton width={"100%"} height={25} preserveAspectRatio="xMidYMid meet" color={theme.MainTextWhite} />
                        </Pressable>
                    </View>

                    <View style={styles.column}>
                        <Pressable style={styles.button} onPress={() => router.push("/(main)/home_map")}>
                            <VectorButton width={"100%"} height={25} preserveAspectRatio="xMidYMid meet" color={theme.MainTextWhite} />
                        </Pressable>
                    </View>

                    <View style={styles.column}>
                        <Pressable style={styles.button} onPress={() => router.push("/(main)/home_map")}>
                            <LightningButton width={"100%"} height={25} preserveAspectRatio="xMidYMid meet" color={theme.MainTextWhite} />
                        </Pressable>
                    </View>

                    <View style={styles.column}>
                        <Pressable style={styles.button} onPress={() => router.push("/(main)/home_map")}>
                            <ProfileButton width={"100%"} height={25} preserveAspectRatio="xMidYMid meet" color={theme.MainTextWhite} />
                        </Pressable>
                    </View>
                </View>
            </View>
        </AnimatedScreen>
    );
}

const styles = StyleSheet.create({
    // ------------------------- Button/Menu displayer -------------------------
    bottomBox: {
        position: "absolute",
        overflow: "visible",
        bottom: 0,
        left: 0,
        right: 0,

        minHeight: 120,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,

        padding: Spacing.two,
        zIndex: 10,
        elevation: 10,
    },

    column: {
        width: "25%",
        justifyContent: "center",
        alignItems: "center",
        margin: 0,
    },

    button: {
        width: "100%",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        margin: 0,
    },

    buttonColumn: {
        maxHeight: 20,
        width: "auto",
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        margin: 0,
        paddingTop: 60,
    },

    // ------------------------- Destination displayer -------------------------
    destinationDisplayer: {
        width: 300,
        height: 85,

        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        alignSelf: "center",
        gap: 0,

        position: "absolute",
        top: -40,

        zIndex: 9999,

        // iOS shadow
        shadowColor: "black",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.75,
        shadowRadius: 15,

        // Android shadow
        elevation: 8,
    },

    upperframeDestinationDisplayer: {
        width: "100%",

        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,

        borderBottomWidth: 1,
    },

    upperFrame: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        gap: 10,

        paddingLeft: Spacing.two,
        paddingRight: Spacing.two,
        paddingTop: Spacing.two,
        paddingBottom: Spacing.one,
    },

    downframeDestinationDisplayer: {
        width: "100%",

        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },

    downFrame: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        gap: 10,

        paddingLeft: Spacing.two,
        paddingRight: Spacing.two,
        paddingTop: Spacing.two,
        paddingBottom: Spacing.one,
    },

    destinationText: {
        fontWeight: FontWeight.Bold,
    },
});
