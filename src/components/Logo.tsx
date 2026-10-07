import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';
import { colors, fonts } from '../theme';

const BODY = 'M28 70 Q28 40 60 37 Q83 35 89 52 L103 57 L89 62 Q86 86 58 88 Q36 89 28 70 Z';
const TAIL = 'M30 72 L13 62 L20 80 Z';

/** The bird with a check mark. `tile` draws it on the amber app-icon square. */
export function BirdMark({ size, tile }: { size: number; tile?: boolean }) {
  if (tile) {
    return (
      <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel="ServiceBird logo">
        <Rect width={120} height={120} rx={26} fill={colors.amber} />
        <Path d={TAIL} fill={colors.navy} />
        <Path d={BODY} fill={colors.navy} />
        <Circle cx={78} cy={50} r={3.6} fill={colors.amber} />
        <Polyline points="40,65 51,76 69,58" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  return (
    <Svg width={size * (96 / 58)} height={size} viewBox="10 32 96 58">
      <Path d={TAIL} fill={colors.amber} />
      <Path d={BODY} fill={colors.amber} />
      <Circle cx={78} cy={50} r={3.6} fill={colors.navy} />
      <Polyline points="40,65 51,76 69,58" fill="none" stroke={colors.navy} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** "servicebird" wordmark: white + amber, for navy backgrounds. */
export function Wordmark({ size }: { size: number }) {
  return (
    <Text style={{ fontFamily: fonts.extrabold, fontSize: size, letterSpacing: -0.03 * size }}>
      <Text style={{ color: '#FFFFFF' }}>service</Text>
      <Text style={{ color: colors.amber }}>bird</Text>
    </Text>
  );
}

/** Logo used in the header of My day. */
export function HeaderLogo() {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
      accessible
      accessibilityRole="header"
      accessibilityLabel="ServiceBird">
      <BirdMark size={30} />
      <Wordmark size={23} />
    </View>
  );
}
