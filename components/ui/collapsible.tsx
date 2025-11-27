import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@react-navigation/elements';
import { ThemeProvider } from '@/contexts/theme-context'
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import { processFontWeight } from 'react-native-reanimated/lib/typescript/css/native';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { actualTheme } = useTheme();

  return (
    <ThemeProvider>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={Colors[actualTheme].icon}
          style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
        />

        <Text style={styles.text}>{title}</Text>
      </TouchableOpacity>
      {isOpen && (
        <ThemeProvider>
          <Text style={styles.content}>{children}</Text>
        </ThemeProvider>
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
  text: {
    fontWeight: "600"
  }
});