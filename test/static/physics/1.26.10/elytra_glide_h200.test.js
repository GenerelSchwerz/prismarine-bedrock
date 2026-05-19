'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_elytra_glide_h200
// Frames: 66  (ticks 14833..14898)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 14833, position: { x: 0.5, y: 1.6200100183486938, z: 0.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 14834 },
  { t: 14835 },
  { t: 14836 },
  { t: 14837 },
  { t: 14838 },
  { t: 14839, position: { y: 201.62001037597656 }, yaw: 0, pitch: -10, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 14840, yaw: -0.000030517578125, pitch: -9.99755859375, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 14841, position: { y: 201.54161071777344 }, delta: { y: -0.1552319973707199 } },
  { t: 14842, position: { y: 201.38638305664062 }, delta: { y: -0.2305273562669754 } },
  { t: 14843, position: { y: 201.15585327148438 }, delta: { y: -0.30431681871414185 } },
  { t: 14844, position: { y: 200.85153198242188 }, delta: { y: -0.3766304850578308 } },
  { t: 14845, position: { y: 200.4748992919922 }, delta: { y: -0.4474978744983673 } },
  { t: 14846, position: { y: 200.02740478515625 }, delta: { y: -0.5169479250907898 } },
  { t: 14847, position: { y: 199.5104522705078 }, delta: { y: -0.585008978843689 } },
  { t: 14848, position: { y: 198.92544555664062 }, delta: { y: -0.6517087817192078 } },
  { t: 14849, position: { y: 198.27374267578125 }, delta: { y: -0.7170746326446533 } },
  { t: 14850, position: { y: 197.55667114257812 }, delta: { y: -0.7811331152915955 } },
  { t: 14851, position: { y: 196.77554321289062 }, delta: { y: -0.8439104557037354 } },
  { t: 14852, position: { y: 195.93162536621094 }, delta: { y: -0.9054322242736816 } },
  { t: 14853, position: { y: 195.0261993408203 }, delta: { y: -0.9657235741615295 } },
  { t: 14854, position: { y: 194.0604705810547 }, delta: { y: -1.0248091220855713 } },
  { t: 14855, position: { y: 193.03565979003906 }, delta: { y: -1.082713007926941 } },
  { t: 14856, position: { y: 191.95294189453125 }, delta: { y: -1.1394587755203247 } },
  { t: 14857, position: { y: 190.8134765625 }, delta: { y: -1.195069670677185 } },
  { t: 14858, position: { y: 189.618408203125 }, delta: { y: -1.2495683431625366 } },
  { t: 14859, position: { y: 188.36883544921875 }, delta: { y: -1.3029770851135254 } },
  { t: 14860, position: { y: 187.06585693359375 }, delta: { y: -1.3553175926208496 } },
  { t: 14861, position: { y: 185.71054077148438 }, delta: { y: -1.4066113233566284 } },
  { t: 14862, position: { y: 184.30392456054688 }, delta: { y: -1.4568791389465332 } },
  { t: 14863, position: { y: 182.8470458984375 }, delta: { y: -1.5061416625976562 } },
  { t: 14864, position: { y: 181.3408966064453 }, delta: { y: -1.554418921470642 } },
  { t: 14865, position: { y: 179.78648376464844 }, delta: { y: -1.6017305850982666 } },
  { t: 14866, position: { y: 178.18475341796875 }, delta: { y: -1.6480960845947266 } },
  { t: 14867, position: { y: 176.53665161132812 }, delta: { y: -1.693534255027771 } },
  { t: 14868, position: { y: 174.84312438964844 }, delta: { y: -1.7380636930465698 } },
  { t: 14869, position: { y: 173.1050567626953 }, delta: { y: -1.7817025184631348 } },
  { t: 14870, position: { y: 171.32334899902344 }, delta: { y: -1.8244684934616089 } },
  { t: 14871, position: { y: 169.49888610839844 }, delta: { y: -1.8663792610168457 } },
  { t: 14872, position: { y: 167.63250732421875 }, delta: { y: -1.9074517488479614 } },
  { t: 14873, position: { y: 165.7250518798828 }, delta: { y: -1.9477027654647827 } },
  { t: 14874, position: { y: 163.77734375 }, delta: { y: -1.9871487617492676 } },
  { t: 14875, position: { y: 161.79019165039062 }, delta: { y: -2.025805711746216 } },
  { t: 14876, position: { y: 159.76438903808594 }, delta: { y: -2.0636894702911377 } },
  { t: 14877, position: { y: 157.70069885253906 }, delta: { y: -2.100815534591675 } },
  { t: 14878, position: { y: 155.59988403320312 }, delta: { y: -2.1371991634368896 } },
  { t: 14879, position: { y: 153.4626922607422 }, delta: { y: -2.1728551387786865 } },
  { t: 14880, position: { y: 151.2898406982422 }, delta: { y: -2.2077980041503906 } },
  { t: 14881, position: { y: 149.08204650878906 }, delta: { y: -2.242042064666748 } },
  { t: 14882, position: { y: 146.8400115966797 }, delta: { y: -2.2756011486053467 } },
  { t: 14883, position: { y: 144.5644073486328 }, delta: { y: -2.3084890842437744 } },
  { t: 14884, position: { y: 142.25592041015625 }, delta: { y: -2.340719223022461 } },
  { t: 14885, position: { y: 139.9152069091797 }, delta: { y: -2.372304916381836 } },
  { t: 14886, position: { y: 137.54290771484375 }, delta: { y: -2.403258800506592 } },
  { t: 14887, position: { y: 135.1396484375 }, delta: { y: -2.433593511581421 } },
  { t: 14888, position: { y: 132.7060546875 }, delta: { y: -2.4633216857910156 } },
  { t: 14889, position: { y: 130.24273681640625 }, delta: { y: -2.492455244064331 } },
  { t: 14890, position: { y: 127.75028228759766 }, delta: { y: -2.5210061073303223 } },
  { t: 14891, position: { y: 125.22927856445312 }, delta: { y: -2.5489859580993652 } },
  { t: 14892, position: { y: 122.68029022216797 }, delta: { y: -2.576406240463257 } },
  { t: 14893, position: { y: 120.1038818359375 }, delta: { y: -2.603278160095215 } },
  { t: 14894, position: { y: 117.50060272216797 }, delta: { y: -2.629612684249878 } },
  { t: 14895, position: { y: 114.87098693847656 }, delta: { y: -2.6554203033447266 } },
  { t: 14896, position: { y: 112.21556854248047 }, delta: { y: -2.6807119846343994 } },
  { t: 14897, position: { y: 109.53485870361328 }, delta: { y: -2.7054977416992188 } },
  { t: 14898, position: { y: 106.82936096191406 }, delta: { y: -2.729787826538086 } }
]

describe('physics: elytra_glide_h200', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'elytra_glide_h200', softFailures: true })
    h.runScenario({ name: 'elytra_glide_h200', ticks: TICKS })
  })
})
