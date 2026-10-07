/**
 * Finger signature pad. The parent reads the drawing as a PNG (base64) with
 * `toPng()` so it can be saved to the Job's Files.
 */
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { colors, radius } from '../theme';

export interface SignaturePadHandle {
  clear: () => void;
  toPng: () => Promise<string>;
}

interface Props {
  onChange: (isEmpty: boolean) => void;
}

const HEIGHT = 170;

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(({ onChange }, ref) => {
  const viewRef = useRef<View>(null);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [width, setWidth] = useState(0);
  const current = useRef('');

  const pt = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Keep the gesture so the surrounding ScrollView does not scroll while signing.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: e => {
          const { locationX, locationY } = e.nativeEvent;
          current.current = `M${pt(locationX, locationY)} L${pt(locationX, locationY)}`;
          setStrokes(s => [...s, current.current]);
        },
        onPanResponderMove: e => {
          const { locationX, locationY } = e.nativeEvent;
          current.current += ` L${pt(locationX, locationY)}`;
          setStrokes(s => [...s.slice(0, -1), current.current]);
        },
        onPanResponderRelease: () => onChange(false),
      }),
    [onChange],
  );

  useImperativeHandle(ref, () => ({
    clear: () => {
      setStrokes([]);
      onChange(true);
    },
    toPng: () => captureRef(viewRef, { format: 'png', result: 'base64' }),
  }));

  return (
    <View
      ref={viewRef}
      collapsable={false}
      style={styles.pad}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      accessibilityLabel="Signature pad, sign with your finger"
      {...responder.panHandlers}>
      <Svg width={width} height={HEIGHT} pointerEvents="none">
        <Line x1={20} y1={130} x2={Math.max(width - 20, 20)} y2={130} stroke={colors.borderInput} strokeWidth={1.5} />
        {strokes.map((d, i) => (
          <Path key={i} d={d} fill="none" stroke={colors.text} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
    </View>
  );
});

const styles = StyleSheet.create({
  pad: {
    height: HEIGHT,
    borderRadius: radius,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
});
