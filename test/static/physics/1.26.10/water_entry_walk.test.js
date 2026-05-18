'use strict'

// Generated from .proxy.bin recording — do not edit by hand.
// Scenario: 1.21.0_water_entry_walk
// Frames: 68  (ticks 7179..7246)
//
// Each entry is a PAI diff. The first entry diffs from DEFAULT_PAI in
// _helpers.js; every subsequent entry diffs from the previous tick's
// full PAI. The harness reconstructs full PAI per tick and validates.

const { makeHarness } = require('../_helpers')

const TICKS = [
  { t: 7179, position: { x: 0.5, y: 1.6200100183486938, z: 188.5 }, yaw: -0.000030517578125, headYaw: -0.000030517578125, delta: { y: -0.07840000092983246 }, inputs: { blockBreakingDelayEnabled: true, verticalCollision: true } },
  { t: 7180 },
  { t: 7181 },
  { t: 7182 },
  { t: 7183 },
  { t: 7184, position: { x: -4.5, z: 200.5 }, yaw: 90, delta: { y: 0 }, inputs: { handledTeleport: true } },
  { t: 7185, headYaw: 90, delta: { y: -0.07840000092983246 }, inputs: { handledTeleport: false, verticalCollision: false } },
  { t: 7186, position: { y: 1.5416100025177002 }, delta: { y: -0.1552319973707199 } },
  { t: 7187, position: { y: 1.3863780498504639 }, delta: { y: -0.2305273562669754 } },
  { t: 7188, position: { y: 1.1558506488800049 }, delta: { y: -0.30431681871414185 } },
  { t: 7189, position: { y: 0.851533830165863 }, delta: { y: -0.3766304850578308 } },
  { t: 7190, position: { y: 0.4749033451080322 }, delta: { y: -0.4474978744983673 } },
  { t: 7191, position: { y: 0.027405500411987305 }, delta: { y: -0.5169479250907898 } },
  { t: 7192, position: { y: -0.4895423650741577 }, delta: { y: -0.585008978843689 } },
  { t: 7193, position: { y: -1.0745514631271362 }, delta: { y: -0.6517087817192078 } },
  { t: 7194, position: { y: -1.7262603044509888 }, delta: { y: -0.7170746326446533 } },
  { t: 7195, position: { y: -2.4433350563049316 }, delta: { y: -0.7811331152915955 } },
  { t: 7196, position: { y: -3.224468231201172 }, delta: { y: -0.8439104557037354 } },
  { t: 7197, position: { y: -4.068378925323486 }, delta: { y: -0.9054322242736816 } },
  { t: 7198, position: { y: -4.973811149597168 }, delta: { y: -0.9657235741615295 } },
  { t: 7199, position: { y: -5.939534664154053 }, delta: { y: -1.0248091220855713 } },
  { t: 7200, position: { y: -6.964343547821045 }, delta: { y: -1.082713007926941 } },
  { t: 7201, position: { y: -8.047056198120117 }, delta: { y: -1.1394587755203247 } },
  { t: 7202, position: { x: -4.513999938964844, y: -8.379989624023438 }, delta: { x: -0.011200000531971455, y: -0.004999999888241291 }, inputs: { verticalCollision: true } },
  { t: 7203, position: { x: -4.5391998291015625 }, delta: { x: -0.020160002633929253 } },
  { t: 7204, position: { x: -4.573359966278076 }, delta: { x: -0.0273280031979084 } },
  { t: 7205, position: { x: -4.614687919616699 }, delta: { x: -0.0330624058842659 } },
  { t: 7206, position: { x: -4.661750316619873 }, delta: { x: -0.03764992579817772 } },
  { t: 7207, position: { x: -4.713400363922119 }, delta: { x: -0.041319943964481354 } },
  { t: 7208, position: { x: -4.7687201499938965 }, delta: { x: -0.044255953282117844 } },
  { t: 7209, position: { x: -4.826976299285889 }, delta: { x: -0.046604763716459274 } },
  { t: 7210, position: { x: -4.887580871582031 }, delta: { x: -0.04848381504416466 } },
  { t: 7211, position: { x: -4.950064659118652 }, delta: { x: -0.049987055361270905 } },
  { t: 7212, position: { x: -5.014051914215088 }, delta: { x: -0.051189642399549484 } },
  { t: 7213, position: { x: -5.079241752624512 }, delta: { x: -0.052151717245578766 } },
  { t: 7214, position: { x: -5.145393371582031 }, delta: { x: -0.05292137339711189 } },
  { t: 7215, position: { x: -5.212314605712891 }, delta: { x: -0.05353710055351257 } },
  { t: 7216, position: { x: -5.279851913452148 }, delta: { x: -0.054029680788517 } },
  { t: 7217, position: { x: -5.34788179397583 }, delta: { x: -0.0544237457215786 } },
  { t: 7218, position: { x: -5.4163055419921875 }, delta: { x: -0.05473899841308594 } },
  { t: 7219, position: { x: -5.485044479370117 }, delta: { x: -0.05499119684100151 } },
  { t: 7220, position: { x: -5.554035663604736 }, delta: { x: -0.05519295856356621 } },
  { t: 7221, position: { x: -5.623228549957275 }, delta: { x: -0.055354367941617966 } },
  { t: 7222, position: { x: -5.692583084106445 }, delta: { x: -0.05548349767923355 } },
  { t: 7223, position: { x: -5.76206636428833 }, delta: { x: -0.0555867962539196 } },
  { t: 7224, position: { x: -5.831653118133545 }, delta: { x: -0.05566943809390068 } },
  { t: 7225, position: { x: -5.901322364807129 }, delta: { x: -0.05573555454611778 } },
  { t: 7226, position: { x: -5.971057891845703 }, delta: { x: -0.055788446217775345 } },
  { t: 7227, position: { x: -6.040846347808838 }, delta: { x: -0.055830758064985275 } },
  { t: 7228, position: { x: -6.110677242279053 }, delta: { x: -0.0558646097779274 } },
  { t: 7229, position: { x: -6.1805419921875 }, delta: { x: -0.05589168891310692 } },
  { t: 7230, position: { x: -6.250433921813965 }, delta: { x: -0.05591335520148277 } },
  { t: 7231, position: { x: -6.320347309112549 }, delta: { x: -0.05593068525195122 } },
  { t: 7232, position: { x: -6.390277862548828 }, delta: { x: -0.05594455078244209 } },
  { t: 7233, position: { x: -6.460222244262695 }, delta: { x: -0.05595564469695091 } },
  { t: 7234, position: { x: -6.530178070068359 }, delta: { x: -0.05596451833844185 } },
  { t: 7235, position: { x: -6.600142478942871 }, delta: { x: -0.05597161874175072 } },
  { t: 7236, position: { x: -6.670114040374756 }, delta: { x: -0.05597729608416557 } },
  { t: 7237, position: { x: -6.740091323852539 }, delta: { x: -0.0559818409383297 } },
  { t: 7238, position: { x: -6.810073375701904 }, delta: { x: -0.055985476821660995 } },
  { t: 7239, position: { x: -6.880058765411377 }, delta: { x: -0.055988382548093796 } },
  { t: 7240, position: { x: -6.950047016143799 }, delta: { x: -0.055990707129240036 } },
  { t: 7241, position: { x: -7.020037651062012 }, delta: { x: -0.05599256977438927 } },
  { t: 7242, position: { x: -7.090030193328857 }, delta: { x: -0.05599405989050865 } },
  { t: 7243, position: { x: -7.160024166107178 }, delta: { x: -0.05599525198340416 } },
  { t: 7244, position: { x: -7.230019569396973 }, delta: { x: -0.055996205657720566 } },
  { t: 7245, position: { x: -7.300015926361084 }, delta: { x: -0.05599696561694145 } },
  { t: 7246, position: { x: -7.3700127601623535 }, delta: { x: -0.0559975765645504 } }
]

describe('physics: water_entry_walk', () => {
  it('matches recorded client state per tick', () => {
    const h = makeHarness({ version: "1.26.10", scenario: 'water_entry_walk', softFailures: true })
    h.runScenario({ name: 'water_entry_walk', ticks: TICKS })
  })
})
