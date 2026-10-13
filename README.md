# Hawkes Math Keys

Changes unhelpful Hawkes keybinds and shortcuts.

A Brave/Chrome extension that makes typing math in Hawkes Learning work like Desmos.

## Why

Hawkes's math editor doesn't type the way almost every other math tool does: Desmos, GeoGebra, Google, Wolfram Alpha, and graphing calculators.

- **Fractions are backwards.** Everywhere else you type the top number first, then `/`. In Hawkes, `/` comes first and builds an empty fraction, so `3/4` has to be typed as `/34`. Typing `3/4` the normal way gives you the wrong answer.
- **Symbols and functions mean leaving the keyboard.** For √, π, ∞, ≤, ≥, sin, cos, ln and the rest, you have to find and click the button on Hawkes's on-screen keypad. Other tools let you type the name: `sqrt`, `pi`, `sin`.

This extension makes Hawkes follow those common conventions. It doesn't replace Hawkes's editor: it pulls out what you typed and presses the same Hawkes buttons you would have, so your answers are built exactly the way Hawkes expects.

## What it changes

### Fractions: number first, then `/`

| You want | Hawkes's way | With this extension (Desmos-style) |
|---|---|---|
| 3⁄4 | `/` `3` Down `4` | `3/4` |
| 2x⁄5 | `/` `2x` Down `5` | `2x/5` |
| 3(x+1)⁄2 | `/` `3(x+1)` Down `2` | `3(x+1)/2` |
| (x+1)⁄2 | `/` `x+1` Down `2` | `(x+1)/2` (the outer brackets are dropped, like Desmos) |

When you press `/`, the term just before it moves to the top of a new fraction and the cursor drops to the bottom.
The term stops at `+ - = < > , *` or a space, the same way Desmos decides what goes on top, so `y=2+3/4` puts only the `3` on top.
If nothing is before the cursor, `/` works the way Hawkes normally does.
Hold **Alt** while pressing `/` to get Hawkes's original behaviour at any time.

### Typed shortcuts instead of keypad clicks

Type these in an answer box and they turn into the Hawkes symbol or function as soon as you finish the word, the same names Desmos and most calculators use:

| Type | Get | Hawkes's way |
|---|---|---|
| `sqrt` | √ (square root) | click √ on the keypad |
| `pi` | π | click π on the keypad |
| `inf` | ∞ | click ∞ on the keypad |
| `<=` / `>=` | ≤ / ≥ | click ≤ / ≥ on the keypad |
| `sin` `cos` `tan` `csc` `sec` `cot` | trig functions | click the function on the keypad |
| `ln` `log` | natural log, log | click ln / log on the keypad |

## Install (Brave or Chrome)

1. Download this repo: green **Code** button → **Download ZIP**, then unzip it.
2. Go to `brave://extensions` (Brave) or `chrome://extensions` (Chrome).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and pick the unzipped folder (the one containing `manifest.json`).
5. Reload your Hawkes tab.

## Troubleshooting

The extension only runs on `*.hawkeslearning.com`. To check that it's working, open the console on a Hawkes problem (F12 → **Console**) and look for lines starting with `[Hawkes Math Keys]`.
If something goes wrong, those lines show what it tried. Please include them in any bug report.

## License

[MIT](LICENSE)
