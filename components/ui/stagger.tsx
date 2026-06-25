import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type StaggerProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
};

export default function Stagger({
  children,
  delay = 90,
  duration = 420,
  translateY = 10,
}: StaggerProps) {
  const items = React.Children.toArray(children);
  const anims = useRef(items.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    anims.forEach((value) => value.setValue(0));

    const sequence = Animated.stagger(
      delay,
      anims.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      )
    );

    sequence.start();

    return () => sequence.stop();
  }, [anims, delay, duration]);

  return (
    <>
      {items.map((child, index) => {
        const value = anims[index];

        return (
          <Animated.View
            key={index}
            style={{
              opacity: value,
              transform: [
                {
                  translateY: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [translateY, 0],
                  }),
                },
              ],
            }}
          >
            {child}
          </Animated.View>
        );
      })}
    </>
  );
}
