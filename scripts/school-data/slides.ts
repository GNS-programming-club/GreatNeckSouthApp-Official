import { strFromU8, unzipSync } from 'fflate';

export type SlideText = { title: string | null; paragraphs: string[] };

const SLIDE_FILE_PATTERN = /^ppt\/slides\/slide(\d+)\.xml$/;
const SHAPE_PATTERN = /<p:sp\b[\s\S]*?<\/p:sp>/g;
const TITLE_PLACEHOLDER_PATTERN = /<p:ph\b[^>]*\btype="(?:title|ctrTitle)"/;
const PARAGRAPH_PATTERN = /<a:p\b[^>]*\/>|<a:p\b[^>]*>[\s\S]*?<\/a:p>/g;
const TEXT_RUN_PATTERN = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g;
const LINE_BREAK_PATTERN = /<a:br\b[^>]*\/>/g;
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function slideNumber(fileName: string): number {
  return Number(SLIDE_FILE_PATTERN.exec(fileName)?.[1]);
}

export function readSlideXmlFromPptx(pptx: Uint8Array): string[] {
  const files = unzipSync(pptx, { filter: (file) => SLIDE_FILE_PATTERN.test(file.name) });

  return Object.keys(files)
    .sort((first, second) => slideNumber(first) - slideNumber(second))
    .map((fileName) => strFromU8(files[fileName]));
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, name: string) => {
    if (name.startsWith('#x') || name.startsWith('#X')) {
      return String.fromCodePoint(parseInt(name.slice(2), 16));
    }

    if (name.startsWith('#')) {
      return String.fromCodePoint(Number(name.slice(1)));
    }

    return NAMED_ENTITIES[name] ?? entity;
  });
}

function paragraphText(paragraphXml: string): string {
  const withSpacedBreaks = paragraphXml.replace(LINE_BREAK_PATTERN, '<a:t> </a:t>');
  const runs = [...withSpacedBreaks.matchAll(TEXT_RUN_PATTERN)].map((match) => match[1]);

  return decodeEntities(runs.join('')).replace(/\s+/g, ' ').trim();
}

function shapeParagraphs(shapeXml: string): string[] {
  return [...shapeXml.matchAll(PARAGRAPH_PATTERN)].map((match) => paragraphText(match[0]));
}

export function extractSlideText(slideXml: string): SlideText {
  let title: string | null = null;
  const paragraphs: string[] = [];

  for (const [shapeXml] of slideXml.matchAll(SHAPE_PATTERN)) {
    if (TITLE_PLACEHOLDER_PATTERN.test(shapeXml)) {
      const titleText = shapeParagraphs(shapeXml)
        .filter((paragraph) => paragraph.length > 0)
        .join(' ');
      title = title ?? (titleText || null);
    } else {
      paragraphs.push(...shapeParagraphs(shapeXml));
    }
  }

  return { title, paragraphs };
}
