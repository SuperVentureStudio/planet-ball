export const LAYERS = [
  {
    name: 'Surface',
    startDepth: 0,
    endDepth: 100,
    gravity: 600,
    platformWidth: { min: 90, max: 140 },
    platformGap: { min: 60, max: 100 },
    platformTypes: ['solid'],
    bgColor: '#2d2d3d',
    platformColor: '#808080',
    platformTopColor: '#999999',
  },
  {
    name: 'Soil & Rock',
    startDepth: 100,
    endDepth: 500,
    gravity: 800,
    platformWidth: { min: 70, max: 120 },
    platformGap: { min: 70, max: 120 },
    platformTypes: ['solid', 'solid', 'crumbly'],
    bgColor: '#3d2b1a',
    platformColor: '#6b5b3a',
    platformTopColor: '#8b7355',
  },
  {
    name: 'Deep Crust',
    startDepth: 500,
    endDepth: 1000,
    gravity: 1100,
    platformWidth: { min: 55, max: 100 },
    platformGap: { min: 80, max: 130 },
    platformTypes: ['solid', 'slippery', 'slippery'],
    bgColor: '#1a2a3a',
    platformColor: '#4a6a8a',
    platformTopColor: '#7aaaca',
  },
  {
    name: 'Mantle',
    startDepth: 1000,
    endDepth: 2000,
    gravity: 1400,
    platformWidth: { min: 45, max: 85 },
    platformGap: { min: 90, max: 140 },
    platformTypes: ['solid', 'crumbly', 'steam'],
    bgColor: '#3a1a0a',
    platformColor: '#8a3a1a',
    platformTopColor: '#cc5522',
  },
  {
    name: 'Outer Core',
    startDepth: 2000,
    endDepth: 3000,
    gravity: 1650,
    platformWidth: { min: 40, max: 70 },
    platformGap: { min: 100, max: 150 },
    platformTypes: ['solid', 'moving', 'moving'],
    bgColor: '#2a1500',
    platformColor: '#aa6600',
    platformTopColor: '#dd8800',
  },
  {
    name: 'Inner Core',
    startDepth: 3000,
    endDepth: Infinity,
    gravity: 1800,
    platformWidth: { min: 30, max: 55 },
    platformGap: { min: 110, max: 160 },
    platformTypes: ['solid', 'solid', 'moving'],
    bgColor: '#1a0a00',
    platformColor: '#ffaa44',
    platformTopColor: '#ffcc77',
  },
];

export function getLayerAtDepth(depthMeters) {
  for (const layer of LAYERS) {
    if (depthMeters >= layer.startDepth && depthMeters < layer.endDepth) {
      return layer;
    }
  }
  return LAYERS[LAYERS.length - 1];
}
