import { useEffect, useState } from 'react';

import { getParsedMenuForMonth, type ParsedMenu } from '@/api/daily-menu';

type MonthMenuState = {
  menu: ParsedMenu | null;
  loading: boolean;
  error: boolean;
};

type LoadedMonthMenu = {
  monthKey: string;
  menu: ParsedMenu | null;
  error: boolean;
};

export function useMonthMenu(year: number, month: number): MonthMenuState {
  const monthKey = `${year}-${month}`;
  const [loaded, setLoaded] = useState<LoadedMonthMenu | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const parsed = await getParsedMenuForMonth(year, month);

        if (cancelled) return;

        setLoaded({ monthKey: `${year}-${month}`, menu: parsed, error: false });
      } catch {
        if (cancelled) return;

        setLoaded({ monthKey: `${year}-${month}`, menu: null, error: true });
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [year, month]);

  if (loaded?.monthKey !== monthKey) {
    return { menu: null, loading: true, error: false };
  }

  return { menu: loaded.menu, loading: false, error: loaded.error };
}
