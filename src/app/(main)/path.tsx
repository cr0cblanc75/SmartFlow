import { useState, useRef, useEffect } from "react";

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
import HandiButton from "@/assets/Handi_Icon.svg";

import { PathFrame } from "@/components/path/path";

import { AnimatedScreen } from "@/components/AnimatedScreen";
import Map, { MapRef } from "@/leaflet/leaflet";
import { ThemedText } from "@/components/themed-text";

import { mainClc } from "../../../scripts/back_path";
import graph from "../../../scripts/graph.json";
import timetable from "../../../scripts/timetable.json";

type Step =
    | {
          type: "transport";
          mode: "metro" | "bus";
          line: string;
          from: string;
          to: string;
      }
    | {
          type: "correspondance";
          duration: string;
          from: string;
          to: string;
      };

type PathResult = {
    elapsed: number;
    from: string;
    to: string;
    departureTime: string;
    arrivalTime: string;
    totalDuration: string;
    nbCorrespondances: number;
    nbStops: number;
    steps: Step[];
};

function buildPathFrames(steps: Step[]) {
    const transports = steps.filter((s): s is Extract<Step, { type: "transport" }> => s.type === "transport");

    return transports.map((step, index) => {
        const isLast = index === transports.length - 1;

        return {
            mode: step.mode,
            label: step.line,
            stopStation: step.to,
            isLast,
        };
    });
}

export default function PathScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { Depart, Arrivee, timeDep, timeArr, wheelchair } = useLocalSearchParams<{
        Depart: string;
        Arrivee: string;
        timeDep: string;
        timeArr?: string;
        wheelchair: string;
    }>();

    const [pathFinded, setPathFinded] = useState<PathResult | any>(null);
    const [TimeDepString, setTimeDepString] = useState("...");
    const [TimeArrString, setTimeArrString] = useState("...");

    /* LA FONCTION QUI PERMET DE LANCER L'ALGO DE RECHERCHE DE CHEMIN */
    useEffect(() => {
        if (!Depart || !Arrivee || !timeDep) return;

        const formatedTimeDep = formatParisTime(new Date(timeDep as string));
        const formatedTimeArr = timeArr ? formatParisTime(new Date(timeArr as string)) : formatedTimeDep;

        setTimeDepString(formatedTimeDep);

        const res = mainClc({
            graph,
            timetable,
            fromName: Depart,
            toName: Arrivee,
            departureTime: formatedTimeDep,
            arrivalTime: formatedTimeDep === formatedTimeArr ? null : formatedTimeArr,
            wheelchair: wheelchair === "true",
            debug: true,
        });

        if (res == null) {
            //console.log("No path");
            setPathFinded(0);
            return;
        }
        // Basculer à "true" si vous voulez le résultat terminal
        if (false) {
            console.log(">>>> NEW RESULT >>>>");
            res?.steps.forEach((step, index) => {
                console.log(`[${index}]`, step);
            });
        }

        setTimeArrString(res?.arrivalTime?.slice(0, 5) ?? "...");
        setPathFinded(res);
    }, [Depart, Arrivee, timeDep, timeArr]);

    const formatParisTime = (date: Date) => {
        return date.toLocaleTimeString("fr-FR", {
            timeZone: "Europe/Paris",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const ETAco2 = "203,5g";
    const ETAtime = pathFinded === 0 ? "Pas de chemin" : (pathFinded?.totalDuration ?? "chargement ...");
    const frames = pathFinded ? buildPathFrames(pathFinded.steps) : [];

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
                            <View style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ display: "flex", flex: 1, justifyContent: "center", alignItems: "center" }}>
                                    <View style={styles.recapDestinationTop}>
                                        <ThemedText style={[styles.recapDestinationText, { color: theme.MainTextBlack }]}>de </ThemedText>
                                        <ThemedText style={[styles.recapDestinationTime, { color: theme.MainTextBlack }]}>{Depart}</ThemedText>
                                        <ThemedText style={[styles.recapDestinationText, { color: theme.MainTextBlack }]}> à </ThemedText>
                                        <ThemedText style={[styles.recapDestinationTime, { color: theme.MainTextBlack }]}>{Arrivee}</ThemedText>
                                    </View>
                                </ScrollView>

                                <View style={[styles.recapDestinationBottom, { borderBottomColor: theme.MainTextBlack }]}>
                                    <View style={{ display: "flex", flexDirection: "row" }}>
                                        <ThemedText style={[styles.recapDestinationText, { color: theme.MainTextBlack }]}>Départ </ThemedText>
                                        <ThemedText style={[styles.recapDestinationTime, { color: theme.MainTextBlack }]}> {TimeDepString}</ThemedText>
                                    </View>
                                    {wheelchair === "true" ? <HandiButton width={25} height={25} color={theme.MainTextBlack} preserveAspectRatio="xMidYMid meet" /> : <></>}
                                    <View style={{ display: "flex", flexDirection: "row" }}>
                                        <ThemedText style={[styles.recapDestinationText, { color: theme.MainTextBlack }]}> Arrivé à</ThemedText>
                                        <ThemedText style={[styles.recapDestinationTime, { color: theme.MainTextBlack }]}> {TimeArrString}</ThemedText>
                                    </View>
                                </View>
                            </View>
                            {frames.map((frame, index) => (
                                <PathFrame key={index} mode={frame.mode} label={frame.label} stopStation={frame.stopStation} isLast={frame.isLast} />
                            ))}
                            {/*
                            <PathFrame metro={"M7"} stopStation="Station A" />
                            <PathFrame bus={"B.47"} stopStation="Station Bus" />
                            <PathFrame metro={"M14"} stopStation="Station B" />
                            <PathFrame metro={"M3bis"} stopStation="Station C" isLast={true} />*/}
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
        paddingRight: Spacing.three,
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

    recapDestinationTop: {
        display: "flex",
        flexDirection: "row",

        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
    },

    recapDestinationBottom: {
        flex: 1,

        display: "flex",
        flexDirection: "row",

        justifyContent: "space-between",
        alignItems: "flex-start",

        paddingBottom: 8,
        borderBottomWidth: 1.5,
    },

    recapDestinationText: {
        fontSize: 14,
        fontWeight: FontWeight.Medium,

        flexShrink: 1,
    },

    recapDestinationTime: {
        fontSize: 14,
        fontWeight: FontWeight.Bold,

        textTransform: "uppercase",
    },

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
