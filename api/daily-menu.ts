const API_URL = 'https://api.schoolnutritionandfitness.com/graphql';

const DISTRICT_ORG_ID = '1593474504123';
const HIGH_SCHOOL_LUNCH_NAME = 'High School Lunch';

const FILLER_WORDS = new Set(['or', 'choice of:', 'choice of', 'days of menu:', 'days of menu']);

function isFillerText(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  return FILLER_WORDS.has(normalized) || normalized.length === 0;
}

function cleanMenuItemName(name: string): string {
  return name.trim();
}

export interface MenuItem {
  id: string;
  name: string;
  meal?: string;
  food_group?: string;
  nutrients?: {
    calories?: number;
    total_fat?: number;
    protein?: number;
    carbs?: number;
  };
}

export interface DayMenu {
  id: string;
  day: number;
  items: MenuItem[];
}

export interface ParsedMenu {
  menuId: string;
  month: number;
  year: number;
  days: DayMenu[];
}

interface MenuTypeInfo {
  id: string;
  name: string;
  menu?: {
    id: string;
    month: number;
    year: number;
  };
}

async function fetchMenuIdForMonth(year: number, month: number): Promise<string | null> {
  const apiMonth = month - 1;

  const query = `
    query GetMenuTypes($organization_id: String!, $month: Int!, $year: Int!) {
      menuTypes(organization_id: $organization_id) {
        id
        name
        menu(month: $month, year: $year) {
          id
          month
          year
        }
      }
    }
  `;

  const variables = {
    organization_id: DISTRICT_ORG_ID,
    month: apiMonth,
    year: year,
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL Errors (menuTypes):', result.errors);
      return null;
    }

    const menuTypes: MenuTypeInfo[] = result.data?.menuTypes || [];

    const highSchoolLunch = menuTypes.find((mt) => mt.name === HIGH_SCHOOL_LUNCH_NAME);

    if (highSchoolLunch?.menu?.id) {
      return highSchoolLunch.menu.id;
    }

    console.warn(`No "${HIGH_SCHOOL_LUNCH_NAME}" menu found for ${month}/${year}`);
    return null;
  } catch (error) {
    console.error('Failed to fetch menu types:', error);
    return null;
  }
}

async function fetchMenuById(menuId: string) {
  const query = `
    query GetMenu($id: String!) {
      menu(id: $id) {
        id
        month
        year
        items {
          day
          product {
            id
            name
            meal
            food_group
          }
          nutrients {
            calories
            total_fat
            protein
            carbs
          }
        }
      }
    }
  `;

  const variables = {
    id: menuId,
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error('GraphQL Errors:', result.errors);
    throw new Error('GraphQL query failed');
  }

  return result.data.menu;
}

async function fetchMenuForMonth(year: number, month: number) {
  const menuId = await fetchMenuIdForMonth(year, month);

  if (!menuId) {
    return null;
  }

  return await fetchMenuById(menuId);
}

export function parseMenuData(rawMenu: any): ParsedMenu {
  const items = rawMenu.items || [];

  const dayMap = new Map<number, MenuItem[]>();

  items.forEach((item: any) => {
    const day = item.day;

    const product = item.product;

    if (!product || !product.name) {
      return;
    }

    const name = cleanMenuItemName(product.name);

    if (isFillerText(name)) {
      return;
    }

    if (!dayMap.has(day)) {
      dayMap.set(day, []);
    }

    const menuItem: MenuItem = {
      id: product.id || `item-${day}-${dayMap.get(day)!.length}`,
      name: name,
      meal: product.meal,
      food_group: product.food_group,
      nutrients: item.nutrients
        ? {
            calories: item.nutrients.calories,
            total_fat: item.nutrients.total_fat,
            protein: item.nutrients.protein,
            carbs: item.nutrients.carbs,
          }
        : undefined,
    };

    dayMap.get(day)!.push(menuItem);
  });

  const days: DayMenu[] = Array.from(dayMap.entries())
    .sort(([dayA], [dayB]) => dayA - dayB)
    .map(([day, items]) => ({
      id: `day-${day}`,
      day: day,
      items: items,
    }));

  return {
    menuId: rawMenu.id,
    month: rawMenu.month + 1,

    year: rawMenu.year,
    days: days,
  };
}

export async function getParsedMenuForMonth(
  year: number,
  month: number
): Promise<ParsedMenu | null> {
  const rawMenu = await fetchMenuForMonth(year, month);

  if (!rawMenu) {
    return null;
  }

  return parseMenuData(rawMenu);
}

export async function getParsedMenu(): Promise<ParsedMenu> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const menu = await getParsedMenuForMonth(currentYear, currentMonth);

  if (!menu) {
    return {
      menuId: '',
      month: currentMonth,
      year: currentYear,
      days: [],
    };
  }

  return menu;
}

export function getMenuItemsForDay(parsedMenu: ParsedMenu, day: number): string[] {
  const dayMenu = parsedMenu.days.find((d) => d.day === day);
  return dayMenu ? dayMenu.items.map((item) => item.name) : [];
}
