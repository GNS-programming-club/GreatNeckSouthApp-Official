import { createHash } from 'node:crypto';

import type { SlideText } from './slides.ts';

export type Announcement = {
  id: string;
  title: string | null;
  text: string;
  club: string | null;
};

const MISSION_STATEMENT_HEADING = 'Mission Statement';
const ID_LENGTH = 8;
const MAX_HEADLINE_LENGTH = 60;
const BLOCK_SEPARATOR = '\n\n';
const GROUP_WORDS = new Set(['club', 'team', 'society']);
const NAME_PART_SEPARATOR = /\s*[/()]\s*|\s+-\s+/;
const ALL_CAPITALS_NAME = /^[A-Z0-9-]*[A-Z][A-Z0-9-]*$/;

function toBlocks(paragraphs: string[]): string[] {
  const blocks: string[][] = [[]];

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      blocks.push([]);
    } else {
      blocks[blocks.length - 1].push(paragraph);
    }
  }

  return blocks
    .map((lines) => lines.join(' ').replace(/\s+/g, ' ').trim())
    .filter((block) => block.length > 0);
}

function splitHeadline(slide: SlideText): { title: string | null; blocks: string[] } {
  const blocks = toBlocks(slide.paragraphs);

  if (slide.title) {
    return blocks.length > 0
      ? { title: slide.title, blocks }
      : { title: null, blocks: [slide.title] };
  }

  if (blocks.length >= 2 && blocks[0].length <= MAX_HEADLINE_LENGTH) {
    return { title: blocks[0], blocks: blocks.slice(1) };
  }

  return { title: null, blocks };
}

function escapeForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

function patternsForNamePart(part: string): RegExp[] {
  const words = part.split(/\s+/);
  const escaped = escapeForPattern(part);

  if (words.length === 1 && ALL_CAPITALS_NAME.test(part)) {
    return [new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`)];
  }

  if (words.length === 1) {
    return [new RegExp(`(?<!\\w)${escaped}\\s+(?:club|team|society)(?!\\w)`, 'i')];
  }

  const patterns = [new RegExp(`(?<!\\w)${escaped}(?!\\w)`, 'i')];
  const lastWord = words[words.length - 1].toLowerCase();

  if (words.length >= 3 && GROUP_WORDS.has(lastWord)) {
    const stem = escapeForPattern(words.slice(0, -1).join(' '));
    patterns.push(new RegExp(`(?<!\\w)${stem}(?!\\w)`, 'i'));
  }

  return patterns;
}

function patternsForClub(clubName: string): RegExp[] {
  return clubName
    .split(NAME_PART_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .flatMap(patternsForNamePart);
}

function earliestMatchIndex(text: string, patterns: RegExp[]): number | null {
  const indexes = patterns
    .map((pattern) => pattern.exec(text)?.index)
    .filter((index): index is number => index !== undefined);

  return indexes.length > 0 ? Math.min(...indexes) : null;
}

export function findClub(text: string, clubNames: string[]): string | null {
  let bestClub: string | null = null;
  let bestIndex = Number.POSITIVE_INFINITY;

  for (const clubName of clubNames) {
    const index = earliestMatchIndex(text, patternsForClub(clubName));

    if (index !== null && index < bestIndex) {
      bestClub = clubName;
      bestIndex = index;
    }
  }

  return bestClub;
}

function idFor(title: string | null, text: string): string {
  return createHash('sha1')
    .update(`${title ?? ''}\n${text}`)
    .digest('hex')
    .slice(0, ID_LENGTH);
}

function isMissionStatement(slide: SlideText): boolean {
  return (
    slide.title === MISSION_STATEMENT_HEADING ||
    toBlocks(slide.paragraphs)[0] === MISSION_STATEMENT_HEADING
  );
}

export function parseAnnouncements(slides: SlideText[], clubNames: string[]): Announcement[] {
  return slides
    .filter((slide) => !isMissionStatement(slide))
    .map(splitHeadline)
    .filter(({ blocks }) => blocks.length > 0)
    .map(({ title, blocks }) => {
      const text = blocks.join(BLOCK_SEPARATOR);

      return {
        id: idFor(title, text),
        title,
        text,
        club: findClub(`${title ?? ''} ${text}`, clubNames),
      };
    });
}
