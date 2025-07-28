export {};

declare global {
  interface Window {
    env?: {
      isElectron: boolean;
    };
    api?: {
      minimize: () => void;
      maximize: () => void;
      unmaximize: () => void;
      isMaximized: () => Promise<boolean>;
      close: () => void;
      onMaximized: (callback: () => void) => void;
      onRestored: (callback: () => void) => void;
      selectFolder: () => string;
    };
  }
}
