// Hawkes Math Keys: Desmos-style fractions for Hawkes Learning's math editor.
//
// Hawkes builds answers out of small <input class="qbaseCSS" id="QBase#_input">
// boxes. Typing "/" makes an empty fraction and puts the cursor in the top box,
// so "3/4" has to be typed as "/34". This script lets you type "3/4": when "/"
// follows a number or term, it pulls that term out of the current box, lets
// Hawkes build the fraction, types the term into the top box, then moves the
// cursor to the bottom box.
//
// Hold Alt while pressing "/" to get Hawkes's original behaviour.
//
// It also turns typed shortcuts into Hawkes keypad buttons: "sqrt" -> √,
// "pi" -> π, "inf" -> ∞, "<=" -> ≤, ">=" -> ≥, "!=" -> ≠, Greek letter names
// ("theta" -> θ), "sin", "cos", "tan", "csc", "sec", "cot", "ln", "log" -> the
// matching function, and "arcsin" etc. -> sin⁻¹ etc. Letters that could start
// a shortcut are held back until the shortcut is complete, then the keypad
// button is clicked; if the letters turn out not to be a shortcut they are
// typed normally.
// SHORTCUTS.md lists them all.
(() => {
  "use strict";

  const TAG = "[Hawkes Math Keys]";
  const log = (...args) => console.log(TAG, ...args);

  // Characters that end a term when scanning backwards from the cursor.
  const TERM_BREAKS = new Set("+-=<>≤≥≠,*·×÷ ".split(""));

  // Key codes for the characters we may need to simulate.
  const KEY_CODES = {
    "/": 191, ".": 190, "(": 57, ")": 48, "-": 189,
    "<": 188, ">": 190, "!": 49, "=": 187,
  };

  // Typed shortcut -> id of the Hawkes keypad button it presses.
  const SHORTCUTS = {
    sqrt: "Radical",
    pi: "symPi",
    inf: "symInfinite",
    "<=": "symLessThanOrEqualTo",
    ">=": "symGreaterThanOrEqualTo",
    sin: "sin",
    cos: "cos",
    tan: "tan",
    csc: "csc",
    sec: "sec",
    cot: "cot",
    ln: "ln",
    log: "log",
    "!=": "symNotEqualTo",
    alpha: "symAlpha",
    beta: "symBeta",
    theta: "symTheta",
    lambda: "symLambda",
    mu: "symMu",
    omega: "symOmega",
  };

  // Inverse trig shortcut -> Hawkes's "function with exponent" button. The
  // exponent is filled with -1 to make sin⁻¹ and friends.
  const INVERSE_TRIG = {
    arcsin: "sinP",
    arccos: "cosP",
    arctan: "tanP",
    arccsc: "cscP",
    arcsec: "secP",
    arccot: "cotP",
  };

  // Longest first, so "arcsin" wins over "sin" when both end at the cursor.
  const SHORTCUT_WORDS = [...Object.keys(SHORTCUTS), ...Object.keys(INVERSE_TRIG)]
    .sort((a, b) => b.length - a.length);

  let synthesizing = false;

  const isHawkesBox = (el) =>
    el instanceof HTMLInputElement &&
    (el.classList.contains("qbaseCSS") || /^QBase\d+_input$/.test(el.id));

  const allBoxes = () =>
    Array.from(document.querySelectorAll("input.qbaseCSS, input[id^='QBase']"))
      .filter(isHawkesBox);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Returns the term that ends at the cursor, e.g. "12" in "5+12", "2x" in
  // "2x", "3(x+1)" in "y=3(x+1)". Empty string if there is none.
  function termBeforeCursor(text, cursor) {
    let depth = 0;
    let i = cursor - 1;
    for (; i >= 0; i--) {
      const ch = text[i];
      if (ch === ")") depth++;
      else if (ch === "(") {
        if (depth === 0) break;
        depth--;
      } else if (depth === 0 && TERM_BREAKS.has(ch)) break;
    }
    return text.slice(i + 1, cursor);
  }

  // True for "(x+1)" but not "(x+1)(x+2)".
  function wrappedInParens(term) {
    if (!term.startsWith("(") || !term.endsWith(")")) return false;
    let depth = 0;
    for (let i = 0; i < term.length; i++) {
      if (term[i] === "(") depth++;
      else if (term[i] === ")") depth--;
      if (depth === 0 && i < term.length - 1) return false;
    }
    return true;
  }

  function keyCodeFor(key) {
    if (KEY_CODES[key]) return KEY_CODES[key];
    if (/^[0-9]$/.test(key)) return 48 + Number(key);
    if (/^[a-z]$/i.test(key)) return key.toUpperCase().charCodeAt(0);
    return 0;
  }

  // Builds a KeyboardEvent that also carries the legacy keyCode/which/charCode
  // fields older editors read. Returns true if nobody called preventDefault.
  function fireKey(target, type, key) {
    const code = keyCodeFor(key);
    const ev = new KeyboardEvent(type, { key, bubbles: true, cancelable: true });
    const charCode = type === "keypress" && key.length === 1 ? key.charCodeAt(0) : 0;
    const legacy = type === "keypress" ? charCode : code;
    Object.defineProperty(ev, "keyCode", { get: () => legacy });
    Object.defineProperty(ev, "which", { get: () => legacy });
    Object.defineProperty(ev, "charCode", { get: () => charCode });
    return target.dispatchEvent(ev);
  }

  function setValue(input, value, cursor) {
    input.value = value;
    input.setSelectionRange(cursor, cursor);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Types text into a box one key at a time so Hawkes sees normal typing.
  // If Hawkes handles a key itself (cancels the event), we don't insert it.
  function typeText(input, text) {
    for (const ch of text) {
      const target = document.activeElement || input;
      const down = fireKey(target, "keydown", ch);
      const press = down && fireKey(target, "keypress", ch);
      if (down && press && isHawkesBox(target)) {
        const at = target.selectionStart ?? target.value.length;
        const v = target.value;
        setValue(target, v.slice(0, at) + ch + v.slice(target.selectionEnd ?? at), at + 1);
      }
      fireKey(target, "keyup", ch);
    }
  }

  // Waits for Hawkes to move the cursor into a different box.
  async function waitForFocusChange(from, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      await sleep(15);
      const el = document.activeElement;
      if (isHawkesBox(el) && el !== from) return el;
    }
    return null;
  }

  // Finds the denominator of the fraction whose numerator is `numerator`.
  // Only boxes that did not exist before the "/" are considered, so an older
  // fraction's denominator can never be picked. Hawkes numbers a fraction's
  // boxes so the denominator is the numerator's number + 2 (QBase27 over
  // QBase29); if that doesn't hold, take the new box drawn just below.
  function findDenominator(numerator, boxesBefore) {
    const fresh = allBoxes().filter((b) => b !== numerator && !boxesBefore.has(b));
    const n = Number((numerator.id.match(/^QBase(\d+)_input$/) || [])[1]);
    const byId = fresh.find((b) => b.id === `QBase${n + 2}_input`);
    const r = numerator.getBoundingClientRect();
    if (byId && byId.getBoundingClientRect().top > r.top) return byId;

    let best = null;
    let bestGap = Infinity;
    for (const other of fresh) {
      const o = other.getBoundingClientRect();
      const gap = o.top - r.bottom;
      const overlaps = o.left < r.right && o.right > r.left;
      if (gap > -4 && overlaps && gap < bestGap) {
        best = other;
        bestGap = gap;
      }
    }
    return best;
  }

  function clickInto(box) {
    const o = box.getBoundingClientRect();
    const opts = {
      bubbles: true, cancelable: true, view: window, button: 0,
      clientX: o.left + o.width / 2, clientY: o.top + o.height / 2,
    };
    box.dispatchEvent(new MouseEvent("mousedown", opts));
    box.focus();
    box.dispatchEvent(new MouseEvent("mouseup", opts));
    box.dispatchEvent(new MouseEvent("click", opts));
  }

  async function finishFraction(origin, term, originalValue, termStart, boxesBefore) {
    const numerator = await waitForFocusChange(origin, 500);
    if (!numerator) {
      log("Hawkes did not move the cursor after '/'; putting the term back.");
      setValue(origin, originalValue, termStart + term.length);
      return;
    }
    log("Fraction created; numerator box:", numerator.id);

    synthesizing = true;
    try {
      typeText(numerator, term);
      await sleep(30);

      // Hawkes ignores script-generated arrow keys, so click into the
      // denominator instead.
      const below = findDenominator(numerator, boxesBefore);
      if (below) {
        clickInto(below);
        log("Moved to denominator by clicking:", below.id);
      } else {
        log("Could not find the denominator box; cursor left in numerator.");
      }
    } finally {
      synthesizing = false;
    }
  }

  function clickButton(button) {
    const opts = { bubbles: true, cancelable: true, view: window, button: 0 };
    button.dispatchEvent(new MouseEvent("mousedown", opts));
    button.dispatchEvent(new MouseEvent("mouseup", opts));
    button.dispatchEvent(new MouseEvent("click", opts));
  }

  // Letters that might be the start of a shortcut are held back here instead
  // of being typed, because Hawkes rejects letters a problem doesn't use (on a
  // problem in x, y and C, typing the "o" of "cos" shows an error). If the
  // next key doesn't continue a shortcut, the held letters are typed for real.
  let pending = "";
  let pendingBox = null;
  let pendingTimer = 0;
  const PENDING_IDLE_MS = 800;

  const startsShortcut = (text) => SHORTCUT_WORDS.some((w) => w.startsWith(text));

  function insertText(box, text) {
    if (document.activeElement === box) {
      typeText(box, text);
    } else {
      // Focus has moved on; don't steal it back, just put the text in place.
      const at = box.selectionStart ?? box.value.length;
      setValue(box, box.value.slice(0, at) + text + box.value.slice(at), at + text.length);
    }
  }

  // Types any held-back letters into the box they were meant for.
  function flushPending() {
    clearTimeout(pendingTimer);
    if (!pending) return;
    const text = pending;
    const box = pendingBox;
    pending = "";
    pendingBox = null;
    if (!box.isConnected) return;
    synthesizing = true;
    try {
      insertText(box, text);
    } finally {
      synthesizing = false;
    }
  }

  function fireShortcut(word, box) {
    const buttonId = SHORTCUTS[word] || INVERSE_TRIG[word];
    const button = document.getElementById(buttonId);
    if (!button) {
      log(`No keypad button "${buttonId}" on this page; typing "${word}" as letters.`);
      pending = word;
      pendingBox = box;
      flushPending();
      return;
    }
    const boxesBefore = new Set(allBoxes());
    clickButton(button);
    log(`Turned "${word}" into the ${buttonId} button in`, box.id);
    if (INVERSE_TRIG[word]) finishInverse(boxesBefore);
  }

  // Returns true if the key was taken over as part of a shortcut.
  function handleShortcut(ev, box) {
    if (ev.key.length !== 1 || ev.altKey) {
      flushPending();
      return false;
    }
    if (pendingBox && pendingBox !== box) flushPending();

    let candidate = pending + ev.key;
    if (!startsShortcut(candidate)) {
      flushPending();
      candidate = ev.key;
      if (!startsShortcut(candidate)) return false;
    }
    ev.preventDefault();
    ev.stopImmediatePropagation();
    clearTimeout(pendingTimer);

    const complete = SHORTCUT_WORDS.includes(candidate) &&
      !SHORTCUT_WORDS.some((w) => w !== candidate && w.startsWith(candidate));
    if (complete) {
      pending = "";
      pendingBox = null;
      fireShortcut(candidate, box);
      return true;
    }
    pending = candidate;
    pendingBox = box;
    pendingTimer = setTimeout(flushPending, PENDING_IDLE_MS);
    return true;
  }

  // After a "function with exponent" button, types -1 into the exponent and
  // puts the cursor in the function's argument. The exponent is the new box
  // drawn highest; the argument is the lowest.
  async function finishInverse(boxesBefore) {
    await sleep(60);
    const fresh = allBoxes().filter((b) => !boxesBefore.has(b));
    if (fresh.length < 2) {
      log("Couldn't find the exponent and argument boxes; fill in -1 yourself.");
      return;
    }
    const byTop = fresh.slice().sort(
      (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const exponent = byTop[0];
    const argument = byTop[byTop.length - 1];

    synthesizing = true;
    try {
      if (document.activeElement !== exponent) clickInto(exponent);
      typeText(exponent, "-1");
      await sleep(30);
      clickInto(argument);
      log("Filled exponent", exponent.id, "with -1; cursor in", argument.id);
    } finally {
      synthesizing = false;
    }
  }

  function onKeyDown(ev) {
    if (synthesizing || ev.ctrlKey || ev.metaKey) return;
    const box = ev.target;
    if (!isHawkesBox(box)) return;
    if (ev.key !== "/") {
      handleShortcut(ev, box);
      return;
    }
    flushPending();
    if (ev.altKey) return; // Alt+/ keeps Hawkes's original behaviour

    const cursor = box.selectionStart ?? box.value.length;
    if (cursor !== (box.selectionEnd ?? cursor)) return; // text is selected
    const value = box.value;
    let term = termBeforeCursor(value, cursor);
    if (!term) return; // nothing before "/": let Hawkes do its normal thing

    const termStart = cursor - term.length;
    // Desmos drops the outer parentheses when a group becomes a numerator.
    if (wrappedInParens(term)) term = term.slice(1, -1);

    log(`Turning "${term}/" into a fraction in`, box.id);
    // Remove the term, then let the real "/" key reach Hawkes so it builds
    // the fraction at the spot where the term was.
    const boxesBefore = new Set(allBoxes());
    setValue(box, value.slice(0, termStart) + value.slice(cursor), termStart);
    finishFraction(box, term, value, termStart, boxesBefore);
  }

  // Listen on window in the capture phase: it sees keys before any listener
  // Hawkes adds to the document or the boxes, and because this script runs at
  // document_start it is registered ahead of Hawkes's own window listeners.
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("focusout", (ev) => {
    if (ev.target === pendingBox) flushPending();
  }, true);
  log("loaded in", location.href);
})();
