export const TRAFFIC_LIGHT_DEFAULTS = {
  greenDuration: 30,
  yellowDuration: 3,
  minGreen: 10,
  maxGreen: 90,
  busPriority: {
    advanceSeconds: 5,
    extendSeconds: 10,
    cooldown: 30,
  },
} as const;

export const TRAFFIC_LIGHT_PHASES = ['ns-green', 'ns-yellow', 'ew-green', 'ew-yellow'] as const;

export const PHASE_SEQUENCE = {
  nsGreen: { next: 'ns-yellow', duration: (nsGreen: number) => nsGreen },
  nsYellow: { next: 'ew-green', duration: () => TRAFFIC_LIGHT_DEFAULTS.yellowDuration },
  ewGreen: { next: 'ew-yellow', duration: (ewGreen: number) => ewGreen },
  ewYellow: { next: 'ns-green', duration: () => TRAFFIC_LIGHT_DEFAULTS.yellowDuration },
} as const;
