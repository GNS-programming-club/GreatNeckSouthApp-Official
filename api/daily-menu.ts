const API_URL = "https://api.schoolnutritionandfitness.com/graphql";

const FILLER_WORDS = new Set([
  "or",
  "choice of:",
  "choice of",
  "days of menu:",
  "days of menu",
]);

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

async function fetchMenu() {
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
    id: "686d30fabb4fd66b4830acfa" 
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    console.error("GraphQL Errors:", result.errors);
    throw new Error("GraphQL query failed");
  }

  const menu = result.data.menu;

  return menu;
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
    
    // skip filler text
    if (isFillerText(name)) {
      return;
    }
    
    if (!dayMap.has(day)) {
      dayMap.set(day, []);
    }
    
    // add a manu items to the day
    const menuItem: MenuItem = {
      id: product.id || `item-${day}-${dayMap.get(day)!.length}`,
      name: name,
      meal: product.meal,
      food_group: product.food_group,
      nutrients: item.nutrients ? {
        calories: item.nutrients.calories,
        total_fat: item.nutrients.total_fat,
        protein: item.nutrients.protein,
        carbs: item.nutrients.carbs,
      } : undefined,
    };
    
    dayMap.get(day)!.push(menuItem);
  });
  
  // convert map to an array of objects
  const days: DayMenu[] = Array.from(dayMap.entries())
    .sort(([dayA], [dayB]) => dayA - dayB)
    .map(([day, items]) => ({
      id: `day-${day}`,
      day: day,
      items: items,
    }));
  
  return {
    menuId: rawMenu.id,
    month: rawMenu.month,
    year: rawMenu.year,
    days: days,
  };
}

// parses menu data
export async function getParsedMenu(): Promise<ParsedMenu> {
  const rawMenu = await fetchMenu();
  return parseMenuData(rawMenu);
}

// menu items for a specific day
export function getMenuItemsForDay(parsedMenu: ParsedMenu, day: number): string[] {
  const dayMenu = parsedMenu.days.find(d => d.day === day);
  return dayMenu ? dayMenu.items.map(item => item.name) : [];
}

