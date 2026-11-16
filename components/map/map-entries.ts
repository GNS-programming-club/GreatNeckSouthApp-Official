import mapData from '@/assets/data/map-rooms.json';
import { parseBox, type Box } from '@/lib/map-viewport';
import { buildSearchIndex } from '@/lib/search-index';

type SectionInfo = { dept: string; area: string; level: string };

type RawPlace = {
  id: string;
  label: string;
  sub: string;
  section: string;
  area: string;
  keywords: string[];
  box?: unknown;
};

type RawRoom = { id: string; label: string; sub: string; section: string; box?: unknown };

type MapFile = {
  sections: Record<string, SectionInfo>;
  places: RawPlace[];
  rooms: RawRoom[];
};

export type MapEntry = {
  id: string;
  label: string;
  sub: string;
  dept: string;
  area: string;
  level: string;
  keywords: string[];
  box: Box | null;
};

const file = mapData as MapFile;

export const MAP_ENTRIES: MapEntry[] = [
  ...file.places.map((place) => ({
    id: place.id,
    label: place.label,
    sub: place.sub,
    dept: file.sections[place.section].dept,
    area: place.area,
    level: file.sections[place.section].level,
    keywords: [...place.keywords, place.label, place.sub, file.sections[place.section].dept],
    box: parseBox(place.box),
  })),
  ...file.rooms.map((room) => ({
    id: room.id,
    label: room.label,
    sub: room.sub,
    dept: file.sections[room.section].dept,
    area: file.sections[room.section].area,
    level: file.sections[room.section].level,
    keywords: [room.label, room.sub, room.section, file.sections[room.section].dept],
    box: parseBox(room.box),
  })),
];

export const MAP_SEARCH_INDEX = buildSearchIndex(MAP_ENTRIES, (entry) => entry.keywords);

export function entryTitle(entry: MapEntry) {
  return entry.sub ? `${entry.label} · ${entry.sub}` : entry.label;
}

export function entryLevel(entry: MapEntry) {
  return `${entry.level} level`;
}
