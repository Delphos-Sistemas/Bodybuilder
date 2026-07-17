@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

html {
  background: #090909;
}

body {
  margin: 0;
  background:
    radial-gradient(circle at top left, rgba(169, 120, 63, 0.16), transparent 28rem),
    linear-gradient(180deg, #090909, #12100d 60%, #090909);
  color: #f1ede5;
}

a {
  color: inherit;
  text-decoration: none;
}

::selection {
  background: #a9783f;
  color: #090909;
}

.exercise-visual {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  background:
    radial-gradient(circle at 50% 18%, rgba(169, 120, 63, 0.16), transparent 17rem),
    linear-gradient(180deg, #f5f1e9 0%, #d8d0c4 100%);
  box-shadow: inset 0 0 0 1px rgba(8, 8, 8, 0.14);
}

.exercise-visual .stage {
  aspect-ratio: 16 / 10;
  display: grid;
  place-items: center;
}

.exercise-visual.compact .stage {
  aspect-ratio: 16 / 11;
}

.exercise-visual svg {
  height: 100%;
  max-width: 100%;
  filter: drop-shadow(0 18px 20px rgba(18, 16, 13, 0.16));
}

.exercise-visual figcaption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  border-top: 1px solid rgba(18, 16, 13, 0.12);
  background: rgba(9, 9, 9, 0.76);
  padding: 0.65rem 0.85rem;
  color: #f1ede5;
  font-size: 0.78rem;
}

.exercise-visual figcaption strong {
  color: #d9a35f;
}

.exercise-visual .muscle {
  fill: #8d877c;
  opacity: 0.18;
  stroke: #2e3032;
  stroke-width: 0.8;
}

.exercise-visual .primary {
  fill: #d6472f;
  opacity: 0.96;
  filter: drop-shadow(0 0 9px rgba(214, 71, 47, 0.38));
}

.exercise-visual .secondary {
  fill: #c9916a;
  opacity: 0.36;
}

.exercise-visual .body {
  transform-origin: 130px 156px;
  animation: visual-breathe 2.8s ease-in-out infinite;
}

.exercise-visual .arm,
.exercise-visual .leg {
  transform-box: fill-box;
  transform-origin: center top;
}

.visual-press .left-arm {
  animation: visual-press-left 1.45s ease-in-out infinite;
}

.visual-press .right-arm {
  animation: visual-press-right 1.45s ease-in-out infinite;
}

.visual-pull .left-arm {
  animation: visual-pull-left 1.5s ease-in-out infinite;
}

.visual-pull .right-arm {
  animation: visual-pull-right 1.5s ease-in-out infinite;
}

.visual-curl .left-arm,
.visual-curl .right-arm {
  transform-origin: center 36%;
  animation: visual-curl 1.3s ease-in-out infinite;
}

.visual-extend .left-arm {
  animation: visual-extend-left 1.35s ease-in-out infinite;
}

.visual-extend .right-arm {
  animation: visual-extend-right 1.35s ease-in-out infinite;
}

.visual-legs .left-leg {
  animation: visual-leg-left 1.45s ease-in-out infinite;
}

.visual-legs .right-leg {
  animation: visual-leg-right 1.45s ease-in-out infinite;
}

.visual-cardio .left-leg,
.visual-cardio .right-arm {
  animation: visual-stride-a 0.9s ease-in-out infinite;
}

.visual-cardio .right-leg,
.visual-cardio .left-arm {
  animation: visual-stride-b 0.9s ease-in-out infinite;
}

.visual-mobility .body {
  animation: visual-mobility 1.8s ease-in-out infinite;
}

@keyframes visual-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.018);
  }
}

@keyframes visual-press-left {
  0%,
  100% {
    transform: rotate(0deg) translateY(0);
  }
  50% {
    transform: rotate(-10deg) translateY(-10px);
  }
}

@keyframes visual-press-right {
  0%,
  100% {
    transform: rotate(0deg) translateY(0);
  }
  50% {
    transform: rotate(10deg) translateY(-10px);
  }
}

@keyframes visual-pull-left {
  0%,
  100% {
    transform: rotate(6deg) translateY(-4px);
  }
  50% {
    transform: rotate(-13deg) translateY(8px);
  }
}

@keyframes visual-pull-right {
  0%,
  100% {
    transform: rotate(-6deg) translateY(-4px);
  }
  50% {
    transform: rotate(13deg) translateY(8px);
  }
}

@keyframes visual-curl {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-16deg) translateY(-5px);
  }
}

@keyframes visual-extend-left {
  0%,
  100% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(8deg) translateY(-7px);
  }
}

@keyframes visual-extend-right {
  0%,
  100% {
    transform: rotate(8deg);
  }
  50% {
    transform: rotate(-8deg) translateY(-7px);
  }
}

@keyframes visual-leg-left {
  0%,
  100% {
    transform: rotate(0deg) translateY(0);
  }
  50% {
    transform: rotate(7deg) translateY(9px);
  }
}

@keyframes visual-leg-right {
  0%,
  100% {
    transform: rotate(0deg) translateY(0);
  }
  50% {
    transform: rotate(-7deg) translateY(9px);
  }
}

@keyframes visual-stride-a {
  0%,
  100% {
    transform: rotate(10deg);
  }
  50% {
    transform: rotate(-12deg) translateY(-4px);
  }
}

@keyframes visual-stride-b {
  0%,
  100% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(12deg) translateY(4px);
  }
}

@keyframes visual-mobility {
  0%,
  100% {
    transform: rotate(-2deg) scale(1);
  }
  50% {
    transform: rotate(3deg) scale(1.02);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
