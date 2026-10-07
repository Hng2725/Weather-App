import React from 'react';
import AntDesign, {
  type AntDesignIconName,
} from '@react-native-vector-icons/ant-design/static';
import type {StyleProp, TextStyle} from 'react-native';
import {colors} from '../theme/colors';

type Props = {
  name: AntDesignIconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<TextStyle>;
};

const AppIcon = ({
  name,
  size = 22,
  color = colors.primary,
  accessibilityLabel,
  testID,
  style,
}: Props) => (
  <AntDesign
    accessibilityLabel={accessibilityLabel}
    accessibilityRole={'image'}
    color={color}
    name={name}
    size={size}
    style={style}
    testID={testID}
  />
);

export type {AntDesignIconName};
export default AppIcon;
