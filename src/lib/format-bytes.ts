/** Format binary gigabytes consistently across model and device views. */
export function formatBytes(value: number): string {
  const gigabytes = value / 1024 ** 3;
  return `${gigabytes.toFixed(gigabytes < 10 ? 1 : 0)} GB`;
}
