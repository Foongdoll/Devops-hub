import React from 'react';
import { useSocket } from '../context/SocketContext';

const SocketStatus: React.FC = () => {
  const { isConnected } = useSocket();

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
        {isConnected ? '연결됨' : '연결 끊김'}
      </span>
    </div>
  );
};

export default SocketStatus;
