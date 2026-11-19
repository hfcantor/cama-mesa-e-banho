# Vertical captions template

* `captions.json` holds word timings. Replace it with your own:
  - generate narration + timings: `hfr tts --file script.txt --out assets/narration.mp3 --captions captions.json`
  - or transcribe an existing voice-over: `hfr captions transcribe assets/voice.mp3 -o captions.json`
  - or align a known script offline: `hfr captions align assets/voice.mp3 script.txt -o captions.json`
* Then add `<audio src="assets/narration.mp3" data-start="0"></audio>` inside the composition.
