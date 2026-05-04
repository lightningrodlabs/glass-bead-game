# The Glass Bead Game

A Holochain Glass Bead Game that runs as a Tauri desktop binary, an Electron-based dev launcher, or as a Moss / Weave applet.

## Setup

Enter the dev shell (provides Holochain CLI, Rust, Node, Tauri toolchain):

```
nix develop
```

Install JS deps (npm workspaces — installs `ui/` and `tests/`):

```
npm install
```

## Run

Three ways to launch the app for development:

```
npm run start:electron      # hc-spin launcher (2 agents)
npm run start:tauri         # native Tauri windows (2 agents)
npm run start:moss          # inside Moss / Weave (2 agents)
```

## Build

```
npm run build:happ          # compile zomes and pack the .happ
npm run package             # build .happ + UI bundle, pack .webhapp
```

## Test

```
npm test                    # tryorama + vitest
```
