import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSrt, parseVtt, parseCaptionJson, toSrt, toVtt, toAss, parseCaptions, retimeCaptions, wordsToCues,
  parseSlidesMarkdown, inlineMarkdown, checkCss, checkJavaScript, scanJavaScript,
} from '@hfr/parsers';

const SRT = `1
00:00:01,000 --> 00:00:02,500
Hello <b>world</b>

2
00:00:03,000 --> 00:00:04,000
Second line
`;

test('SRT parse and roundtrip', () => {
  const doc = parseSrt(SRT);
  assert.equal(doc.cues.length, 2);
  assert.deepEqual([doc.cues[0]!.start, doc.cues[0]!.end, doc.cues[0]!.text], [1, 2.5, 'Hello world']);
  assert.deepEqual(parseSrt(toSrt(doc)).cues.map((c) => [c.start, c.end, c.text]), doc.cues.map((c) => [c.start, c.end, c.text]));
});

test('VTT with karaoke timestamps produces word timings', () => {
  const vtt = 'WEBVTT\nLanguage: pt\n\n00:00:00.000 --> 00:00:03.000\nUm <00:00:01.000>dois <00:00:02.000>três\n';
  const doc = parseVtt(vtt);
  assert.equal(doc.language, 'pt');
  assert.deepEqual(doc.cues[0]!.words!.map((w) => [w.text, w.start]), [['Um', 0], ['dois', 1], ['três', 2]]);
  assert.match(toVtt(doc, { karaoke: true }), /<00:00:01\.000>dois/);
  assert.throws(() => parseVtt('nope'), /WEBVTT/);
});

test('JSON: word list, whisper verbose_json, cue doc', () => {
  const words = parseCaptionJson(JSON.stringify([{ word: 'Olá', start: 0, end: 0.4 }, { word: 'mundo.', start: 0.4, end: 0.9 }, { word: 'Fim', start: 2.5, end: 3 }]));
  assert.equal(words.cues.length, 2);
  const whisper = parseCaptionJson(JSON.stringify({ language: 'en', segments: [{ start: 0, end: 1, text: ' hi', words: [{ word: ' hi', start: 0, end: 1 }] }] }));
  assert.equal(whisper.cues[0]!.words![0]!.text, 'hi');
  assert.throws(() => parseCaptionJson('{"foo":1}'), /unrecognised/);
});

test('ASS export contains karaoke tags and styles', () => {
  const ass = toAss({ cues: [{ start: 0, end: 1, text: 'a b', words: [{ text: 'a', start: 0, end: 0.5 }, { text: 'b', start: 0.5, end: 1 }] }] }, { highlight: '#FF0000' });
  assert.match(ass, /\{\\k50\}a \{\\k50\}b/);
  assert.match(ass, /&H000000FF/);
});

test('plain text scripts, retiming, wordsToCues', () => {
  const doc = parseCaptions('script.txt', 'Line one\nLine two is longer', { duration: 10 });
  assert.equal(doc.cues.length, 2);
  assert.equal(Math.round(doc.cues[1]!.end), 10);
  const shifted = retimeCaptions(doc, { offset: 1 });
  assert.equal(shifted.cues[0]!.start, 1);
  assert.equal(wordsToCues([{ text: 'a.', start: 0, end: 1 }, { text: 'b', start: 1, end: 2 }]).length, 2);
});

test('slides markdown with directives and notes', () => {
  const slides = parseSlidesMarkdown(`# Title\n## Sub\n\nIntro **bold**\n\nNotes:\nSay hello\n\n---\n<!-- duration: 6, transition: wipe-left -->\n# Two\n- a\n- b\n![alt](img.png)`);
  assert.equal(slides.length, 2);
  assert.deepEqual([slides[0]!.title, slides[0]!.subtitle, slides[0]!.notes], ['Title', 'Sub', 'Say hello']);
  assert.deepEqual([slides[1]!.duration, slides[1]!.transition, slides[1]!.bullets, slides[1]!.image?.src], [6, 'wipe-left', ['a', 'b'], 'img.png']);
  assert.equal(inlineMarkdown('**a** <b>'), '<strong>a</strong> &lt;b&gt;');
});

test('syntax checks for CSS and JS', () => {
  assert.equal(checkCss('.a{color:red}').length, 0);
  assert.ok(checkCss('.a{colr:red}').some((i) => /unknown property/.test(i.message)));
  assert.equal(checkJavaScript('const a = 1;').length, 0);
  const err = checkJavaScript('const = ;');
  assert.equal(err.length, 1);
  assert.equal(err[0]!.line, 1);
  assert.deepEqual(scanJavaScript('setTimeout(f, 1); gsap.to(x)').calls.map((c) => c.name), ['setTimeout', 'gsap.to']);
});
