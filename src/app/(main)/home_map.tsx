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
import ClockButton from "@/assets/Clock.svg";

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
            <View style={[styles.bottomBox, { backgroundColor: "green", paddingBottom: safeAreaInsets.bottom + 10 }]}>
                <Pressable onPress={() => router.push("/(main)/home_map")}>
                    <HomeButton width={"100%"} height={25} preserveAspectRatio="xMidYMid meet" color={theme.MainTextWhite} />
                </Pressable>

                <Pressable onPress={() => router.push("/(main)/home_map")}>
                    <VectorButton width={"100%"} height={25} preserveAspectRatio="xMidYMid meet" color={theme.MainTextWhite} />
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
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,

        padding: Spacing.two,
        zIndex: 10,
        elevation: 10,
    },
});
