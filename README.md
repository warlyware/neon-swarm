# Neon Swarm

A playable 2.5D vaporwave arcade shooter inspired by Galaga, built with Three.js.

## Run locally

```bash
npm install
npm run dev
```

Controls: arrow keys or WASD to fly in any direction, Space to fire, and P to pause. On touch devices, drag to move and hold to fire.

Power-ups include triple-shot overdrive, chrono slowdown, a phase shield, piercing plasma beams, homing missiles, mirror drones, a pickup magnet, a score multiplier, angled cannons, chain lightning, EMP lockdown, hologram decoys, a Reflector Array, a Scavenger Swarm, Warp Dash, Singularity Core, Phoenix Protocol, an instant Nova Bomb, and a rare extra-ship pickup. Timed effects stack independently. Player lives are capped at six; extra-ship pickups stop dropping at that cap, and pickup magnets stop dropping from stage 10 onward.

Enemy waves mix scouts, guards, aces, heavy bombers, flickering phantoms, and fast-diving lancers as the stages progress.

Stages 1–5 use an original percussion-free 132 BPM arcade-vaporwave loop. From stage 6 onward, the soundtrack switches to a faster 160 BPM companion composition with a more urgent edge. Both tracks are synthesized locally with the Web Audio API, require no streamed or remote audio assets, and follow the in-game sound and pause controls.

## Portals leaderboard

The game uses the managed Portals SDK at `./_portals/sdk.js` to read the global top ten and submit each signed-in player's best score when a run ends. Portals injects this file during preview and publishing, so it is intentionally not included in the repository. Local development remains playable, but the leaderboard displays an unavailable-host message.
