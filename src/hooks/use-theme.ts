/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useCustomTheme } from '@/hooks/themeContext';

export function useTheme() {
  const { themeMode } = useCustomTheme(); 

  return Colors[themeMode];
}
