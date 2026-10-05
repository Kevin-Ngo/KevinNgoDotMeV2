import type { FontCycleConfig, HeadingFont } from "../types/font-cycle";

type NetworkInformation = {
  saveData?: boolean;
};

type IdleCallback = (
  callback: () => void,
  options: { timeout: number },
) => void;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isPositiveInteger = (value: unknown): value is number =>
  isPositiveNumber(value) && Number.isInteger(value);

const isHeadingFont = (value: unknown): value is HeadingFont =>
  isRecord(value) &&
  typeof value.family === "string" &&
  value.family.trim().length > 0 &&
  isPositiveNumber(value.weight);

const parseConfig = (value: string | undefined): FontCycleConfig | null => {
  if (!value) return null;

  try {
    const config: unknown = JSON.parse(value);

    if (
      !isRecord(config) ||
      !isPositiveNumber(config.cycleMs) ||
      !isPositiveInteger(config.batchSize) ||
      !isPositiveInteger(config.maximumFonts) ||
      !Array.isArray(config.fonts) ||
      !config.fonts.every(isHeadingFont)
    ) {
      return null;
    }

    return {
      cycleMs: config.cycleMs,
      batchSize: config.batchSize,
      maximumFonts: config.maximumFonts,
      fonts: config.fonts,
    };
  } catch {
    return null;
  }
};

const createGoogleFontsUrl = (batch: HeadingFont[]) => {
  const families = batch
    .map(({ family, weight }) => {
      const name = encodeURIComponent(family).replaceAll("%20", "+");
      return `family=${name}:wght@${weight}`;
    })
    .join("&");

  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
};

const scheduleWhenIdle = (callback: () => void) => {
  const requestIdleCallback = Reflect.get(window, "requestIdleCallback") as
    IdleCallback | undefined;

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback.call(window, callback, { timeout: 2000 });
  } else {
    globalThis.setTimeout(callback, 500);
  }
};

const initializeFontCycle = (heading: HTMLElement) => {
  const config = parseConfig(heading.dataset.config);
  if (!config) return;

  const root = heading.closest<HTMLElement>("[data-font-cycle-root]");
  const debugLabel = root?.querySelector<HTMLElement>(
    "[data-font-cycle-debug]",
  );
  const fonts = config.fonts.slice(0, config.maximumFonts);
  const activeFonts: HeadingFont[] = [];
  const connection = (
    navigator as Navigator & { connection?: NetworkInformation }
  ).connection;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const conserveResources = connection?.saveData || reducedMotion.matches;
  let activeIndex = 0;
  let cycleTimer: number | undefined;
  let disposed = false;

  const applyFont = (font: HeadingFont) => {
    heading.style.fontFamily = `"${font.family}", sans-serif`;
    heading.style.fontWeight = String(font.weight);
    if (debugLabel) debugLabel.textContent = `${font.family} - ${font.weight}`;
  };

  const stopCycling = () => {
    if (cycleTimer === undefined) return;
    window.clearInterval(cycleTimer);
    cycleTimer = undefined;
  };

  const startCycling = () => {
    if (
      disposed ||
      document.hidden ||
      reducedMotion.matches ||
      activeFonts.length < 2 ||
      cycleTimer !== undefined
    ) {
      return;
    }

    cycleTimer = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % activeFonts.length;
      const font = activeFonts[activeIndex];
      if (font) applyFont(font);
    }, config.cycleMs);
  };

  const addLoadedFonts = (loadedFonts: HeadingFont[]) => {
    if (disposed || loadedFonts.length === 0) return;

    const shouldApplyFirstFont = activeFonts.length === 0;
    activeFonts.push(...loadedFonts);
    if (shouldApplyFirstFont) applyFont(activeFonts[0]);
    startCycling();
  };

  const loadBatch = (batch: HeadingFont[]) =>
    new Promise<HeadingFont[]>((resolve) => {
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = createGoogleFontsUrl(batch);
      stylesheet.onload = async () => {
        const loadedFonts = await Promise.all(
          batch.map(async (font) => {
            try {
              const faces = await document.fonts.load(
                `${font.weight} 1em "${font.family}"`,
                heading.textContent ?? "",
              );
              return faces.length > 0 ? font : null;
            } catch {
              return null;
            }
          }),
        );

        resolve(loadedFonts.filter((font) => font !== null));
      };
      stylesheet.onerror = () => resolve([]);
      document.head.append(stylesheet);
    });

  const loadRemainingFonts = (startIndex: number) => {
    if (disposed || conserveResources || startIndex >= fonts.length) return;

    scheduleWhenIdle(async () => {
      if (disposed) return;
      const batch = fonts.slice(startIndex, startIndex + config.batchSize);
      addLoadedFonts(await loadBatch(batch));
      loadRemainingFonts(startIndex + config.batchSize);
    });
  };

  const handleVisibilityChange = () => {
    if (document.hidden) stopCycling();
    else startCycling();
  };

  const handleReducedMotionChange = () => {
    if (reducedMotion.matches) stopCycling();
    else startCycling();
  };

  const dispose = () => {
    disposed = true;
    stopCycling();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    reducedMotion.removeEventListener("change", handleReducedMotionChange);
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  reducedMotion.addEventListener("change", handleReducedMotionChange);
  window.addEventListener("pagehide", dispose, { once: true });

  scheduleWhenIdle(async () => {
    if (disposed || fonts.length === 0) return;
    const initialBatchSize = conserveResources ? 1 : config.batchSize;
    addLoadedFonts(await loadBatch(fonts.slice(0, initialBatchSize)));
    loadRemainingFonts(initialBatchSize);
  });
};

document
  .querySelectorAll<HTMLElement>("[data-font-cycle]")
  .forEach(initializeFontCycle);
