// Elements people type into. Shared by the custom cursor (keeps the native
// text cursor over them) and the background (pauses while a phone is typing).

export const TEXT_FIELD = "input:not([type='checkbox']):not([type='radio']):not([type='hidden']), textarea, [contenteditable='true']";

export const isTextField = (el) => Boolean(el?.matches?.(TEXT_FIELD));
