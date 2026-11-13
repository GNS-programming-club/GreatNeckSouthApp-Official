import assert from 'node:assert/strict';
import { test } from 'node:test';

import { strToU8, zipSync } from 'fflate';

import { extractSlideText, readSlideXmlFromPptx } from './slides.ts';

function slideXml(shapes: string): string {
  return `<?xml version="1.0"?><p:sld><p:cSld><p:spTree>${shapes}</p:spTree></p:cSld></p:sld>`;
}

test('reads slide files in slide-number order and ignores everything else', () => {
  const pptx = zipSync({
    'ppt/slides/slide10.xml': strToU8('tenth'),
    'ppt/slides/slide2.xml': strToU8('second'),
    'ppt/slides/slide1.xml': strToU8('first'),
    'ppt/slides/_rels/slide1.xml.rels': strToU8('relationships'),
    'ppt/presentation.xml': strToU8('presentation'),
  });

  assert.deepEqual(readSlideXmlFromPptx(pptx), ['first', 'second', 'tenth']);
});

test('keeps empty paragraphs so blank lines still separate blocks', () => {
  const xml = slideXml(
    '<p:sp><p:txBody><a:p><a:r><a:t>Cookie sale</a:t></a:r></a:p><a:p/>' +
      '<a:p><a:pPr/><a:endParaRPr/></a:p><a:p><a:r><a:t>Friday by the gym.</a:t></a:r></a:p></p:txBody></p:sp>'
  );

  assert.deepEqual(extractSlideText(xml).paragraphs, ['Cookie sale', '', '', 'Friday by the gym.']);
});

test('joins the runs of one paragraph and turns line breaks into spaces', () => {
  const xml = slideXml(
    '<p:sp><p:txBody><a:p><a:r><a:t>Chess </a:t></a:r><a:r><a:rPr b="1"/><a:t>tonight</a:t></a:r>' +
      '<a:br/><a:r><a:t xml:space="preserve">in   room 9</a:t></a:r></a:p></p:txBody></p:sp>'
  );

  assert.deepEqual(extractSlideText(xml).paragraphs, ['Chess tonight in room 9']);
});

test('decodes escaped characters in slide text', () => {
  const xml = slideXml(
    '<p:sp><p:txBody><a:p><a:r><a:t>Tea &amp; cake &lt;$2&gt; &quot;yum&quot; it&apos;s &#8217;ok&#x2019;</a:t></a:r></a:p></p:txBody></p:sp>'
  );

  assert.deepEqual(extractSlideText(xml).paragraphs, [`Tea & cake <$2> "yum" it's ’ok’`]);
});

test('takes the title from a title placeholder and the paragraphs from the other shapes', () => {
  const xml = slideXml(
    '<p:sp><p:nvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>Bake Sale</a:t></a:r></a:p></p:txBody></p:sp>' +
      '<p:sp><p:nvSpPr><p:nvPr><p:ph idx="1"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>Cupcakes for $1.</a:t></a:r></a:p></p:txBody></p:sp>'
  );

  assert.deepEqual(extractSlideText(xml), { title: 'Bake Sale', paragraphs: ['Cupcakes for $1.'] });
});

test('treats a centered-title placeholder as a title too', () => {
  const xml = slideXml(
    '<p:sp><p:nvSpPr><p:nvPr><p:ph type="ctrTitle"/></p:nvPr></p:nvSpPr><p:txBody><a:p><a:r><a:t>Welcome Back</a:t></a:r></a:p></p:txBody></p:sp>'
  );

  assert.deepEqual(extractSlideText(xml), { title: 'Welcome Back', paragraphs: [] });
});

test('finds no text on a slide that holds only a picture', () => {
  const xml = slideXml('<p:pic><p:blipFill><a:blip r:embed="rId2"/></p:blipFill></p:pic>');

  assert.deepEqual(extractSlideText(xml), { title: null, paragraphs: [] });
});
