interface HeadingFont {
  family: string;
  weight: number;
}

interface FontCycleConfig {
  cycleMs: number;
  batchSize: number;
  maximumFonts: number;
  fonts: HeadingFont[];
}

const heading = document.querySelector<HTMLElement>("[data-font-cycle]");
const debugLabel = document.querySelector<HTMLElement>(
  "[data-font-cycle-debug]",
);

if (heading) {
  const config = JSON.parse(
    heading.dataset.config ?? "{}",
  ) as FontCycleConfig;
  const fonts = config.fonts.slice(0, config.maximumFonts);
  const activeFonts: HeadingFont[] = [];
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection;
  let activeIndex = 0;
  let cycleTimer: number | undefined;

  const applyFont = (font: HeadingFont) => {
    heading.style.fontFamily = `"${font.family}", sans-serif`;
    heading.style.fontWeight = String(font.weight);
    if (debugLabel) debugLabel.textContent = `${font.family} - ${font.weight}`;
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

  const scheduleWhenIdle = (callback: () => void) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: 2000 });
    } else {
      window.setTimeout(callback, 500);
    }
  };

  const loadRemainingFonts = (startIndex: number) => {
    if (startIndex >= fonts.length || connection?.saveData) return;

    scheduleWhenIdle(async () => {
      const batch = fonts.slice(startIndex, startIndex + config.batchSize);
      activeFonts.push(...(await loadBatch(batch)));
      loadRemainingFonts(startIndex + config.batchSize);
    });
  };

  const startCycling = () => {
    if (activeFonts.length < 2 || cycleTimer) return;

    cycleTimer = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % activeFonts.length;
      applyFont(activeFonts[activeIndex]);
    }, config.cycleMs);
  };

  scheduleWhenIdle(async () => {
    const initialBatchSize = config.batchSize;
    const initialBatch = fonts.slice(0, initialBatchSize);
    activeFonts.push(...(await loadBatch(initialBatch)));

    if (activeFonts.length > 0) {
      applyFont(activeFonts[0]);
      startCycling();
    }

    loadRemainingFonts(initialBatchSize);
  });
}
