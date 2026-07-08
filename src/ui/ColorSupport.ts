type ColorCapableStream = {
  isTTY?: boolean;
  hasColors?: () => boolean;
};

/**
 * The single place that decides whether the picker should emit color:
 * true only when the stream is an interactive TTY that reports color
 * support. `hasColors()` natively honors NO_COLOR, FORCE_COLOR, and TERM,
 * so no environment sniffing is duplicated here.
 */
export function colorSupported(stream: ColorCapableStream): boolean {
  return stream.isTTY === true && typeof stream.hasColors === 'function' && stream.hasColors();
}
