/** Small SLDS-style building blocks shared by the screens. */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cardShadow, colors, radius, touch } from '../theme';
import type { VisitStatus } from '../sf/serviceBird';
import { Icon, IconName } from './Icon';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel} accessibilityRole="header">{children}</Text>;
}

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'brand' | 'neutral';
  icon?: IconName;
  small?: boolean;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'brand', icon, small, disabled, busy, style }: ButtonProps) {
  const brand = variant === 'brand';
  const off = disabled || busy;
  const fg = off ? '#FFFFFF' : brand ? '#FFFFFF' : colors.brand;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        brand ? styles.btnBrand : styles.btnNeutral,
        pressed && (brand ? styles.btnBrandPressed : styles.pressed),
        off && styles.btnDisabled,
        small && styles.btnSmall,
        style,
      ]}>
      {busy ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={small ? 18 : 20} color={fg} strokeWidth={2.4} />}
          <Text style={[styles.btnText, small && styles.btnTextSmall, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.link} hitSlop={4}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const CHIP: Record<VisitStatus, { bg: string; fg: string }> = {
  Scheduled: { bg: colors.neutralBadge, fg: colors.text },
  'On Site': { bg: colors.warning, fg: colors.text },
  Done: { bg: colors.success, fg: '#FFFFFF' },
};

export function StatusChip({ status }: { status: VisitStatus }) {
  const c = CHIP[status] ?? CHIP.Scheduled;
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <Text style={[styles.chipText, { color: c.fg }]}>{status === 'On Site' ? 'On site' : status}</Text>
    </View>
  );
}

export function NextChip() {
  return (
    <View style={[styles.chip, styles.chipNext]}>
      <Text style={[styles.chipText, { color: colors.brand }]}>Next</Text>
    </View>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export function Input(props: TextInputProps) {
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.textWeak}
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={[styles.input, props.multiline && styles.textarea, focused && styles.inputFocus, props.style]}
    />
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.seg} accessibilityRole="radiogroup">
      {options.map((o, i) => {
        const on = o === value;
        return (
          <Pressable
            key={o}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o)}
            style={[
              styles.segBtn,
              i === 0 && styles.segFirst,
              i === options.length - 1 && styles.segLast,
              i > 0 && styles.segNotFirst,
              on && styles.segOn,
            ]}>
            <Text style={[styles.segText, on && styles.segTextOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stepper({ value, onChange, step }: { value: string; onChange: (v: string) => void; step: number }) {
  const bump = (dir: 1 | -1) => {
    const next = Math.max(0, Math.round(((parseFloat(value) || 0) + dir * step) * 100) / 100);
    onChange(String(next));
  };
  return (
    <View style={styles.step}>
      <Pressable accessibilityRole="button" accessibilityLabel="Decrease quantity" onPress={() => bump(-1)} style={styles.stepBtn}>
        <Icon name="minus" size={18} color={colors.brand} strokeWidth={2.6} />
      </Pressable>
      <TextInput
        accessibilityLabel="Quantity"
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChange}
        style={styles.stepInput}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Increase quantity" onPress={() => bump(1)} style={styles.stepBtn}>
        <Icon name="plus" size={18} color={colors.brand} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}

/** Bottom action bar that stays above the home indicator. */
export function Footer({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>{children}</View>;
}

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.brand} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && <Button label="Try again" variant="neutral" small onPress={onRetry} style={styles.retry} />}
    </View>
  );
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    ...cardShadow,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  btn: {
    minHeight: touch,
    borderRadius: radius,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  btnBrand: { backgroundColor: colors.brand, borderColor: colors.brand },
  btnBrandPressed: { backgroundColor: colors.brandDark, borderColor: colors.brandDark },
  btnNeutral: { backgroundColor: colors.surface, borderColor: colors.borderInput },
  btnDisabled: { backgroundColor: colors.borderInput, borderColor: colors.borderInput },
  btnSmall: { minHeight: 40, flexGrow: 0, alignSelf: 'flex-start' },
  btnText: { fontSize: 16 },
  btnTextSmall: { fontSize: 14 },
  pressed: { backgroundColor: colors.background },
  link: { minHeight: touch, justifyContent: 'center', paddingHorizontal: 4, alignSelf: 'flex-start' },
  linkText: { fontSize: 15, color: colors.brand },
  chip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  chipNext: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.brand },
  chipText: { fontSize: 12, fontWeight: '700', lineHeight: 18 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, color: colors.label },
  hint: { fontSize: 14, color: colors.textWeak },
  input: {
    minHeight: touch,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },
  textarea: { minHeight: 84, paddingTop: 10, textAlignVertical: 'top' },
  inputFocus: { borderColor: colors.focus },
  seg: { flexDirection: 'row' },
  segBtn: {
    flex: 1,
    height: touch,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segNotFirst: { marginLeft: -1 },
  segFirst: { borderTopLeftRadius: radius, borderBottomLeftRadius: radius },
  segLast: { borderTopRightRadius: radius, borderBottomRightRadius: radius },
  segOn: { backgroundColor: colors.brand, borderColor: colors.brand, zIndex: 1 },
  segText: { fontSize: 15, color: colors.brand },
  segTextOn: { color: '#FFFFFF' },
  step: {
    flexDirection: 'row',
    height: touch,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: radius,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  stepBtn: { width: touch, alignItems: 'center', justifyContent: 'center' },
  stepInput: {
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    fontSize: 16,
    color: colors.text,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.borderInput,
    padding: 0,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.background },
  errorText: { fontSize: 16, color: colors.error, textAlign: 'center' },
  retry: { marginTop: 16, alignSelf: 'center' },
  // Shared screen layout
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 12, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, minWidth: 0 },
  muted: { color: colors.textWeak },
  line: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  lineFirst: { borderTopWidth: 0, paddingTop: 0 },
  squareBtn: {
    width: touch,
    height: touch,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: radius,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbTag: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderInput,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    overflow: 'hidden',
  },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontSize: 15, color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  // Visit card on My day and Done
  vcard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...cardShadow,
  },
  vtime: { width: 52, gap: 2 },
  vstart: { fontSize: 17, fontWeight: '700', color: colors.text },
  vend: { fontSize: 13, color: colors.textWeak },
  vaccount: { fontSize: 17, fontWeight: '700', lineHeight: 21, color: colors.text },
  vtitle: { fontSize: 15, color: colors.text },
});
