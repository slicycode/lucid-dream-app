import React, { useEffect, useRef, memo, Children } from 'react';
import { Animated, View, ViewStyle } from 'react-native';

interface StaggerChildrenProps {
  children: React.ReactNode;
  /** Ms between each child entry (default 60) */
  stagger?: number;
  /** Ms before first child starts (default 100) */
  initialDelay?: number;
  /** Vertical slide distance in px (default 12) */
  distance?: number;
  style?: ViewStyle;
  /** Unique key to re-trigger the animation */
  triggerKey?: string | number;
}

/**
 * Wraps each child in a fade-in-slide-up animation with staggered delay.
 * Gives quiz options and feature cards a cascading entrance.
 */
function StaggerChildrenInner({
  children,
  stagger = 60,
  initialDelay = 100,
  distance = 12,
  style,
  triggerKey,
}: StaggerChildrenProps) {
  const childArray = Children.toArray(children);
  const anims = useRef(childArray.map(() => new Animated.Value(0))).current;

  // Ensure we have enough animated values
  while (anims.length < childArray.length) {
    anims.push(new Animated.Value(0));
  }

  useEffect(() => {
    anims.forEach((a) => a.setValue(0));

    const animations = childArray.map((_, i) =>
      Animated.spring(anims[i], {
        toValue: 1,
        damping: 18,
        stiffness: 200,
        mass: 0.9,
        delay: initialDelay + i * stagger,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start();
  }, [triggerKey]);

  return (
    <View style={style}>
      {childArray.map((child, i) => (
        <Animated.View
          key={i}
          style={{
            opacity: anims[i],
            transform: [
              {
                translateY: anims[i].interpolate({
                  inputRange: [0, 1],
                  outputRange: [distance, 0],
                }),
              },
            ],
          }}
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
}

export const StaggerChildren = memo(StaggerChildrenInner);
