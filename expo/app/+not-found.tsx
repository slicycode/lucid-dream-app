// template
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn&apos;t exist.</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.cardPadding,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: typography.subheading.fontSize,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  link: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  linkText: {
    fontSize: typography.caption.fontSize,
    color: colors.accent,
  },
});
