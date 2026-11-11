import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import {
  dayStatusFor,
  parseDayLettersFile,
  type DayLetters,
  type DayLettersFile,
  type DayStatus,
} from '@/lib/day-letters';
import {
  parseAnnouncementsFile,
  parseCalendarFile,
  type AnnouncementsFile,
  type CalendarFile,
} from '@/lib/school-data';

export type SchoolDataStatus = 'loading' | 'live' | 'cached' | 'unavailable';

type SchoolDataFiles = {
  calendar: CalendarFile | null;
  announcements: AnnouncementsFile | null;
  dayLetters: DayLettersFile | null;
};

type SchoolDataValue = {
  calendar: CalendarFile | null;
  announcements: AnnouncementsFile | null;
  dayLetters: DayLetters | null;
  status: SchoolDataStatus;
  refresh: () => Promise<void>;
};

type FileKey = keyof SchoolDataFiles;

const DATA_BASE_URL =
  'https://raw.githubusercontent.com/GNS-programming-club/greatnecksouthapp-official/data/';
const FILES: Record<FileKey, { name: string; parse: (value: unknown) => unknown }> = {
  calendar: { name: 'calendar.json', parse: parseCalendarFile },
  announcements: { name: 'announcements.json', parse: parseAnnouncementsFile },
  dayLetters: { name: 'day-letters.json', parse: parseDayLettersFile },
};
const FILE_KEYS = Object.keys(FILES) as FileKey[];
const FETCH_TIMEOUT_MILLISECONDS = 10_000;
const MINIMUM_REFRESH_GAP_MILLISECONDS = 15 * 60 * 1000;
const EMPTY_FILES: SchoolDataFiles = { calendar: null, announcements: null, dayLetters: null };

const SchoolDataContext = createContext<SchoolDataValue | undefined>(undefined);

function cacheKey(key: FileKey): string {
  return `schoolData_${key}_v1`;
}

async function readCachedFile(key: FileKey): Promise<unknown> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(key));

    return raw ? FILES[key].parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

async function fetchFile(key: FileKey): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MILLISECONDS);

  try {
    const response = await fetch(`${DATA_BASE_URL}${FILES[key].name}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const parsed = FILES[key].parse(await response.json());

    if (parsed) {
      await AsyncStorage.setItem(cacheKey(key), JSON.stringify(parsed)).catch(() => undefined);
    }

    return parsed;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function SchoolDataProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<SchoolDataFiles>(EMPTY_FILES);
  const [fetchOutcome, setFetchOutcome] = useState<'pending' | 'complete' | 'partial'>('pending');
  const lastRefreshAt = useRef(0);

  const refresh = useCallback(async () => {
    lastRefreshAt.current = Date.now();

    const fetched = await Promise.all(FILE_KEYS.map(fetchFile));
    const allFetched = fetched.every((value) => value !== null);

    setFiles((current) => {
      const next = { ...current };

      FILE_KEYS.forEach((key, index) => {
        if (fetched[index] !== null) {
          next[key] = fetched[index] as never;
        }
      });

      return next;
    });
    setFetchOutcome(allFetched ? 'complete' : 'partial');
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all(FILE_KEYS.map(readCachedFile)).then((cached) => {
      if (cancelled) return;

      setFiles((current) => {
        const next = { ...current };

        FILE_KEYS.forEach((key, index) => {
          if (next[key] === null && cached[index] !== null) {
            next[key] = cached[index] as never;
          }
        });

        return next;
      });
      refresh();
    });

    const subscription = AppState.addEventListener('change', (state) => {
      if (
        state === 'active' &&
        Date.now() - lastRefreshAt.current >= MINIMUM_REFRESH_GAP_MILLISECONDS
      ) {
        refresh();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [refresh]);

  const hasAnyData = FILE_KEYS.some((key) => files[key] !== null);
  const status: SchoolDataStatus =
    fetchOutcome === 'pending'
      ? 'loading'
      : fetchOutcome === 'complete'
        ? 'live'
        : hasAnyData
          ? 'cached'
          : 'unavailable';

  const value = useMemo<SchoolDataValue>(
    () => ({
      calendar: files.calendar,
      announcements: files.announcements,
      dayLetters: files.dayLetters?.letters ?? null,
      status,
      refresh,
    }),
    [files, status, refresh]
  );

  return <SchoolDataContext.Provider value={value}>{children}</SchoolDataContext.Provider>;
}

export function useSchoolData(): SchoolDataValue {
  const context = useContext(SchoolDataContext);

  if (!context) {
    throw new Error('useSchoolData must be used within a SchoolDataProvider');
  }

  return context;
}

export function useDayStatus(isoDate: string): DayStatus {
  const { dayLetters } = useSchoolData();

  return useMemo(() => dayStatusFor(isoDate, dayLetters), [isoDate, dayLetters]);
}
