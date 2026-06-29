import { Platform, StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { FontWeight, Spacing } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";

import { AnimatedScreen } from "@/components/AnimatedScreen";
import Map from "@/leaflet/leaflet";

export default function HomeScreen() {
    const theme = useTheme();
    const safeAreaInsets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <AnimatedScreen type="fade" duration={200}>
            {/* MAP */}
            <View style={StyleSheet.absoluteFill}>
                <Map />
            </View>

            {/* GREEN BOX OVERLAY */}
            <View style={[styles.bottomBox, {backgroundColor: "green", paddingBottom: safeAreaInsets.bottom + 10,},]}>
                <Pressable style={[styles.button, { backgroundColor: theme.ButtonBackground }]} onPress={() => router.push("/(main)/home_map")}>
                </Pressable>
            </View>
        </AnimatedScreen>
    );
}

const styles = StyleSheet.create({
    bottomBox: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,

        minHeight: 120,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,

        padding: Spacing.two,
        zIndex: 10,
        elevation: 10,
    },

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
});
