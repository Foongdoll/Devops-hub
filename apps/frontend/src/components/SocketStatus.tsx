import React from 'react';
import { useSocket } from '../context/SocketContext';

const SocketStatus: React.FC = () => {
  const { isConnected } = useSocket();

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* 🔴 상태 원 */}
      <div className="relative w-3 h-3">
        {/* Animated Circle */}
        <div
          className={`
            absolute inset-0 rounded-full 
            ${isConnected ? 'bg-green-400 animate-ping' : 'bg-red-400 opacity-50 scale-75'}
          `}
        />
        {/* Inner Circle */}
        <div
          className={`
            relative w-3 h-3 rounded-full 
            border-2 
            ${isConnected ? 'border-green-500 bg-green-300 animate-bounce' : 'border-red-500 bg-red-400'}
          `}
        />
      </div>

      {/* 🔤 상태 텍스트 */}
      <span className={isConnected ? 'text-green-500 font-semibold' : 'text-red-500 italic'}>
        {isConnected ? '연결됨' : '연결 끊김'}
      </span>
    </div>
  );
};

export default SocketStatus;
