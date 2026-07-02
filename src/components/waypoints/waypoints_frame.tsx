import Ping from "@/assets/Ping.svg";
import { StyleSheet, Pressable } from "react-native";
import { ThemedText } from "../themed-text";
import { Spacing, FontWeight } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type WaypointsFrameProps = {
    name?: string;
    onPress: () => void;
};

export function WaypointsFrame({ name = "Waypoint name Not Found", onPress }: WaypointsFrameProps) {
    const theme = useTheme();

    return (
        <Pressable style={[styles.Frame, { backgroundColor: theme.MainBackground100 }]} onPress={onPress}>
            <Ping width={20} height={25} preserveAspectRatio="xMidYMid meet" />
            <ThemedText style={[styles.Name, { color: theme.MainTextBlack }]}>{name}</ThemedText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    Frame: {
        width: "100%",

        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,

        padding: Spacing.three,

        borderRadius: 12,
    },

    Name: {
        fontWeight: FontWeight.Bold,
        fontSize: 16,
    },
});
