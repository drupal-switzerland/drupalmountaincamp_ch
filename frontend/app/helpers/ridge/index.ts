// Alpine ridge from the 2027 hero design, drawn in a 1920x540 box. The peaks
// sit in the left half; the hero mirrors it so the tall peak lands on the right.
export const RIDGE_SIZE = { width: 1920, height: 540 } as const
export const RIDGE_VIEWBOX = `0 0 ${RIDGE_SIZE.width} ${RIDGE_SIZE.height}`

/** Skyline, closed below the box so the ice fill runs into the next section. */
export const RIDGE_OUTLINE =
  'M-20 450 L8 400 L14 340 L46 316 L62 268 L94 252 L122 214 L130 192 L162 178 L205 245 L213 278 L237 319 L264 332 L272 352 L278 378 L385 411 L435 395 L476 416 L518 385 L535 357 L576 351 L640 411 L672 431 L702 410 L708 392 L764 373 L830 418 L893 401 L944 363 L959 340 L1026 325 L1110 397 L1125 431 L1216 398 L1252 373 L1332 371 L1396 414 L1441 408 L1514 352 L1600 342 L1692 393 L1805 381 L1940 428 L1940 560 L-20 560 Z'

/**
 * Height of the phone crop, which keeps the drawing's bottom edge: 20vw shows
 * the lower 384 of 540 units, which holds the summit (y 178) and its stroke.
 * Written to --ridge-height-narrow by tailwind.config.
 */
export const RIDGE_NARROW_HEIGHT = 'max(72px, 20vw)'

/** The lowest point of the skyline inside the box (its y). */
export const RIDGE_DEEPEST_VALLEY = 431

/** The top of the tall peak's outline (its y): the summit at 178 less half the 10-unit stroke. */
export const RIDGE_SUMMIT_TOP = 173

/** Shaded faces below the main summits, filled with a fading ice gradient. */
export const RIDGE_FACES = [
  '162,178 130,192 122,214 94,252 62,268 46,316 14,340 8,400 -20,450 -20,560 250,560',
  '1026,325 959,340 944,363 893,401 830,418 1080,560',
  '1600,342 1514,352 1441,408 1396,414 1650,560',
  '576,351 535,357 518,385 476,416 610,560',
] as const

/** Small lit ledges on the shaded faces. */
export const RIDGE_GLINTS = [
  '213,278 237,319 230,323 216,300',
  '264,332 272,352 266,357 257,340',
  '1092,382 1110,397 1103,402 1087,390',
  '626,398 640,411 633,415 621,403',
] as const

/** Snowcaps; each also clips its matching entry in RIDGE_CAP_SHADES. */
export const RIDGE_CAPS = [
  '94,252 122,214 130,192 162,178 205,245 213,278 196,268 182,284 166,262 150,280 134,258 112,270',
  '944,363 959,340 1026,325 1090,380 1066,384 1044,402 1024,384 1000,404 980,382 960,392',
  '1514,352 1600,342 1670,381 1646,392 1622,410 1600,392 1576,410 1552,390 1530,398',
  '518,385 535,357 576,351 624,396 606,400 590,414 572,398 556,412 540,398',
  '1290,372 1332,371 1360,389 1346,392 1332,386 1316,392 1300,382',
  '730,385 764,373 800,398 786,398 770,392 754,396 740,392',
  '1760,386 1805,381 1850,397 1834,398 1818,392 1800,398 1780,392',
] as const

/** Shadow side of each snowcap, clipped to the cap with the same index. */
export const RIDGE_CAP_SHADES = [
  '162,78 -138,78 -138,420 172,420 168,290 158,250 170,214 162,178',
  '1026,225 726,225 726,470 1034,470 1030,410 1024,372 1032,350 1026,325',
  '1600,242 1300,242 1300,470 1608,470 1604,412 1598,380 1606,362 1600,342',
  '576,251 276,251 276,470 584,470 580,420 574,390 582,372 576,351',
  '1332,271 1032,271 1032,400 1334,400 1332,371',
  '764,273 464,273 464,402 766,402 764,373',
  '1805,281 1505,281 1505,404 1807,404 1805,381',
] as const

/** Illustration tints between white and brand ice; not used as text colours. */
export const RIDGE_COLORS = {
  snow: '#FFFFFF',
  bodyTop: '#E4F5FC',
  // Brand ice, so the ridge runs seamlessly into ice sections below it.
  bodyBottom: '#CCEDF9',
  face: '#A9DDF3',
  capShade: '#DFF1FA',
} as const
