// The three.js layer of what only the shadow map draws: a measured massing's walls as they were before
// the walls hidden inside it were cut (landmarks/measured/model.js), so that its shadows stay as they
// were. three.js's shadow pass draws what the view camera's layers let through, so the scene lets this
// layer through only in a frame that draws the shadow map again (CampusScene.draw), and what is on it
// writes neither colour nor depth there. No camera sees it otherwise; layer 1 is the blocks a landmark
// stands in place of (CampusScene, HIDDEN_LAYER).
export const SHADOW_ONLY_LAYER = 7;
