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
      
      /* ---- GLOBAL FORM INPUT & AUTOFILL THEME FIXES ---- */
      /* Dark Theme */
      :root[data-theme="dark"] input, 
      :root[data-theme="dark"] textarea, 
      :root[data-theme="dark"] select,
      :root[data-theme="dark"] [role="textbox"],
      :root[data-theme="dark"] [role="combobox"] {
        color: #fafafa !important;
        background-color: transparent;
      }
      :root[data-theme="dark"] input::placeholder, 
      :root[data-theme="dark"] textarea::placeholder {
        color: rgba(255,255,255,0.42) !important;
        opacity: 1 !important;
      }
      :root[data-theme="dark"] input:-webkit-autofill,
      :root[data-theme="dark"] input:-webkit-autofill:hover, 
      :root[data-theme="dark"] input:-webkit-autofill:focus, 
      :root[data-theme="dark"] input:-webkit-autofill:active {
        -webkit-text-fill-color: #fafafa !important;
        -webkit-box-shadow: 0 0 0 30px #111113 inset !important;
        box-shadow: 0 0 0 30px #111113 inset !important;
        transition: background-color 5000s ease-in-out 0s !important;
        caret-color: #fafafa !important;
      }
      
      /* Light Theme */
      :root[data-theme="light"] input, 
      :root[data-theme="light"] textarea, 
      :root[data-theme="light"] select,
      :root[data-theme="light"] [role="textbox"],
      :root[data-theme="light"] [role="combobox"] {
        color: #09090b !important;
      }
      :root[data-theme="light"] input::placeholder, 
      :root[data-theme="light"] textarea::placeholder {
        color: #64748b !important;
        opacity: 1 !important;
      }
      :root[data-theme="light"] input:-webkit-autofill,
      :root[data-theme="light"] input:-webkit-autofill:hover, 
      :root[data-theme="light"] input:-webkit-autofill:focus, 
      :root[data-theme="light"] input:-webkit-autofill:active {
        -webkit-text-fill-color: #09090b !important;
        -webkit-box-shadow: 0 0 0 30px #f1f5f9 inset !important;
        box-shadow: 0 0 0 30px #f1f5f9 inset !important;
        transition: background-color 5000s ease-in-out 0s !important;
        caret-color: #09090b !important;
      }
      
      /* Common Focus/Disabled */
      input:focus, textarea:focus, select:focus, [role="textbox"]:focus {
        outline: none !important;
        border-color: #3b82f6 !important;
      }
      
      :root[data-theme="dark"] input:disabled, 
      :root[data-theme="dark"] textarea:disabled,
      :root[data-theme="dark"] select:disabled {
        color: rgba(255,255,255,0.3) !important;
      }
      
      :root[data-theme="light"] input:disabled, 
      :root[data-theme="light"] textarea:disabled,
      :root[data-theme="light"] select:disabled {
        color: rgba(0,0,0,0.3) !important;
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
