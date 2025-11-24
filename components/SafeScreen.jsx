import React from "react";

// No-op SafeScreen: return children directly so pages behave as if SafeScreen
// was removed. This avoids editing every screen to remove the wrapper.
export default function SafeScreen({ children }) {
  return <>{children}</>;
}
