// Small offline word lists used only by the heuristic (no-API-key) scorer.
// The AI scorer (see scoring.ts) ignores these entirely.

export const COMMON_WORDS = new Set(
  `a an the of to in on at for with and or but is are was were be been being
  do does did have has had i you he she it we they this that these those
  not no yes very really so just also then than as if because while when
  where what who how which my your his her its our their me him us them
  can will would should could may might must shall go goes went come comes
  came get gets got make makes made take takes took give gives gave say
  says said see sees saw know knows knew think thinks thought good bad big
  small new old happy sad fast slow one two three all some any every each
  more most less least well up down out over under again here there now
  today tomorrow yesterday day time year people person thing way work life
  world hand part place case week company system program question number
  group problem fact right left great little own other same into like
  through after before between without within about above around against`
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean)
);

export const FUNCTION_WORDS = new Set(
  `a an the of to in on at for with and or but is are was were be been being
  as by from into onto than then so if because while when that this these
  those it its he she him her his their our your my not no nor do does did`
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean)
);
