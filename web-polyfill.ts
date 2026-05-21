import { Platform, NativeModules, Appearance, Dimensions, AppState, DeviceEventEmitter, Keyboard, BackHandler } from 'react-native';

// Aggressive Polyfill for SDK 55+ Web Compatibility
if (Platform.OS === 'web') {
  const dummyListener = {
    addListener: () => ({ remove: () => {} }),
    removeListener: () => {},
    removeListeners: () => {},
    addEventListener: () => ({ remove: () => {} }),
    removeEventListener: () => {},
  };

  // Inject CSS to hide the fast-scrolling/ugly standard scrollbars for a better web experience
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar {
        display: none;
        width: 0px;
        background: transparent;
      }
      html, body {
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
      }
    `;
    document.head.appendChild(style);
  }

  // Many libraries destructure NativeModules. We must ensure common ones exist.
  if (NativeModules) {
    const modulesToShim = [
      'ExpoNotifications',
      'ExpoPushTokenManager',
      'DevicePushTokenFetcher',
      'ExponentNotifications',
      'RNNSafeAreaContext',
      'RNCNetInfo',
      'RNCPushNotification',
      'RNCWebView',
      'RCTDeviceEventEmitter',
      'NetInfo',
      'Appearance',
      'PlatformConstants',
      'UIManager'
    ];
    modulesToShim.forEach(m => {
      if (!(NativeModules as any)[m]) {
        (NativeModules as any)[m] = { ...dummyListener };
      }
    });

    // Aggressively shim EVERY object inside NativeModules to prevent TypeError: addListener is not a function
    Object.keys(NativeModules).forEach(key => {
      let mod = (NativeModules as any)[key];
      if (mod && typeof mod === 'object') {
        if (!mod.addListener) mod.addListener = dummyListener.addListener;
        if (!mod.removeListeners) mod.removeListeners = dummyListener.removeListeners;
        if (!mod.addEventListener) mod.addEventListener = dummyListener.addEventListener;
        if (!mod.removeListener) mod.removeListener = dummyListener.removeListener;
      }
    });

    (NativeModules as any).DeviceEventEmitter = (NativeModules as any).DeviceEventEmitter || DeviceEventEmitter || { ...dummyListener };
  }

  const addShim = (obj: any) => {
    if (!obj) return;
    if (!obj.addListener) obj.addListener = dummyListener.addListener;
    if (!obj.removeListener) obj.removeListener = dummyListener.removeListener;
    if (!obj.addEventListener) obj.addEventListener = dummyListener.addEventListener;
    if (!obj.removeEventListener) obj.removeEventListener = dummyListener.removeEventListener;
  };
  
  addShim(Appearance);
  addShim(Dimensions);
  addShim(AppState);
  addShim(DeviceEventEmitter);
  addShim(Keyboard);
  addShim(BackHandler);
  
  // Polyfill window.matchMedia if it exists but lacks addListener (modern browsers)
  if (typeof window !== 'undefined' && window.matchMedia) {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = function(query) {
      const mql = originalMatchMedia.call(window, query);
      if (mql && !mql.addListener) {
        mql.addListener = (fn: any) => mql.addEventListener('change', fn);
        mql.removeListener = (fn: any) => mql.removeEventListener('change', fn);
      }
      return mql;
    };
  }
}
