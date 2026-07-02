import { useRef, useState } from "react";

import { useLocalSearchParams } from "expo-router";

import { Platform, StyleSheet, View, ScrollView } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { FontWeight, Spacing } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";

import CO2Button from "@/assets/CO2_icon.svg";
import ClockButton from "@/assets/Clock.svg";
import RefreshButton from "@/assets/Refresh_icon.svg";

import { PathFrame } from "@/components/path/path";

import { AnimatedScreen } from "@/components/AnimatedScreen";
import Map, { MapRef } from "@/leaflet/leaflet";
import { ThemedText } from "@/components/themed-text";

export default function PathScreen() {
    const theme = useTheme();
    const router = useRouter();

    const ETAco2 = "203,5g";
    const ETAtime = "1h34";

    const formatParisTime = (date: Date) => {
        return date.toLocaleTimeString("fr-FR", {
            timeZone: "Europe/Paris",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const { Depart, Arrivee, timeDep, timeArr } = useLocalSearchParams();
    const depDate = new Date(timeDep as string);
    const arrDate = new Date(timeArr as string);
    const sameTime = formatParisTime(depDate) === formatParisTime(arrDate);

    const mapRef = useRef<MapRef>(null);

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
        <>
            {/* MAP */}
            <View style={StyleSheet.absoluteFill}>
                <Map ref={mapRef} />
            </View>

            {/* GREEN BOX OVERLAY */}
            <AnimatedScreen type="slide-from-bottom" duration={200}>
                <View style={[styles.bottomBox, { backgroundColor: theme.MainBackground200, paddingBottom: safeAreaInsets.bottom + 15 }]}>
                    {/* Destination displayer */}
                    <View style={styles.destinationDisplayer}>
                        {/* ---------- Upper ---------- */}
                        <View style={[styles.upperframeDestinationDisplayer, { backgroundColor: theme.MainBackground100, borderBottomColor: theme.BackgroundAwardCards }]}>
                            <View style={styles.upperFrame}>
                                {/* Départ */}
                                <View style={[styles.secondaryDownFrame, { paddingLeft: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two }]}>
                                    <CO2Button width={25} height={25} preserveAspectRatio="xMidYMid meet" />
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <ThemedText style={[styles.destinationText, { color: theme.MainTextBlack, letterSpacing: 2 }]}>{ETAco2}</ThemedText>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* ---------- Bottom --------- */}
                        <View style={[styles.downframeDestinationDisplayer, { backgroundColor: theme.MainBackground100 }]}>
                            <View style={styles.downFrame}>
                                {/* Arrivée */}
                                <View style={styles.secondaryDownFrame}>
                                    <ClockButton height={25} preserveAspectRatio="xMidYMid meet" color={theme.MainTextBlack} />
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <ThemedText style={[styles.destinationText, { color: theme.MainTextBlack, fontWeight: FontWeight.SemiBold, letterSpacing: 4 }]}>{ETAtime}</ThemedText>
                                    </View>
                                </View>

                                {/* REFRESH */}
                                <Pressable onPress={() => router.push("/(main)/waypoints")}>
                                    <View style={[styles.refreshFrame, { borderLeftColor: theme.BackgroundAwardCards }]}>
                                        <RefreshButton height={25} preserveAspectRatio="xMidYMid meet" color={theme.MainTextBlack} />
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <View style={styles.waypointDisplayerBigBox}>
                        <ScrollView contentContainerStyle={[styles.waypointFrame, { backgroundColor: theme.MainBackground100 }]} showsVerticalScrollIndicator={true}>
                            <PathFrame metro={"M7"} />
                            <PathFrame metro={"M14"} />
                            <PathFrame metro={"M3bis"} />
                        </ScrollView>
                    </View>
                </View>
            </AnimatedScreen>
        </>
    );
}

const styles = StyleSheet.create({
    // ------------------------- Whole displayer -------------------------
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
        paddingHorizontal: Spacing.five,
        zIndex: 10,
        elevation: 10,
    },

    // ------------------------- Destination displayer -------------------------
    destinationDisplayer: {
        width: 300,

        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        alignSelf: "center",
        gap: 0,

        position: "absolute",
        top: -50,

        zIndex: 9999,

        borderRadius: 12,

        // iOS shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 15,

        // Android shadow
        elevation: 6,
    },

    // -------- Upper Layer --------

    upperframeDestinationDisplayer: {
        width: "100%",

        display: "flex",
        flexDirection: "row",

        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,

        borderBottomWidth: 1,
    },

    upperFrame: {
        maxHeight: 43,
        width: "100%",

        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,

        alignItems: "center",
    },

    secondaryUpperFrame: {
        minWidth: 0,
        flex: 1,

        display: "flex",
        flexDirection: "row",
        gap: 10,

        paddingLeft: Spacing.three,
    },

    // -------- Down Layer --------

    downframeDestinationDisplayer: {
        width: "100%",

        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },

    downFrame: {
        maxHeight: 43,
        width: "100%",

        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,

        alignItems: "center",
    },

    secondaryDownFrame: {
        minWidth: 0,
        flex: 1,

        display: "flex",
        flexDirection: "row",
        gap: 10,

        paddingLeft: Spacing.three,
    },

    refreshFrame: {
        paddingHorizontal: Spacing.four,
        paddingVertical: Spacing.two,

        justifyContent: "center",

        borderLeftWidth: 1,
    },

    // -------- Inpufield Text --------

    destinationText: {
        flex: 1,
        minWidth: 0,
        maxWidth: "95%",

        fontWeight: FontWeight.Bold,
        fontSize: 16,
        paddingVertical: 0,
    },

    // ------------------------- Waypoints Box -------------------------

    waypointDisplayerBigBox: {
        flex: 1,
        maxHeight: 300,

        display: "flex",
        flexDirection: "column",
        gap: 10,

        paddingTop: 45,
    },

    waypointFrame: {
        display: "flex",
        flexDirection: "column",
        gap: 15,

        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.two,

        borderRadius: 6,
    },
});
