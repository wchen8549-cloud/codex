// Native APK resources ship with the application; no Service Worker is needed.
import { useState } from 'react';
export function useRegisterSW(_options?: unknown) {
  return {
    offlineReady: useState(false), needRefresh: useState(false),
    updateServiceWorker: async (_reload?: boolean) => {},
  };
}
