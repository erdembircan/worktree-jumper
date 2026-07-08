/**
 * How {@link RcInstaller} should write to the resolved path: append (or
 * replace) a fenced block inside an existing rc file, or manage the whole
 * file as a dedicated conf.d snippet.
 */
export type RcTargetKind = 'fenced-append' | 'conf.d-file';

export interface RcTarget {
  path: string;
  kind: RcTargetKind;
}
