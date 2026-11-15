import React, { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Card from '@/components/ui/card';
import PageHeader, { useHeaderCollapse } from '@/components/tools/page-header';
import Section from '@/components/ui/section';
import DetailSheet, { type DetailSheetHandle } from '@/components/tools/detail-sheet';
import DirectoryList from '@/components/tools/directory-list';
import { Colors, FontWeight, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/contexts/theme-context';
import clubsData from '@/assets/data/club.json';

interface Club {
  id: string;
  title: string;
  advisors: string;
  description: string;
  googleclasscode: string;
  meetinginfo: string;
}

const clubs: Club[] = clubsData as unknown as Club[];

function ClubRow({ club }: { club: Club }) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Card>
      <Text style={styles.rowTitle}>{club.title}</Text>
      <Text style={styles.rowAdvisors} numberOfLines={1}>
        {club.advisors}
      </Text>
      <Text style={styles.rowDescription} numberOfLines={3}>
        {club.description}
      </Text>
    </Card>
  );
}

function ClubDetailBody({ club }: { club: Club }) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const hasMeeting = club.meetinginfo && club.meetinginfo !== 'Unknown';
  const hasCode = Boolean(club.googleclasscode);

  return (
    <View style={styles.detailBody}>
      <Text style={styles.detailTitle}>{club.title}</Text>

      <Section title="About">
        <Text style={styles.bodyText}>{club.description}</Text>
      </Section>

      {hasMeeting && (
        <Section title="Meeting">
          <Text style={styles.bodyText}>{club.meetinginfo}</Text>
        </Section>
      )}

      <Section title="Advisors">
        <Text style={styles.bodyText}>{club.advisors}</Text>
      </Section>

      {hasCode && (
        <Section title="Google Classroom">
          <Text style={styles.codeText}>{club.googleclasscode}</Text>
        </Section>
      )}
    </View>
  );
}

export default function Clubs() {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  const styles = useMemo(() => createStyles(colors), [colors]);

  const detailRef = useRef<DetailSheetHandle>(null);
  const collapse = useHeaderCollapse();
  const [selected, setSelected] = useState<Club | null>(null);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.flex}>
        <PageHeader title="Clubs" collapse={collapse} />

        <DirectoryList<Club>
          data={clubs}
          keyExtractor={(c) => c.id}
          searchKeys={(c) => [c.title, c.advisors, c.description]}
          renderRow={(c) => <ClubRow club={c} />}
          onItemPress={(c) => {
            setSelected(c);
            detailRef.current?.present();
          }}
          title="Clubs"
          collapse={collapse}
          placeholder="Search clubs"
        />

        <DetailSheet ref={detailRef}>
          {selected ? <ClubDetailBody club={selected} /> : null}
        </DetailSheet>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: (typeof Colors)['light']) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    rowTitle: {
      fontSize: Type.heading.fontSize,
      fontWeight: Type.heading.fontWeight,
      letterSpacing: Type.heading.letterSpacing,
      color: colors.text,
    },
    rowAdvisors: {
      fontSize: Type.caption.fontSize,
      fontWeight: Type.caption.fontWeight,
      color: colors.mutedText,
    },
    rowDescription: {
      fontSize: Type.body.fontSize,
      fontWeight: Type.body.fontWeight,
      color: colors.mutedText,
      lineHeight: Type.body.fontSize * 1.5,
    },
    detailBody: {
      gap: Spacing.xl,
    },
    detailTitle: {
      fontSize: Type.title.fontSize,
      fontWeight: Type.title.fontWeight,
      letterSpacing: Type.title.letterSpacing,
      color: colors.text,
    },
    bodyText: {
      fontSize: Type.body.fontSize,
      fontWeight: Type.body.fontWeight,
      color: colors.mutedText,
      lineHeight: Type.body.fontSize * 1.6,
    },
    codeText: {
      fontSize: Type.body.fontSize,
      fontWeight: FontWeight.bold,
      color: colors.primary,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.sm,
      alignSelf: 'flex-start',
      overflow: 'hidden',
    },
  });
