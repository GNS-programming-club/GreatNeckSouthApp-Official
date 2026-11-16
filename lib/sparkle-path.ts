const DEFAULT_PINCH = 0.12;

export function sparklePath(size: number, pinch: number = DEFAULT_PINCH) {
  const center = size / 2;
  const inset = size * pinch;
  const nearCenter = center - inset;
  const farCenter = center + inset;

  return [
    `M ${center} 0`,
    `Q ${farCenter} ${nearCenter} ${size} ${center}`,
    `Q ${farCenter} ${farCenter} ${center} ${size}`,
    `Q ${nearCenter} ${farCenter} 0 ${center}`,
    `Q ${nearCenter} ${nearCenter} ${center} 0`,
    'Z',
  ].join(' ');
}
