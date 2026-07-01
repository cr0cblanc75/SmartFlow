import { ReactNode } from "react";
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutLeft, SlideInLeft, SlideOutRight, SlideInUp, SlideOutUp, SlideOutDown, ZoomIn, ZoomOut, BounceIn, BounceOut, FlipInYRight, FlipOutYLeft, FlipInEasyX, FlipOutEasyX, SlideInDown } from "react-native-reanimated";

type AnimationType = "fade" | "slide-horizontal" | "slide-horizontal-reverse" | "slide-vertical" | "slide-from-bottom" | "slide-from-top" | "zoom" | "bounce" | "flip-x" | "flip-y";

interface AnimatedScreenProps {
    children: ReactNode;
    duration?: number;
    type?: AnimationType;
}

export function AnimatedScreen({ children, duration = 300, type = "fade" }: AnimatedScreenProps) {
    let entering;
    let exiting;

    switch (type) {
        case "slide-horizontal":
            entering = SlideInRight.duration(duration);
            exiting = SlideOutLeft.duration(duration);
            break;

        case "slide-horizontal-reverse":
            entering = SlideInLeft.duration(duration);
            exiting = SlideOutRight.duration(duration);
            break;

        case "slide-vertical":
            entering = SlideInUp.duration(duration);
            exiting = SlideOutDown.duration(duration);
            break;

        case "slide-from-bottom":
            entering = SlideInDown.duration(duration);
            exiting = SlideOutDown.duration(duration);
            break;

        case "slide-from-top":
            entering = SlideInUp.duration(duration);
            exiting = SlideOutUp.duration(duration);
            break;

        case "zoom":
            entering = ZoomIn.duration(duration);
            exiting = ZoomOut.duration(duration);
            break;

        case "bounce":
            entering = BounceIn.duration(duration);
            exiting = BounceOut.duration(duration);
            break;

        case "flip-x":
            entering = FlipInEasyX.duration(duration);
            exiting = FlipOutEasyX.duration(duration);
            break;

        case "flip-y":
            entering = FlipInYRight.duration(duration);
            exiting = FlipOutYLeft.duration(duration);
            break;

        default:
            entering = FadeIn.duration(duration);
            exiting = FadeOut.duration(duration);
    }

    return (
        <Animated.View entering={entering} exiting={exiting} style={{ flex: 1 }} pointerEvents="box-none">
            {children}
        </Animated.View>
    );
}
