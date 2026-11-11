export type DayLetter = 'A' | 'B';

export type DayLetters = Record<string, DayLetter>;

type Box = { xMin: number; yMin: number; xMax: number; yMax: number };

type Word = Box & { text: string };

type Cell = Box & { letter: DayLetter | null };

type MonthHeading = Box & { month: number };

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const SAME_COLUMN_TOLERANCE_POINTS = 30;
const WORD_PATTERN =
  /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g;
const PATH_PATTERN = /<path\b[^>]*>/g;
const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const SCHEDULE_FILE_PATTERN = /A[_-]?B[_-]?Schedule[^/]*\.pdf$/i;

function parseWords(wordBoxes: string): Word[] {
  return [...wordBoxes.matchAll(WORD_PATTERN)].map((match) => ({
    xMin: Number(match[1]),
    yMin: Number(match[2]),
    xMax: Number(match[3]),
    yMax: Number(match[4]),
    text: match[5].trim(),
  }));
}

function letterForFill(fill: string): DayLetter | null {
  const channels = fill.match(/rgb\(\s*([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%\s*\)/);

  if (!channels) {
    return null;
  }

  const [red, green, blue] = channels.slice(1, 4).map(Number);

  if (red > 80 && green < 20 && blue < 20) {
    return 'A';
  }

  if (blue > 80 && red < 50 && green < 50) {
    return 'B';
  }

  return null;
}

function parseCells(drawing: string): Cell[] {
  const cells: Cell[] = [];

  for (const [tag] of drawing.matchAll(PATH_PATTERN)) {
    const fill = tag.match(/\bfill="([^"]*)"/)?.[1];
    const outline = tag.match(/\bd="M ([^"]*?) Z/)?.[1];

    if (!fill || !outline) {
      continue;
    }

    const coordinates = outline.replace(/L/g, ' ').trim().split(/\s+/).map(Number);

    if (coordinates.length !== 8 || coordinates.some(Number.isNaN)) {
      continue;
    }

    const xs = [coordinates[0], coordinates[2], coordinates[4], coordinates[6]];
    const ys = [coordinates[1], coordinates[3], coordinates[5], coordinates[7]];

    cells.push({
      xMin: Math.min(...xs),
      yMin: Math.min(...ys),
      xMax: Math.max(...xs),
      yMax: Math.max(...ys),
      letter: letterForFill(fill),
    });
  }

  return cells;
}

function centerX(box: Box): number {
  return (box.xMin + box.xMax) / 2;
}

function centerY(box: Box): number {
  return (box.yMin + box.yMax) / 2;
}

function findSchoolYear(words: Word[]): { startMonth: number; startYear: number; endYear: number } {
  for (let index = 0; index + 2 < words.length; index++) {
    const start = words[index].text.match(DATE_PATTERN);
    const end = words[index + 2].text.match(DATE_PATTERN);

    if (start && end && words[index + 1].text === 'through') {
      return {
        startMonth: Number(start[1]),
        startYear: Number(start[3]),
        endYear: Number(end[3]),
      };
    }
  }

  throw new Error('no school year range');
}

function headingAbove(day: Word, headings: MonthHeading[]): MonthHeading | null {
  const above = headings.filter((heading) => heading.yMax <= day.yMin);

  if (above.length === 0) {
    return null;
  }

  const distance = (heading: MonthHeading) => Math.abs(centerX(heading) - centerX(day));
  const nearestDistance = Math.min(...above.map(distance));
  const sameColumn = above.filter(
    (heading) => distance(heading) <= nearestDistance + SAME_COLUMN_TOLERANCE_POINTS
  );

  return sameColumn.reduce((lowest, heading) => (heading.yMin > lowest.yMin ? heading : lowest));
}

function toIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCMonth() !== month - 1) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function area(box: { xMin: number; xMax: number; yMin: number; yMax: number }): number {
  return (box.xMax - box.xMin) * (box.yMax - box.yMin);
}

export function parseDayLetters(wordBoxes: string, drawing: string): DayLetters {
  const words = parseWords(wordBoxes);
  const schoolYear = findSchoolYear(words);
  const cells = parseCells(drawing);
  const headings: MonthHeading[] = words.flatMap((word) => {
    const monthIndex = MONTH_NAMES.indexOf(word.text);

    return monthIndex === -1 ? [] : [{ ...word, month: monthIndex + 1 }];
  });
  const found: [string, DayLetter][] = [];

  for (const word of words) {
    if (!/^([1-9]|[12]\d|3[01])$/.test(word.text)) {
      continue;
    }

    const heading = headingAbove(word, headings);
    const cell = cells
      .filter(
        (candidate) =>
          candidate.xMin <= centerX(word) &&
          centerX(word) <= candidate.xMax &&
          candidate.yMin <= centerY(word) &&
          centerY(word) <= candidate.yMax
      )
      .reduce<
        (typeof cells)[number] | undefined
      >((smallest, candidate) => (!smallest || area(candidate) < area(smallest) ? candidate : smallest), undefined);

    if (!heading || !cell?.letter) {
      continue;
    }

    const year = heading.month >= schoolYear.startMonth ? schoolYear.startYear : schoolYear.endYear;
    const isoDate = toIsoDate(year, heading.month, Number(word.text));

    if (isoDate) {
      found.push([isoDate, cell.letter]);
    }
  }

  found.sort(([first], [second]) => first.localeCompare(second));

  return Object.fromEntries(found);
}

export function findSchedulePdfUrl(pageHtml: string, pageUrl: string): string | null {
  for (const match of pageHtml.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(match[1].replace(/&amp;/g, '&'), pageUrl);

    if (SCHEDULE_FILE_PATTERN.test(url.pathname)) {
      return url.toString();
    }
  }

  return null;
}
