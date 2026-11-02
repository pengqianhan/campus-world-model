// The three.js layer of what only the shadow map draws: a measured massing's walls as they were before
// the walls hidden inside it were cut (landmarks/measured/model.js), so that its shadows stay as they
// were. three.js's shadow pass draws what the view camera's layers let through, so the scene lets this
// layer through only in a frame that draws the shadow map again (CampusScene.draw). In that frame the
// view's own pass draws what is on it in a material that writes no colour and no depth, and a pass that
// draws the scene in a material of its own leaves it out (`allowOverride` false, and `userData.noAO`
// for the walker views' AO, street/effects.ts). No camera sees it otherwise; layer 1 is the blocks a
// landmark stands in place of (CampusScene, HIDDEN_LAYER).
export const SHADOW_ONLY_LAYER = 7;
