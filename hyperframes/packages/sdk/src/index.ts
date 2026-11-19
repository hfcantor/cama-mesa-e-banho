/**
 * @hfr/sdk — single entry point for programmatic use.
 * Re-exports the stable APIs of the other packages plus the Composition builder.
 */
export { Composition, h, raw, css, type ClipProps, type CompositionOptions, type Node, type Style } from './builder.ts';

export {
  loadProject, parseComposition, editClipAttributes, resolveTimings, parseTimeValue, formatClock,
  RESOLUTION_PRESETS, PRESETS, easings, groupWords, documentWords,
  type ProjectManifest, type CompositionInfo, type CaptionDocument, type CaptionWord,
} from '@hfr/core';
export { renderProject, RenderError, type RenderOptions, type RenderResult, type RenderProgress } from '@hfr/producer';
export { lintProject, formatLintResult, RULES as LINT_RULES, type LintResult, type LintIssue } from '@hfr/lint';
export { inspectProject, formatInspectReport, type InspectReport } from '@hfr/inspector';
export { startCompositionServer, launchBrowser, openComposition, captureFrame, vendorLibraries, FONT_PACKAGES } from '@hfr/engine';
export {
  probe, transcode, extractFrames, thumbnail, analyzeAudio, detectScenes, detectSilence, measureLoudness, extractPalette,
  listAssets, fontFaceCss, requireFfmpeg,
} from '@hfr/media';
export { parseCaptions, serializeCaptions, retimeCaptions, toSrt, toVtt, toAss, parseSlidesMarkdown } from '@hfr/parsers';
export { synthesize, transcribe, alignText, buildNarration, TTS_PROVIDERS, transcriptionProviders } from '@hfr/voice';
export { loadRegistry, searchRegistry, addItemToComposition, instantiateTemplate } from '@hfr/registry';
export { createSlideshow, reverseVideo, analyzeVideo, sampleStyle, captureWebsite, importFigma, convertFigmaJson, convertRemotion } from '@hfr/skills';
