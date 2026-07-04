import { View, StyleSheet, Pressable } from "react-native";
import { ThemedText } from "../themed-text";
import { Spacing, FontWeight } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import Bus_Icon from "@/assets/Bus_Icon.svg";
import Train_Icon from "@/assets/Train_Icon.svg";

import DashLine from "@/assets/DashLine.svg";

type PathFrameProps = {
    mode: "metro" | "bus" | "train";
    label: string;
    stopStation?: string;
    isLast?: boolean;
};

export function PathFrame({ mode, label, stopStation = "<station>", isLast }: PathFrameProps) {
    const theme = useTheme();

    const metroColors: Record<string, string> = {
        M1: "#FFCD00",
        M2: "#003CA6",
        M3: "#837902",
        M3b: "#6EC4E8",
        M4: "#C04191",
        M5: "#FF7E2E",
        M6: "#6ECA97",
        M7: "#FA9ABA",
        M7b: "#6ECA97",
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

    const metroTerminus: Record<string, string[]> = {
        M1: ["La Défense", "La Défense (Grande Arche)", "Château de Vincennes", "Hôtel de Ville"],

        M2: ["Porte Dauphine (Maréchal de Lattre de Tassigny)", "Nation"],

        M3: ["Pont de Levallois-Bécon", "Gallieni (Parc de Bagnolet)"],

        M3b: ["Gambetta", "Porte des Lilas"],

        M4: ["Bagneux - Lucie Aubrac", "Porte de Clignancourt"],

        M5: ["Bobigny - Pablo Picasso", "Place d'Italie"],

        M6: ["Charles de Gaulle - Étoile", "Nation"],

        M7: ["La Courneuve-8-Mai-1945", "Villejuif-Louis Aragon", "Mairie d’Ivry"],

        M7b: ["Louis Blanc", "Pré-Saint-Gervais"],

        M8: ["Balard", "Créteil-Pointe du Lac"],

        M9: ["Pont de Sèvres", "Mairie de Montreuil"],

        M10: ["Boulogne Pont de Saint-Cloud", "Gare d'Austerlitz"],

        M11: ["Châtelet", "Rosny-Bois-Perrier"],

        M12: ["Mairie d'Issy", "Mairie d'Aubervilliers"],

        M13: ["Châtillon Montrouge", "Saint-Denis-Université", "Asnières-Gennevilliers Les Courtilles"],

        M14: ["Saint-Denis - Pleyel", "Aéroport d'Orly"],
    };
    const getMetroLine = (station: string) => {
        for (const line in metroTerminus) {
            if (metroTerminus[line].includes(station)) {
                return line;
            }
        }
        return "unknown";
    };

    const labelM = getMetroLine(label);
    console.log(label, labelM);

    const renderLeftIcon = () => {
        if (mode === "metro") {
            return (
                <View style={[styles.metroIcon, { backgroundColor: bgColor }]}>
                    <ThemedText style={[styles.metroTextIcon, { color: theme.MainTextBlack }]}>{labelM}</ThemedText>
                </View>
            );
        }

        if (mode === "bus") {
            return <Bus_Icon width={40} height={35} />;
        }

        if (mode === "train") {
            return <Train_Icon width={40} height={35} />;
        }

        return null;
    };

    const isMetro = mode === "metro";
    const bgColor = isMetro ? (metroColors[labelM] ?? "#000") : "#2D2D2D";

    return (
        <View style={styles.contentFrame}>
            {/* LEFT */}
            <View style={styles.visualizerFrame}>
                {renderLeftIcon()}
                {!isLast && <DashLine height={25} width={2} preserveAspectRatio="xMidYMid meet" />}
            </View>

            {/* RIGHT */}
            <View style={styles.textFrame}>
                {isMetro ? (
                    <ThemedText style={[styles.metroText, { color: theme.MainTextBlack }]}>Direction {label}</ThemedText>
                ) : (
                    <ThemedText style={[styles.metroText, { color: theme.MainTextBlack }]}>
                        {"Ligne →"} {label}
                    </ThemedText>
                )}

                <ThemedText style={[styles.stopAt_Text, { color: theme.MainTextBlack }]}>Stop à :</ThemedText>
                <ThemedText style={[styles.stationText, { color: theme.MainTextBlack }]}>{stopStation}</ThemedText>
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
        maxWidth: 35,
        maxHeight: 35,
    },

    // ------------------- Right Box -------------------

    textFrame: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        gap: 6,

        paddingRight: Spacing.five,
    },

    metroText: {
        fontWeight: FontWeight.Bold,
        fontSize: 16,
        lineHeight: 18,
    },

    stopAt_Text: {
        fontWeight: FontWeight.SemiBold,
        fontSize: 14,
        lineHeight: 14,
    },

    stationText: {
        width: "100%",
        textAlign: "right",

        fontWeight: FontWeight.Bold,
        fontSize: 15,
        lineHeight: 18,
    },
});
