/**
 * Text and TextInput that use the Figtree font.
 *
 * Android cannot pick a font file from `fontWeight`, so the weight in a style
 * is turned into the matching Figtree file here. Screens import Text from this
 * file instead of from react-native.
 */
import React from 'react';
import { Text as RNText, TextInput as RNTextInput, StyleSheet, TextInputProps, TextProps, TextStyle } from 'react-native';
import { colors, fonts } from '../theme';

function family(style: TextStyle | undefined): string {
  if (style?.fontFamily) {
    return style.fontFamily;
  }
  switch (String(style?.fontWeight ?? '400')) {
    case '800':
    case '900':
      return fonts.extrabold;
    case '700':
    case 'bold':
      return fonts.bold;
    case '500':
    case '600':
      return fonts.semibold;
    default:
      return fonts.regular;
  }
}

export function Text({ style, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style);
  return <RNText {...rest} style={[base.text, style, { fontFamily: family(flat), fontWeight: 'normal' }]} />;
}

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(({ style, ...rest }, ref) => {
  const flat = StyleSheet.flatten(style);
  return <RNTextInput ref={ref} {...rest} style={[base.text, style, { fontFamily: family(flat), fontWeight: 'normal' }]} />;
});

const base = StyleSheet.create({ text: { color: colors.text } });
