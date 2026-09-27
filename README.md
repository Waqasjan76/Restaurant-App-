# Restaurant App MVP (React Native, frontend only)

Fall 2026, Assignment 1. A restaurant ordering and table booking prototype built with Expo and React Native. Everything runs on the device: there is no backend, no external API and no state management library.

## Notes

### Q4: What if the filtering effect had an empty dependency array?

The filtering effect in `MenuScreen` depends on `[selectedCategory, menuItems]`. With an empty array it would run exactly once, right after the first render. At that moment the menu has not loaded yet, so `menuItems` is `[]` and `filteredItems` would be set to an empty list. When the fake request resolves 1.5 seconds later, `menuItems` changes but the effect never runs again, so the list stays empty. Tapping a category chip would also do nothing, because the effect does not re-run when `selectedCategory` changes. The effect would read stale values captured in its first closure. ESLint's `react-hooks/exhaustive-deps` rule warns about exactly this bug.

### Q6: Why Context instead of prop drilling

The logged in user and the theme are needed by almost every screen: the tab bar, the menu cards, the profile page and the manager dashboard. With prop drilling, both values would have to be passed down through `App`, the root stack, the tab navigator and every nested stack, even though those layers never use them. React Navigation screens also receive their props from the navigator, so drilling custom props through it gets awkward quickly. `AuthContext` and `ThemeContext` let any screen read `useAuth()` or `useTheme()` directly, and one `toggleTheme()` restyles the whole app instantly.
**Drawback:** every component that consumes a context re-renders whenever the context value changes. Toggling the theme re-renders every themed screen, even parts that only needed `user`. Keeping the contexts small and separate, and memoising their `value` objects, limits this cost.

### Q7: Cart reducer test cases

Burger = `m7` (Rs. 950), Chai = `m17` (Rs. 200). These are automated in `src/reducers/__tests__/cartReducer.test.js` (run `npm test`). Each input state is deep-frozen to prove the reducer never mutates it.

| # | Action | Initial state | Expected state |
|---|--------|---------------|----------------|
| 1 | `ADD_ITEM` Burger | `items: []` | `items: [Burger x1, note '']` |
| 2 | `ADD_ITEM` Burger | `items: [Burger x1]` | `items: [Burger x2]`, previous state unchanged |
| 3 | `DECREMENT` Burger | `items: [Burger x1, Chai x2]` | `items: [Chai x2]` (removed at zero) |
| 4 | `INCREMENT` Chai | `items: [Burger x1, Chai x2]` | `items: [Burger x1, Chai x3]` |
| 5 | `UPDATE_NOTE` Burger, "no onions" | `items: [Burger x1, note '']` | `items: [Burger x1, note 'no onions']` |
| 6 | `REMOVE_ITEM` Burger | `items: [Burger x4]` | `items: []` |
| 7 | `APPLY_PROMO` " feast20 " | `promoCode: null, discountPercent: 0` | `promoCode: 'FEAST20', discountPercent: 20` |
| 8 | `APPLY_PROMO` "FREEFOOD" | `promoCode: null` | same state object (UI shows "not a valid promo code") |
| 9 | `REMOVE_PROMO` | `promoCode: 'WELCOME10', discountPercent: 10` | `promoCode: null, discountPercent: 0` |
| 10 | `CLEAR_CART` | 2 items + `WELCOME10` | `{ items: [], promoCode: null, discountPercent: 0 }` |

### Q7: useReducer vs useState for the cart

The cart has several pieces of state that change together (items, quantities, notes, promo code, discount) and eight different ways to change them. With `useState`, that logic would be spread across many handlers in different screens, and each one would have to copy arrays correctly. `useReducer` puts every transition in one pure function, which is easy to read, unit test (see the table above) and share through `CartContext` with a single `dispatch`. `useState` would have been enough for a single field such as a quantity counter, or a cart that only supports "add" with no promo codes or notes.

### Q8: When not to use useMemo and useCallback

Memoisation is not free. React has to store the previous value, keep the dependency array and compare it on every render. For cheap work, such as adding two numbers, formatting a price or filtering a list of about twenty items, that overhead can cost more than just recomputing. `useCallback` only helps when the function is passed to a child wrapped in `React.memo`, or used as an effect or hook dependency. Wrapping a handler that goes to a plain `<Pressable>` gains nothing. Memoising also adds bugs when dependency arrays are wrong: stale values, or a memo that never updates. Measure first (for example the render logs in `MenuItemCard`) and optimise only the real hot paths, such as long lists or expensive derived data.
