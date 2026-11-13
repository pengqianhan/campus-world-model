# Film review

The two compositions use the same 46-second script. The layout is made separately for
1080 × 1920 and 1920 × 1080. Review date: 2026-11-14, New Zealand time.

## Automated checks

- HyperFrames 0.9.41: lint has no errors on either version.
- The full check passes on both versions, at 15 sample times: runtime, layout, motion,
  contrast and audio have no errors or warnings.
- The deprecated `validate` and `inspect` commands pass for the portrait version too.
- The render uses high quality, 30 fps and two workers. The delivery script requires
  H.264, an audio stream, the correct dimensions, 1,380 frames and exactly 46 seconds.
- The original soundtrack measures -19.0 LUFS before its 0.88 clip gain. Its true peak is
  -3.1 dBFS. It has no sampled recording.

## Reviewed findings

The local-font warnings are expected: Microsoft YaHei and Consolas are installed fonts, not
redistributed files. The film is rendered locally. A cloud render needs licensed font files.

The nested-overlay lint warnings suggest sub-compositions for editing. The timed wrappers
contain text and still images. All video clips are siblings of timed wrappers, and the
runtime check passes. This structure keeps the two formats in one small source generator.

The closing address has a deliberate hold for reading. The full check reports that as a
`dead_stretch`. The other apparent holds in the GSAP map contain moving footage, or give
time to read the eight schools and the two other landmarks.

The supplied older animation-map script could not import `@hyperframes/producer` from the
standalone CLI. A local adapter supplied its file-server and browser-session interface,
without changing the film. The map enumerated all 85 tweens. Its 16 collision flags pair
each full-frame film scene with its own media frame during the entrance; those are parent
and child layers. They are intentional. No offscreen, invisible or pacing flags remain.
The current HyperFrames motion pass also reports no findings.

Brief occlusion at crossfades is expected. The incoming scene covers the outgoing scene;
the outgoing text remains intact until that transition and its timed overlay then ends.
The layout checker reports those as informational findings, with zero errors and warnings.

## Visual review

The portrait contact sheets were opened at each scene's middle and at the closing hold.
Both exported MP4s were sampled again for covers and contact sheets. The Clock Tower's
crown remains clear of the text. Final review moved the room caption above the selected
floor and widened the landscape detail caption to avoid a single-character last line.
`deliver.mjs` writes the contact sheets and covers from the encodes for the final review.

## Claims

Eight schools are listed in the repository README. The scope line limits floor plans and
room search to Auckland. Clock Tower dimensions and estimates trace to its landmark README.
The film distinguishes the model viewer from the running app. It makes no claim about a
public class timetable and shows no test fixture. The unmerged book game is absent. All
images are project renders or local captures. No source photograph is used.

Application checks and CI results are recorded against the final source commit in the pull
request. No published data is changed or rebuilt, and no site feature is changed.
