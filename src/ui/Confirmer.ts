import type { PICKER_CANCELLED } from './PickerCancelled.js';

/**
 * What `InitCommand` depends on for its install confirmation, extracted
 * for the same reason as {@link WorktreePicker}.
 */
export interface Confirmer {
  confirm(message: string): Promise<boolean | typeof PICKER_CANCELLED>;
}
