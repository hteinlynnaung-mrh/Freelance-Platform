import React from 'react';
import { View } from 'react-native';

interface ArcherMarkProps {
  size?: number;
}

export function ArcherMark({ size = 52 }: ArcherMarkProps) {
  const radius = size * 0.27;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Archer logo"
      style={{ width: size, height: size }}
    >
      <View style={[styles.tile, { borderRadius: radius }]} />
      <View style={[styles.bow, { left: size * 0.27, top: size * 0.22, width: size * 0.46, height: size * 0.56, borderRadius: size }]} />
      <View style={[styles.arrow, { left: size * 0.2, top: size * 0.57, width: size * 0.58, transform: [{ rotate: '-39deg' }] }]} />
      <View style={[styles.arrowhead, { left: size * 0.66, top: size * 0.25, width: size * 0.16, transform: [{ rotate: '-39deg' }] }]} />
      <View style={[styles.arrowhead, { left: size * 0.7, top: size * 0.32, width: size * 0.16, transform: [{ rotate: '51deg' }] }]} />
      <View style={[styles.feather, { left: size * 0.2, top: size * 0.59, width: size * 0.12, transform: [{ rotate: '11deg' }] }]} />
    </View>
  );
}

const styles = {
  tile: { ...({ position: 'absolute' as const, inset: 0, backgroundColor: '#10241f' }) },
  bow: { ...({ position: 'absolute' as const, borderWidth: 2.5, borderColor: '#d8f36a', borderLeftColor: 'transparent' }) },
  arrow: { ...({ position: 'absolute' as const, height: 2.5, backgroundColor: '#f5f7f2', borderRadius: 2 }) },
  arrowhead: { ...({ position: 'absolute' as const, height: 2, backgroundColor: '#d8f36a', borderRadius: 2 }) },
  feather: { ...({ position: 'absolute' as const, height: 2, backgroundColor: '#f5f7f2', borderRadius: 2 }) },
};
