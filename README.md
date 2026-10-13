# Hawkes Math Keys

Changes unhelpful Hawkes keybinds and shortcuts.

A Brave/Chrome extension that makes typing math in Hawkes Learning work like Desmos.

## What it changes

| You type | Hawkes normally | With this extension |
|---|---|---|
| `3/4` | `/` must come first: `/34` | `3` `/` `4`: the 3 goes on top, cursor drops to the bottom |
| `2x/5` | `/2x` Down `5` | `2x/5` |
| `3(x+1)/2` | `/3(x+1)` Down `2` | `3(x+1)/2` |
| `(x+1)/2` | `/x+1` Down `2` | `(x+1)/2` (the outer brackets are dropped, like Desmos) |

The term before `/` stops at `+ - = < > , *` or a space, the same way Desmos decides what goes on top.
If nothing is before the cursor, `/` works the way Hawkes normally does.
Hold **Alt** while pressing `/` to get the original Hawkes behaviour.

### Typed shortcuts

Type these anywhere in an answer box and they turn into the matching Hawkes keypad button as soon as you finish the word:

| Type | Get |
|---|---|
| `sqrt` | √ (square root) |
| `pi` | π |
| `inf` | ∞ |
| `<=` / `>=` | ≤ / ≥ |
| `sin` `cos` `tan` `csc` `sec` `cot` | trig functions |
| `ln` `log` | logarithms |

## Install (Brave or Chrome)

1. Download this repo: green **Code** button → **Download ZIP**, then unzip it.
2. Go to `brave://extensions` (Brave) or `chrome://extensions` (Chrome).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the unzipped folder (the one containing `manifest.json`).
5. Reload your Hawkes tab.

## Troubleshooting

The extension only runs on `*.hawkeslearning.com`. To check that it's working, open the console on a Hawkes problem (F12 → **Console**) and look for lines starting with `[Hawkes Math Keys]`.
If something goes wrong, those lines show what it tried. Please include them in any bug report.
