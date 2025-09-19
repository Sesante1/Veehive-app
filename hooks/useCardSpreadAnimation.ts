import { useSharedValue } from 'react-native-reanimated';
import { Easing, withTiming, withDelay } from 'react-native-reanimated';
import { useState, useCallback } from 'react';

export const useCardSpreadAnimation = () => {
  const [isSpread, setIsSpread] = useState(false);

  // Shared values for card spreading animation
  const leftTranslateX = useSharedValue(0);
  const rightTranslateX = useSharedValue(0);
  const leftRotation = useSharedValue(0);
  const rightRotation = useSharedValue(0);
  const centerScale = useSharedValue(1);
  const leftScale = useSharedValue(1);
  const rightScale = useSharedValue(1);

  // Animation configuration
  const animationConfig = {
    duration: 800,
    easing: Easing.out(Easing.cubic),
  };

  // Spread cards animation
  const spreadCards = useCallback(() => {
    setIsSpread(true);
    
    // Animate left card
    leftTranslateX.value = withTiming(-80, animationConfig);
    leftRotation.value = withTiming(-15, animationConfig);
    leftScale.value = withTiming(0.9, animationConfig);
    
    // Animate right card with slight delay
    rightTranslateX.value = withDelay(100, withTiming(80, animationConfig));
    rightRotation.value = withDelay(100, withTiming(15, animationConfig));
    rightScale.value = withDelay(100, withTiming(0.9, animationConfig));
    
    // Slightly scale up center card
    centerScale.value = withTiming(1.05, animationConfig);
  }, [leftTranslateX, rightTranslateX, leftRotation, rightRotation, centerScale, leftScale, rightScale, animationConfig]);

  // Collapse cards animation
  const collapseCards = useCallback(() => {
    setIsSpread(false);
    
    // Reset all animations
    leftTranslateX.value = withTiming(0, animationConfig);
    rightTranslateX.value = withTiming(0, animationConfig);
    leftRotation.value = withTiming(0, animationConfig);
    rightRotation.value = withTiming(0, animationConfig);
    centerScale.value = withTiming(1, animationConfig);
    leftScale.value = withTiming(1, animationConfig);
    rightScale.value = withTiming(1, animationConfig);
  }, [leftTranslateX, rightTranslateX, leftRotation, rightRotation, centerScale, leftScale, rightScale, animationConfig]);

  // Toggle spread state
  const toggleSpread = useCallback(() => {
    if (isSpread) {
      collapseCards();
    } else {
      spreadCards();
    }
  }, [isSpread, spreadCards, collapseCards]);

  return {
    isSpread,
    spreadCards,
    collapseCards,
    toggleSpread,
    leftTranslateX,
    rightTranslateX,
    leftRotation,
    rightRotation,
    centerScale,
    leftScale,
    rightScale,
  };
};