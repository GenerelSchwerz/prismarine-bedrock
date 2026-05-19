'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_pb_swim_up_in_lava
// Frames: 57  (ticks 8324..8380)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 8324, position: { x: 0.500001072883606, y: -1.3727821111679077, z: 292.7099914550781 }, yaw: -0.779571533203125, headYaw: -0.779571533203125, delta: { x: 3.7969742078246315e-20, y: -0.03999999910593033, z: 7.140391522410944e-14 }, inputs: { blockBreakingDelayEnabled: true } },
  { t: 8325, position: { y: -1.412782073020935 }, delta: { x: 1.8984871039123158e-20, z: 3.570195761205472e-14 } },
  { t: 8326, position: { y: -1.4527820348739624 }, delta: { x: 9.492435519561579e-21, z: 1.785097880602736e-14 } },
  { t: 8327, position: { y: -1.4927819967269897 }, delta: { x: 4.7462177597807894e-21, z: 8.92548940301368e-15 } },
  { t: 8328, position: { y: -1.532781958580017 }, delta: { x: 2.3731088798903947e-21, z: 4.46274470150684e-15 } },
  { t: 8329, position: { y: -1.5727819204330444 }, delta: { x: 1.1865544399451974e-21, z: 2.23137235075342e-15 } },
  { t: 8330, position: { x: 0.5, y: -0.37998998165130615, z: 300.5 }, yaw: 0, delta: { x: 0, y: 0, z: 0 }, inputs: { handledTeleport: true } },
  { t: 8331, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.019999999552965164 }, inputs: { handledTeleport: false } },
  { t: 8332, position: { y: -0.3599900007247925 }, delta: { y: -0.009999999776482582 }, inputs: { jumpDown: true, jumping: true, wantUp: true, jumpPressedRaw: true, jumpCurrentRaw: true } },
  { t: 8333, position: { y: -0.329990029335022 }, delta: { y: -0.004999999888241291 }, inputs: { jumpPressedRaw: false } },
  { t: 8334, position: { y: -0.29499006271362305 }, delta: { y: -0.002499999478459358 } },
  { t: 8335, position: { y: -0.25749003887176514 }, delta: { y: -0.0012499988079071045 } },
  { t: 8336, position: { y: -0.21873998641967773 }, delta: { y: -0.0006249994039535522 } },
  { t: 8337, position: { y: -0.17936503887176514 }, delta: { y: -0.0003124997019767761 } },
  { t: 8338, position: { y: -0.1396775245666504 }, delta: { y: -0.00015624985098838806 } },
  { t: 8339, position: { y: -0.09983372688293457 }, delta: { y: -0.00007812492549419403 } },
  { t: 8340, position: { y: -0.05991184711456299 }, delta: { y: -0.00003906339406967163 } },
  { t: 8341, position: { y: -0.01995086669921875 }, delta: { y: -0.000019531697034835815 } },
  { t: 8342, position: { y: 0.020029544830322266 }, delta: { y: -0.000009765848517417908 } },
  { t: 8343, position: { y: 0.060019731521606445 }, delta: { y: -0.000004883855581283569 } },
  { t: 8344, position: { y: 0.10001480579376221 }, delta: { y: -0.0000024419277906417847 } },
  { t: 8345, position: { y: 0.14001238346099854 }, delta: { y: -0.0000012218952178955078 } },
  { t: 8346, position: { y: 0.18001115322113037 }, delta: { y: -6.109476089477539e-7 } },
  { t: 8347, position: { y: 0.22001051902770996 }, delta: { y: -3.0547380447387695e-7 } },
  { t: 8348, position: { y: 0.2600102424621582 }, delta: { y: -1.5273690223693848e-7 } },
  { t: 8349, position: { y: 0.300010085105896 }, delta: { y: -7.636845111846924e-8 } },
  { t: 8350, position: { y: 0.34001004695892334 }, delta: { y: -3.725290298461914e-8 } },
  { t: 8351, position: { y: 0.3800100088119507 }, delta: { y: -1.862645149230957e-8 } },
  { t: 8352, position: { y: 0.420009970664978 }, delta: { y: -9.313225746154785e-9 } },
  { t: 8353, position: { y: 0.46000993251800537 }, delta: { y: -3.725290298461914e-9 } },
  { t: 8354, position: { y: 0.5000098943710327 }, delta: { y: -1.862645149230957e-9 } },
  { t: 8355, position: { y: 0.5400098562240601 }, delta: { y: 0 } },
  { t: 8356, position: { y: 0.5800098180770874 } },
  { t: 8357, position: { y: 0.6200097799301147 } },
  { t: 8358, position: { y: 0.6600098013877869 } },
  { t: 8359, position: { y: 0.700009822845459 } },
  { t: 8360, position: { y: 0.7400098443031311 } },
  { t: 8361, position: { y: 0.7800098657608032 } },
  { t: 8362, delta: { y: -0.019999999552965164 }, inputs: { jumpDown: false, jumping: false, wantUp: false, jumpReleasedRaw: true, jumpCurrentRaw: false } },
  { t: 8363, position: { y: 0.7600098848342896 }, delta: { y: -0.029999999329447746 }, inputs: { jumpReleasedRaw: false } },
  { t: 8364, position: { y: 0.730009913444519 }, delta: { y: -0.03500000014901161 } },
  { t: 8365, position: { y: 0.6950098872184753 }, delta: { y: -0.03750000149011612 } },
  { t: 8366, position: { y: 0.6575098633766174 }, delta: { y: -0.038750000298023224 } },
  { t: 8367, position: { y: 0.6187598705291748 }, delta: { y: -0.039374999701976776 } },
  { t: 8368, position: { y: 0.5793849229812622 }, delta: { y: -0.03968749940395355 } },
  { t: 8369, position: { y: 0.5396974086761475 }, delta: { y: -0.03984374925494194 } },
  { t: 8370, position: { y: 0.49985361099243164 }, delta: { y: -0.039921872317790985 } },
  { t: 8371, position: { y: 0.45993173122406006 }, delta: { y: -0.03996093571186066 } },
  { t: 8372, position: { y: 0.4199707508087158 }, delta: { y: -0.03998046740889549 } },
  { t: 8373, position: { y: 0.3799903392791748 }, delta: { y: -0.03999023139476776 } },
  { t: 8374, position: { y: 0.3400001525878906 }, delta: { y: -0.039995115250349045 } },
  { t: 8375, position: { y: 0.30000507831573486 }, delta: { y: -0.03999755531549454 } },
  { t: 8376, position: { y: 0.26000750064849854 }, delta: { y: -0.03999877721071243 } },
  { t: 8377, position: { y: 0.2200087308883667 }, delta: { y: -0.03999938815832138 } },
  { t: 8378, position: { y: 0.1800093650817871 }, delta: { y: -0.039999693632125854 } },
  { t: 8379, position: { y: 0.14000964164733887 }, delta: { y: -0.03999984636902809 } },
  { t: 8380, position: { y: 0.10000979900360107 }, delta: { y: -0.03999992460012436 } }
]

describe('physics: swim_up_in_lava', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'swim_up_in_lava', softFailures: true })
    h.runScenario({ name: 'swim_up_in_lava', ticks: TICKS })
  })
})
