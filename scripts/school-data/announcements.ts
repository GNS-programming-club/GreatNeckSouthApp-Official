import { createHash } from 'node:crypto';

export type Announcement = { id: string; text: string };

const MISSION_STATEMENT_HEADING = 'Mission Statement';
const ID_LENGTH = 8;

function toBlocks(text: string): string[] {
  return text
    .split(/\n[ \t\r]*\n/)
    .map((block) => block.replace(/\s+/g, ' ').trim())
    .filter((block) => block.length > 0);
}

function withoutMissionStatement(blocks: string[]): string[] {
  const headingIndex = blocks.indexOf(MISSION_STATEMENT_HEADING);

  if (headingIndex === -1) {
    return blocks;
  }

  return [...blocks.slice(0, headingIndex), ...blocks.slice(headingIndex + 2)];
}

function idFor(text: string): string {
  return createHash('sha1').update(text).digest('hex').slice(0, ID_LENGTH);
}

export function parseAnnouncements(text: string): Announcement[] {
  return withoutMissionStatement(toBlocks(text)).map((block) => ({
    id: idFor(block),
    text: block,
  }));
}
