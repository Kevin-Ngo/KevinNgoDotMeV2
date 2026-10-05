export interface HeadingFont {
  family: string;
  weight: number;
}

export interface FontCycleConfig {
  cycleMs: number;
  batchSize: number;
  maximumFonts: number;
  fonts: HeadingFont[];
}
