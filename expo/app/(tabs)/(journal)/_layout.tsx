import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function JournalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background, paddingBottom: 44 },
      }}
    />
  );
}
