import React, { useEffect, useState } from "react";
import { Minimize, Maximize, X } from "lucide-react";

// Tailwind 보라계열: bg-gradient-to-r from-purple-700 via-violet-600 to-purple-500 등 활용

const CustomTitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.api?.onMaximized && window.api?.onRestored) {
      window.api.onMaximized(() => setIsMaximized(true));
      window.api.onRestored(() => setIsMaximized(false));
    }
  }, []);

  const handleMinimize = () => window.api?.minimize?.();
  const handleMaximize = () =>
    isMaximized ? window.api?.unmaximize?.() : window.api?.maximize?.();
  const handleClose = () => window.api?.close?.();

  return (
    <div
      className="select-none flex items-center justify-between px-4 h-10"
      style={{
        WebkitAppRegion: "drag", // Electron 드래그 가능
        background: "linear-gradient(90deg, #7c3aed 0%, #a78bfa 50%, #8b5cf6 100%)",
      }}
    >
      {/* 좌측 앱 이름/로고 */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-white tracking-wider text-lg" style={{ letterSpacing: "0.05em" }}>
          DEVOPS HUB
        </span>
      </div>

      {/* 우측 버튼 (드래그 안되게!) */}
      <div className="flex gap-1" style={{ WebkitAppRegion: "no-drag" }}>
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-purple-300/30 transition"
          aria-label="Minimize"
          tabIndex={-1}
          onClick={handleMinimize}
        >
          <Minimize size={18} color="#ede9fe" />
        </button>
        <button
          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-purple-300/30 transition`}
          aria-label={isMaximized ? "Restore" : "Maximize"}
          tabIndex={-1}
          onClick={handleMaximize}
        >
          <Maximize size={18} color="#ede9fe" />
        </button>
        <button
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-rose-600/80 hover:text-white transition"
          aria-label="Close"
          tabIndex={-1}
          onClick={handleClose}
        >
          <X size={18} color="#fde68a" />
        </button>
      </div>
    </div>
  );
};

export default CustomTitleBar;
