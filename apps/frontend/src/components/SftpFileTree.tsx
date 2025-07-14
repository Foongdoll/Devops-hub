import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

interface Entry {
  name: string;
  type: '-' | 'd' | 'l'; // '-'=file, 'd'=directory
}

interface ListData {
  remotePath: string;
  list: Entry[];
}

export function SftpFileTree({ basePath }: { basePath: string }) {
  const { socket, emit } = useSocket();
  const [tree, setTree] = useState<Record<string, Entry[]>>({});
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set());

  // 1) 서버로부터 받은 디렉터리 리스트
  useEffect(() => {
    if (!socket) return;
    const onData = ({ remotePath, list }: ListData) => {
      setTree(prev => ({ ...prev, [remotePath]: list }));
    };
    socket.on('sftp-list-data', onData);
    return () => { socket.off('sftp-list-data', onData); };
  }, [socket]);

  // 2) 디렉터리 열기/닫기
  const toggleDir = (path: string) => {
    const next = new Set(openDirs);
    if (next.has(path)) next.delete(path);
    else {
      next.add(path);
      // 읽지 않았으면 서버에 요청
      if (!tree[path]) emit('sftp-list', { remotePath: path });
    }
    setOpenDirs(next);
  };

  // 3) drop 이벤트 (파일 업로드)
  const handleDrop = useCallback((e: React.DragEvent, dir: string) => {
    e.preventDefault();
    for (let f of Array.from(e.dataTransfer.files)) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        emit('sftp-upload', { remotePath: dir, fileName: f.name, data: base64 });
      };
      reader.readAsDataURL(f);
    }
  }, [emit]);

  // 4) 재귀 렌더 함수
  const renderTree = (path: string) => {
    const list = tree[path] || [];
    return (
      <ul className="ml-4">
        {list.map(entry => {
          const fullPath = path.endsWith('/')
            ? path + entry.name
            : path + '/' + entry.name;
          if (entry.type === 'd') {
            const isOpen = openDirs.has(fullPath);
            return (
              <li key={fullPath}>
                <div
                  className="flex items-center cursor-pointer select-none"
                  onClick={() => toggleDir(fullPath)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, fullPath)}
                >
                  {isOpen ? <ChevronDown /> : <ChevronRight />}
                  <Folder className="ml-1 mr-1" /> {entry.name}
                </div>
                {isOpen && renderTree(fullPath)}
              </li>
            );
          } else {
            return (
              <li key={fullPath} className="flex items-center ml-6">
                <File className="mr-1" /> {entry.name}
              </li>
            );
          }
        })}
      </ul>
    );
  };

  // 초기 로드
  useEffect(() => {
    emit('sftp-list', { remotePath: basePath });
  }, [basePath, emit]);

  return (
    <div className="text-sm text-gray-200 overflow-y-auto p-2 bg-[#2b2540] rounded">
      {renderTree(basePath)}
    </div>
  );
}