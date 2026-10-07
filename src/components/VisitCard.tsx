import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors } from '../theme';
import { time } from '../format';
import type { Visit } from '../sf/serviceBird';
import { Icon } from './Icon';
import { NextChip, StatusChip, styles } from './ui';

interface Props {
  visit: Visit;
  isNext?: boolean;
  showStatus?: boolean;
  onPress: () => void;
}

export function VisitCard({ visit, isNext, showStatus = true, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.vcard, pressed && styles.pressed]}>
      <View style={styles.vtime}>
        <Text style={styles.vstart}>{time(visit.start)}</Text>
        <Text style={styles.vend}>{time(visit.end)}</Text>
      </View>
      <View style={[styles.grow, { gap: 6 }]}>
        {showStatus && (
          <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
            <StatusChip status={visit.status} />
            {isNext && <NextChip />}
          </View>
        )}
        <Text style={styles.vaccount}>{visit.account}</Text>
        <Text style={styles.vtitle}>{visit.title}</Text>
        {!!visit.address && (
          <View style={[styles.row, { gap: 6 }]}>
            <Icon name="pin" size={15} color={colors.textWeak} />
            <Text style={[styles.muted, styles.grow, { fontSize: 14 }]} numberOfLines={1}>
              {visit.address}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
