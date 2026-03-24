// template
import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: t('notFound.screenTitle') }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('notFound.message')}</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t('notFound.goHome')}</Text>
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
