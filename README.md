# Neon Swarm

A playable 2.5D vaporwave arcade shooter inspired by Galaga, built with Three.js.

## Run locally

```bash
npm install
npm run dev
```

Controls: arrow keys or WASD to fly in any direction, Space to fire, and P to pause. On touch devices, drag to move and hold to fire.

Power-ups include triple-shot overdrive, a chrono field that slows enemies and their bullets, a phase shield that absorbs a hit, and a rare extra-ship pickup.

Enemy waves mix scouts, guards, aces, heavy bombers, flickering phantoms, and fast-diving lancers as the stages progress.

## Portals leaderboard

The game uses the managed Portals SDK at `./_portals/sdk.js` to read the global top ten and submit each signed-in player's best score when a run ends. Portals injects this file during preview and publishing, so it is intentionally not included in the repository. Local development remains playable, but the leaderboard displays an unavailable-host message.
