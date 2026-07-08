import type { Confirmer } from '../../src/ui/Confirmer.js';
import { PICKER_CANCELLED } from '../../src/ui/PickerCancelled.js';

/** A `Confirmer` fake that always resolves to the given outcome. */
export class FakeConfirmer implements Confirmer {
  constructor(private readonly outcome: boolean | typeof PICKER_CANCELLED) {}

  confirm(): Promise<boolean | typeof PICKER_CANCELLED> {
    return Promise.resolve(this.outcome);
  }
}
