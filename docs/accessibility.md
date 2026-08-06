# Accessibility verification

Automated axe analysis runs against representative light/dark views and the cross-browser critical flow. It complements, rather than replaces, this manual WCAG 2.2 AA-oriented checklist.

## Keyboard checklist

Test at desktop and 320px mobile width without using a pointer:

- Tab first reaches “Skip to content”; activating it moves focus to the main region.
- Navigation, theme controls, project/task actions, filters, sliders, numeric fields, and move controls have a visible focus indicator.
- Create/edit/archive dialogs receive focus, keep focus inside, close with Escape, and restore focus to their trigger.
- Project and task creation can be completed and corrected from the keyboard.
- Task progress can be changed through the slider, numeric field, and quick actions.
- Manual ordering announces meaningful control names and does not require drag-and-drop.
- Toast actions and errors can be reached or are announced without stealing focus.
- Browser back/forward preserves the expected route and URL-represented filters.

## Screen-reader checklist

Test one current screen reader/browser pairing on each major platform available to the release reviewer:

- Page title, primary navigation, main landmark, headings, lists, and cards establish a coherent reading order.
- Loading and mutation feedback is announced once through polite live regions.
- Form labels, required state, validation errors, and descriptions identify the affected field.
- Status, priority, completion, overdue, blocked, stalled, and archived states are understandable without color.
- Progress bars announce their label, current value, minimum, and maximum.
- Charts have a meaningful accessible name and description; visible captions/timelines provide equivalent values.
- Empty, offline, error, and insufficient-data states state what happened and the available next action.
- Dialog title and description are announced, background content is inert, and close controls are unambiguous.

## Visual and preference checklist

- At 200% browser zoom and 320 CSS pixels, content reflows without two-dimensional scrolling.
- Light and dark themes retain readable text, controls, borders, badges, charts, and focus indicators.
- System theme follows operating-system changes; explicit choices persist.
- Reduced-motion mode removes nonessential transitions without hiding state changes.
- Windows High Contrast/forced-colors mode preserves control boundaries and focus.
- Text spacing overrides do not clip labels or actions.

Record the browser, assistive technology, operating system, date, and any exceptions in the release PR. Serious findings block release; minor follow-ups need an issue, user impact, and owner.
