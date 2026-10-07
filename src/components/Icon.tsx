import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'back' | 'forward' | 'pin' | 'clock' | 'phone' | 'navigate'
  | 'check' | 'plus' | 'minus' | 'camera' | 'calendar';

interface Props {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

/** Stroke icons from the design, drawn on a 24x24 grid. */
export function Icon({ name, size = 20, color, strokeWidth = 2 }: Props) {
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'back' && <Path d="M15 18l-6-6 6-6" {...common} />}
      {name === 'forward' && <Path d="M9 18l6-6-6-6" {...common} />}
      {name === 'pin' && (
        <>
          <Path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" {...common} />
          <Circle cx="12" cy="9.5" r="2.5" {...common} />
        </>
      )}
      {name === 'clock' && (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M12 7v5l3 2" {...common} />
        </>
      )}
      {name === 'phone' && (
        <Path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" {...common} />
      )}
      {name === 'navigate' && <Path d="M3 11l18-8-8 18-2-8-8-2z" {...common} />}
      {name === 'check' && <Path d="M5 12l4.5 4.5L19 7" {...common} />}
      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...common} />}
      {name === 'minus' && <Path d="M5 12h14" {...common} />}
      {name === 'camera' && (
        <>
          <Rect x="3" y="6" width="18" height="14" rx="2" {...common} />
          <Circle cx="12" cy="13" r="3.5" {...common} />
          <Path d="M8 6l1.5-2h5L16 6" {...common} />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect x="3" y="5" width="18" height="16" rx="2" {...common} />
          <Path d="M3 10h18M8 3v4M16 3v4" {...common} />
        </>
      )}
    </Svg>
  );
}
