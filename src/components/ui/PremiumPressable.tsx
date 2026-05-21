import React, { useRef, useState } from 'react';
import { Animated, Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface PremiumPressableProps extends PressableProps {
    enableScale?: boolean;
    scaleTo?: number;
    containerStyle?: StyleProp<ViewStyle>;
    enableHover?: boolean; // Web-only hover effect
}

export const PremiumPressable: React.FC<PremiumPressableProps> = ({
    children,
    style,
    enableScale = true,
    scaleTo = 0.96,
    onPressIn,
    onPressOut,
    containerStyle,
    enableHover = true,
    ...props
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [isHovered, setIsHovered] = useState(false);

    const handlePressIn = (event: any) => {
        if (enableScale) {
            Animated.spring(scaleAnim, {
                toValue: scaleTo,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
            }).start();
        }
        onPressIn && onPressIn(event);
    };

    const handlePressOut = (event: any) => {
        if (enableScale) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                speed: 20,
                bounciness: 10,
            }).start();
        }
        onPressOut && onPressOut(event);
    };

    // Extract layout styles to apply to the container
    const getLayoutStyles = () => {
        if (!style) return null;
        let s = typeof style === 'function' ? style({
            pressed: false,
            focused: false,
            hovered: false
        } as any) : style;

        if (!s) return null;
        if (Array.isArray(s)) {
            s = Object.assign({}, ...s.filter(Boolean));
        }

        const layout: any = {};
        const layoutKeys = [
            'flex', 'flexGrow', 'flexShrink', 'flexBasis',
            'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
            'margin', 'marginHorizontal', 'marginVertical',
            'marginLeft', 'marginRight', 'marginTop', 'marginBottom',
            'position', 'top', 'bottom', 'left', 'right', 'zIndex',
            'alignSelf'
        ];

        layoutKeys.forEach(key => {
            const val = (s as any)[key];
            if (val !== undefined) layout[key] = val;
        });

        return layout;
    };

    // Web-specific hover props
    const webHoverProps = Platform.OS === 'web' && enableHover ? {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
    } : {};

    const hoverStyle = Platform.OS === 'web' && isHovered && !props.disabled ? {
        transform: [{ scale: scaleAnim }, { translateY: -1 }],
        opacity: 0.92,
    } : { transform: [{ scale: scaleAnim }] };

    return (
        <Animated.View
            style={[
                hoverStyle,
                getLayoutStyles(),
                containerStyle
            ]}
            {...(webHoverProps as any)}
        >
            <Pressable
                {...props}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={style}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};
