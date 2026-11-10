export type IcsDateValue =
  | { kind: 'date'; date: string }
  | { kind: 'local'; dateTime: string; timeZone: string }
  | { kind: 'utc'; dateTime: string };

export type IcsEvent = {
  uid: string;
  summary: string;
  location: string;
  start: IcsDateValue;
  end: IcsDateValue | null;
};

type ContentLine = { name: string; parameters: Map<string, string>; value: string };

const FLOATING_TIME_ZONE = 'America/New_York';

function unfoldLines(text: string): string[] {
  return text
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n');
}

function parseParameters(parameterParts: string[]): Map<string, string> {
  return new Map(
    parameterParts.map((part) => {
      const [key, ...valueParts] = part.split('=');

      return [key.toUpperCase(), valueParts.join('=').replace(/^"|"$/g, '')];
    })
  );
}

function parseContentLine(line: string): ContentLine | null {
  let insideQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const character = line[index];

    if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === ':' && !insideQuotes) {
      const [name, ...parameterParts] = line.slice(0, index).split(';');

      return {
        name: name.trim().toUpperCase(),
        parameters: parseParameters(parameterParts),
        value: line.slice(index + 1),
      };
    }
  }

  return null;
}

function unescapeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_match, character: string) =>
    character === 'n' || character === 'N' ? '\n' : character
  );
}

function parseDateValue(line: ContentLine | undefined): IcsDateValue | null {
  if (!line) {
    return null;
  }

  const value = line.value.trim();
  const dateMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(value);

  if (dateMatch) {
    const [, year, month, day] = dateMatch;

    return { kind: 'date', date: `${year}-${month}-${day}` };
  }

  const dateTimeMatch = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);

  if (!dateTimeMatch) {
    return null;
  }

  const [, year, month, day, hour, minute, second, utcMarker] = dateTimeMatch;
  const dateTime = `${year}-${month}-${day}T${hour}:${minute}:${second}`;

  if (utcMarker) {
    return { kind: 'utc', dateTime };
  }

  return { kind: 'local', dateTime, timeZone: line.parameters.get('TZID') ?? FLOATING_TIME_ZONE };
}

function toIcsEvent(properties: Map<string, ContentLine>): IcsEvent | null {
  const uid = properties.get('UID')?.value.trim();
  const start = parseDateValue(properties.get('DTSTART'));

  if (!uid || !start) {
    return null;
  }

  return {
    uid,
    summary: unescapeText(properties.get('SUMMARY')?.value ?? ''),
    location: unescapeText(properties.get('LOCATION')?.value ?? ''),
    start,
    end: parseDateValue(properties.get('DTEND')),
  };
}

export function parseIcs(text: string): IcsEvent[] {
  const lines = unfoldLines(text);

  if (!lines.some((line) => line.trim().toUpperCase() === 'BEGIN:VCALENDAR')) {
    throw new Error('Not an iCalendar document');
  }

  const events: IcsEvent[] = [];
  let currentEvent: Map<string, ContentLine> | null = null;
  let nestedComponentDepth = 0;

  for (const line of lines) {
    const contentLine = parseContentLine(line);

    if (!contentLine) {
      continue;
    }

    const componentName = contentLine.value.trim().toUpperCase();

    if (contentLine.name === 'BEGIN' && componentName === 'VEVENT') {
      currentEvent = new Map();
      nestedComponentDepth = 0;
    } else if (
      contentLine.name === 'END' &&
      componentName === 'VEVENT' &&
      nestedComponentDepth === 0
    ) {
      const event = currentEvent ? toIcsEvent(currentEvent) : null;

      if (event) {
        events.push(event);
      }

      currentEvent = null;
    } else if (currentEvent && contentLine.name === 'BEGIN') {
      nestedComponentDepth++;
    } else if (currentEvent && contentLine.name === 'END') {
      nestedComponentDepth--;
    } else if (currentEvent && nestedComponentDepth === 0) {
      currentEvent.set(contentLine.name, contentLine);
    }
  }

  return events;
}
