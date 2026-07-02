import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "../themed-text";
import { Spacing, FontWeight } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import DashLine from "@/assets/DashLine.svg";

type PathFrameProps = {
    metro?: "M1" | "M2" | "M3" | "M3bis" | "M4" | "M5" | "M6" | "M7" | "M7bis" | "M8" | "M9" | "M10" | "M11" | "M12" | "M13" | "M14" | "M15" | "M16";
};

export function PathFrame({ metro }: PathFrameProps) {
    const theme = useTheme();

    const metroColors: { [key: string]: string } = {
        M1: "#FFCD00",
        M2: "#003CA6",
        M3: "#837902",
        M3bis: "#6EC4E8",
        M4: "#C04191",
        M5: "#FF7E2E",
        M6: "#6ECA97",
        M7: "#FA9ABA",
        M7bis: "#6ECA97",
        M8: "#CEADD2",
        M9: "#B6BD00",
        M10: "#C9910D",
        M11: "#704B1C",
        M12: "#007852",
        M13: "#6EC4E8",
        M14: "#62259D",
        M15: "#A626AA",
        M16: "#D16BA5",
    };
    return (
        <View style={styles.contentFrame}>
            <View style={styles.visualizerFrame}>
                <View style={[styles.metroIcon, { backgroundColor: metroColors[metro ?? "M1"] }]}>
                    <ThemedText style={[styles.metroTextIcon, { color: theme.MainTextBlack }]}>{metro}</ThemedText>
                </View>
                <DashLine height={25} width={2} preserveAspectRatio="xMidYMid meet" />
            </View>
            <View>
                <ThemedText style={[styles.metroText, { color: theme.MainTextBlack }]}>Ligne {metro}</ThemedText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    contentFrame: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
    },

    // ------------------- Left Box -------------------

    visualizerFrame: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 4,
    },

    metroIcon: {
        width: "100%",
        height: "auto",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        paddingVertical: Spacing.two,
        paddingHorizontal: Spacing.two,

        borderRadius: 100,
    },

    metroTextIcon: {
        fontWeight: FontWeight.Bold,
        fontSize: 16,
    },

    // ------------------- Right Box -------------------

    metroText: {
        fontWeight: FontWeight.Bold,
        fontSize: 16,
    },
});
