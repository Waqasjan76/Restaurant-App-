# Restaurant App MVP (React Native, frontend only)

Fall 2026, Assignment 1. A restaurant ordering and table booking prototype built with Expo and React Native. Everything runs on the device: there is no backend, no external API and no state management library.

## Notes

### Q4: What if the filtering effect had an empty dependency array?

The filtering effect in `MenuScreen` depends on `[selectedCategory, menuItems]`. With an empty array it would run exactly once, right after the first render. At that moment the menu has not loaded yet, so `menuItems` is `[]` and `filteredItems` would be set to an empty list. When the fake request resolves 1.5 seconds later, `menuItems` changes but the effect never runs again, so the list stays empty. Tapping a category chip would also do nothing, because the effect does not re-run when `selectedCategory` changes. The effect would read stale values captured in its first closure. ESLint's `react-hooks/exhaustive-deps` rule warns about exactly this bug.
