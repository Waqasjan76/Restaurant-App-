import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';

// Lets code outside a specific screen (e.g. logout from a nested tab) reset
// the root stack.
export const navigationRef = createNavigationContainerRef();

export function resetRoot(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [{ name, params }] }));
  }
}
