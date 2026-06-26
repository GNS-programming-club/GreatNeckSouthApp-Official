import { useEffect, useState } from 'react';

import { getParsedMenuForMonth, type ParsedMenu } from '@/api/daily-menu';

type MonthMenuState = {
  menu: ParsedMenu | null;
  loading: boolean;
  error: boolean;
};

export function useMonthMenu(year: number, month: number): MonthMenuState {
  const [state, setState] = useState<MonthMenuState>({
    menu: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    let cancelled = false;

    setState({ menu: null, loading: true, error: false });

    const load = async () => {
      try {
        const parsed = await getParsedMenuForMonth(year, month);

        if (cancelled) return;

        setState({ menu: parsed, loading: false, error: false });
      } catch {
        if (cancelled) return;

        setState({ menu: null, loading: false, error: true });
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [year, month]);

  return state;
}
