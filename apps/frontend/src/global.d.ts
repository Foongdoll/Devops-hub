// src/global.d.ts
import * as React from 'react';

declare module 'react' {
  interface InputHTMLAttributes<T> {
    /** Chrome·Edge 계열에서 폴더 선택을 허용하기 위한 속성 */
    webkitdirectory?: boolean;
    /** 마찬가지로 폴더 선택 속성 */
    directory?: boolean;
  }
}
