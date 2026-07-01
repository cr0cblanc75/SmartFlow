import { useState } from "react";

import { Platform, StyleSheet, View, TextInput, ScrollView } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { FontWeight, Spacing } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "react-native";
import { useRouter } from "expo-router";

import DateTimePicker from "@react-native-community/datetimepicker";

import LogoNavbar from "@/assets/Logo-NavBar.svg";
import ClockButton from "@/assets/Clock.svg";

import { AnimatedScreen } from "@/components/AnimatedScreen";
import Map from "@/leaflet/leaflet";
import { ThemedText } from "@/components/themed-text";

export default function HomeScreen() {
    const theme = useTheme();
    const router = useRouter();
    const [Depart, setDepart] = useState("");
    const [Arrivee, setArrivee] = useState("");

    const [timeDep, setTimeDep] = useState(new Date());
    const [showDep, setShowDep] = useState(false);
    const [timeArr, setTimeArr] = useState(new Date());
    const [showArr, setShowArr] = useState(false);

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
                <Map />
            </View>

            {/* GREEN BOX OVERLAY */}
            <AnimatedScreen type="slide-from-bottom" duration={200}>
                <View style={[styles.bottomBox, { backgroundColor: theme.MainBackground200, paddingBottom: safeAreaInsets.bottom + 30 }]}>
                    {/* Destination displayer */}
                    <View style={styles.destinationDisplayer}>
                        {/* ---------- Upper ---------- */}
                        <View style={[styles.upperframeDestinationDisplayer, { backgroundColor: theme.MainBackground100, borderBottomColor: theme.BackgroundAwardCards }]}>
                            <View style={styles.upperFrame}>
                                {/* Départ */}
                                <View style={styles.secondaryDownFrame}>
                                    <LogoNavbar height={25} preserveAspectRatio="xMidYMid meet" />
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <TextInput style={[styles.destinationText, { color: theme.MainTextBlack }]} multiline={false} placeholder="Départ" placeholderTextColor={theme.TextBlackOpa60} value={Depart} onChangeText={(val) => setDepart(val)} />
                                    </View>
                                </View>
                                {/* CLOCK */}
                                <View style={[styles.clockFrame, { borderLeftColor: theme.BackgroundAwardCards }]}>
                                    <ClockButton height={25} preserveAspectRatio="xMidYMid meet" color={theme.MainTextBlack} />
                                </View>
                                {/* HOUR OVERLAY*/}
                                <View style={{ paddingRight: Spacing.three }}>
                                    {/* Heure */}
                                    <Pressable onPress={() => setShowDep(true)}>
                                        <ThemedText>
                                            {timeDep.getHours().toString().padStart(2, "0")}:{timeDep.getMinutes().toString().padStart(2, "0")}
                                        </ThemedText>
                                    </Pressable>

                                    {/* overlay hour-picker */}
                                    {showDep && (
                                        <DateTimePicker
                                            value={timeDep}
                                            mode="time"
                                            display="spinner"
                                            onChange={(event, selectedDate) => {
                                                if (event.type === "set" && selectedDate) {
                                                    setTimeDep(selectedDate);
                                                }
                                                setShowDep(false);
                                            }}
                                        />
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* ---------- Bottom --------- */}
                        <View style={[styles.downframeDestinationDisplayer, { backgroundColor: theme.MainBackground100 }]}>
                            <View style={styles.downFrame}>
                                {/* Arrivée */}
                                <View style={styles.secondaryDownFrame}>
                                    <LogoNavbar height={25} preserveAspectRatio="xMidYMid meet" />
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <TextInput style={[styles.destinationText, { color: theme.MainTextBlack }]} multiline={false} placeholder="Arrivée" placeholderTextColor={theme.TextBlackOpa60} value={Arrivee} onChangeText={(val) => setArrivee(val)} />
                                    </View>
                                </View>

                                {/* CLOCK */}
                                <View style={[styles.clockFrame, { borderLeftColor: theme.BackgroundAwardCards }]}>
                                    <ClockButton height={25} preserveAspectRatio="xMidYMid meet" color={theme.MainTextBlack} />
                                </View>
                                {/* HOUR OVERLAY*/}
                                <View style={{ paddingRight: Spacing.three }}>
                                    {/* Heure */}
                                    <Pressable onPress={() => setShowArr(true)}>
                                        <ThemedText>
                                            {timeArr.getHours().toString().padStart(2, "0")}:{timeArr.getMinutes().toString().padStart(2, "0")}
                                        </ThemedText>
                                    </Pressable>

                                    {/* overlay hour-picker */}
                                    {showArr && (
                                        <DateTimePicker
                                            value={timeArr}
                                            mode="time"
                                            display="spinner"
                                            onChange={(event, selectedDate) => {
                                                if (event.type === "set" && selectedDate) {
                                                    setTimeArr(selectedDate);
                                                }
                                                setShowArr(false);
                                            }}
                                        />
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    <ScrollView style={styles.waypointDisplayer} showsVerticalScrollIndicator={false}>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Medznu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Menu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Medznu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Mendzu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Medznu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Mdzenu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Medznu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Medznu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Mdzenu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Medznu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Menu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Medznu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Menu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Mdzenu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Menu</ThemedText>
                        <ThemedText style={{ color: theme.MainTextBlack, fontWeight: FontWeight.Bold, fontSize: 16, paddingVertical: 0 }}>Medznu</ThemedText>
                    </ScrollView>
                </View>
            </AnimatedScreen>
        </>
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

    clockFrame: {
        paddingLeft: Spacing.three,
        paddingTop: Spacing.two,
        paddingBottom: Spacing.two,

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

    waypointDisplayer: {
        width: "auto",
        maxHeight: 300,

        paddingTop: 60,
    },
});
