# Restaurant App MVP (React Native, frontend only)

Fall 2026, Assignment 1. A restaurant ordering and table booking prototype built with Expo and React Native. Everything runs on the device: there is no backend, no external API and no state management library.

## Notes

### Q4: What if the filtering effect had an empty dependency array?

The filtering effect in `MenuScreen` depends on `[selectedCategory, menuItems]`. With an empty array it would run exactly once, right after the first render. At that moment the menu has not loaded yet, so `menuItems` is `[]` and `filteredItems` would be set to an empty list. When the fake request resolves 1.5 seconds later, `menuItems` changes but the effect never runs again, so the list stays empty. Tapping a category chip would also do nothing, because the effect does not re-run when `selectedCategory` changes. The effect would read stale values captured in its first closure. ESLint's `react-hooks/exhaustive-deps` rule warns about exactly this bug.

### Q6: Why Context instead of prop drilling

The logged in user and the theme are needed by almost every screen: the tab bar, the menu cards, the profile page and the manager dashboard. With prop drilling, both values would have to be passed down through `App`, the root stack, the tab navigator and every nested stack, even though those layers never use them. React Navigation screens also receive their props from the navigator, so drilling custom props through it gets awkward quickly. `AuthContext` and `ThemeContext` let any screen read `useAuth()` or `useTheme()` directly, and one `toggleTheme()` restyles the whole app instantly.
**Drawback:** every component that consumes a context re-renders whenever the context value changes. Toggling the theme re-renders every themed screen, even parts that only needed `user`. Keeping the contexts small and separate, and memoising their `value` objects, limits this cost.
