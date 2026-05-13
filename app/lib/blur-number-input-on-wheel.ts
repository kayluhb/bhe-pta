import type {WheelEventHandler} from 'react';

/** Prevents mouse wheel from nudging `<input type="number">` while focused. */
export const blurNumberInputOnWheel: WheelEventHandler<HTMLInputElement> = (event) => {
  event.currentTarget.blur();
};
