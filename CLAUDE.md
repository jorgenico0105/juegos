# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, offline web app for a vertical touch **LCD totem** at ILE's stand at ARCSA Calidad 2026 (19 Nov 2026). It has a home menu and three games. All UI text is in **Spanish**. The content comes from the marketing brief ("Propuesta Totem ILE Marketing CLAS"); it is already transcribed into `js/app.js` and the brief itself is no longer in the repo. The totem is 1080×1920, 65", with one touch side.

- **Juego 1 "Conoce ILE"**: the brief's 7-screen institutional sequence. It auto-advances, has prev/next buttons, and returns home after the last slide.
- **Juego 2 "Trivia ILE"**: Participar → one A/B question → correct answer plus a one-line explanation, with "Siguiente pregunta" or "Terminar" → "¡Gracias por participar! Retira tu detalle ILE en nuestro stand" (shows the score if there was more than one question) → home. The 9 questions come from the brief. "Siguiente" is hidden once all 9 have been asked in a session, and if nobody taps either button the app moves to "Gracias" after `triviaFeedbackMs`.
- **Juego 3 "Memoria ILE"**: each game picks `CONFIG.memoryPairs` (6) random products out of the 10 and lays them out in a 3×4 grid (`CONFIG.memoryCols`).

## Running

There is no build step, no dependencies, and no tests. Open `index.html` directly (`file://`) or serve the folder (`python3 -m http.server`). The app scales itself to any viewport, so you can preview it at 1080×1920 in Chrome device emulation.

## Hard constraint: old Android WebView

The totem runs **Android 7.1.2 on an RK3288 with 2 GB RAM**, and its WebView may be very old. So:
- `js/app.js` is **ES5 only**: no arrow functions, `let`/`const`, template literals, classes, optional chaining, or `fetch`.
- CSS must avoid flex `gap`, `clamp()`/`min()`/`max()`, `aspect-ratio`, and `inset`. Keep the `-webkit-` prefixes for flex, transforms, animations, and `backface-visibility`.
- Images are **WebP**, not AVIF. `assets/productos/*.webp` were converted from AVIF with ImageMagick (`magick in.avif -quality 85 out.webp`, which keeps the alpha channel).
- Animate only `transform`/`opacity`.

## Architecture

- **Scaled stage:** everything lives in `#stage`, which is laid out at **1080 px wide**. `fit()` in `app.js` scales it with a CSS transform. On screens taller than 9:16 the stage grows in height; on landscape screens it is centered with green bars. Design in stage pixels and lay out vertically with flex, never with `vh`.
- **Screens:** `<section class="screen" id="s-<name>">`. Call `go(name)` or use any `[data-go=name]` button. `go()` calls `onEnter[name]` and cancels every timer registered through `later()`/`every()`. Use those helpers, not raw `setTimeout`, so leaving a screen never leaves timers running.
- **Kiosk behavior:** after `CONFIG.idleMs` without a touch the app returns home, and end screens count down back to home. Tapping the home logo 5 times requests fullscreen.
- **Content** sits at the top of `app.js`: `CONFIG` (timings), `PRODUCTS`, `QUESTIONS`, `CERTS`/`CERT_ALCANCE`, and `SLIDES`. Edit content there, not in the HTML.
- **Assets:** `assets/logo-ile.png`, `assets/productos/*.webp`, `assets/certificaciones/*.png`, and `assets/institucional/` (`origen-N.jpg`, `procesos-N.jpg`, `cultura-N.jpg` at 1000×1250, plus `presentacion-bodegon.webp`). These are optimized copies; the original photos and AVIF files were removed from the project. When you add new images, resize them first and always convert with `-colorspace sRGB`, because some sources are CMYK JPEGs. Photo slides list their images in `SLIDES[].photos`; the photos crossfade every `tourPhotoMs`, and the slide lasts `max(tourSlideMs, photos × tourPhotoMs)`. Logos and the QR load through `tryImage()`; when a file is missing, the designed fallback stays on screen. `assets/institucional/qr.png` points to https://ile.com.ec. It was generated locally with the Python `segno` library (error level H) in the totem's dark green; the slide also shows the address as text.
- The trivia avoids repeating questions with a shuffled "bag" stored in `localStorage` (`ileTriviaBag`).
- Sounds are short Web Audio tones (`Snd`). There are no audio files.

## Brand

The colors are CSS variables in `css/styles.css`: verde `#159E44`, crema `#FDE7CF`, naranja `#CC6600`, blanco, amarillo `#FDE047`, rojo `#E74212`. `--tinta` (`#0E5A28`, a darker shade of the brand green) is used for body text on crema. Show CLAS discreetly and keep it balanced, as the brief asks. Certification logos and their scope line must be validated by Marketing/Calidad before publishing.
