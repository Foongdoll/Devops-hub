import { MoreVertical, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { useCICDSocket } from "../../context/CICDSocketContext";
import type { CicdSocketResponse, Session } from "../../customhook/cicd/useCICD";

interface CicdMainProp {
  sessions: Session[], 
  setSessions: (ss: Session[]) => void,
  onInitSessions: () => void;
  serverIconAnim: ReturnType<typeof useAnimation>; // or ReturnType<typeof useAnimation>
  onConfigTabMove: (s: Session) => void;
}


export const CicdMain: React.FC<CicdMainProp> = ({ sessions, setSessions, onInitSessions, serverIconAnim, onConfigTabMove }) => {
  const { on, off } = useCICDSocket();


  useEffect(() => {
    onInitSessions();

    const onInitSessions_Response = (data: CicdSocketResponse) => {
      if (data?.data && Array.isArray(data.data)) {
        setSessions(data.data as Session[]);
      } else {
        setSessions([]);
      }
    };
    on("onInitSessions_Response", onInitSessions_Response);

    return () => {
      off("onInitSessions_Response", onInitSessions_Response);
    };
  }, [on, off, onInitSessions]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <motion.span animate={serverIconAnim} className="inline-block">
          <Server size={32} className="text-violet-600 drop-shadow-sm" />
        </motion.span>
        <h2 className="text-2xl font-extrabold text-purple-900 tracking-tight">
          등록된 서버
        </h2>
      </div>
      <ul className="space-y-3">
        {sessions.length === 0 ? (
          <li className="text-gray-400 bg-white py-8 rounded-xl text-center shadow-inner">
            등록된 서버가 없습니다.
          </li>
        ) : (
          sessions.map((s) => (
            <li
              key={s.id}
              className="group bg-gradient-to-r from-violet-50 to-purple-100 border border-purple-200 hover:border-violet-400 hover:shadow-xl p-5 rounded-xl flex flex-col md:flex-row md:items-center gap-3 transition-all"
            >
              <div className="flex-1">
                <div className="font-semibold text-lg text-indigo-800 flex items-center gap-2">
                  <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
                  {s.label}
                </div>
                <div className="text-sm text-gray-600 mt-1 flex justify-between">
                  <div>
                    <span className="inline-block bg-purple-200 text-purple-900 px-2 py-0.5 rounded mr-1 font-mono">{s.type}</span>
                    <span className="inline-block bg-violet-200 text-violet-900 px-2 py-0.5 rounded mr-1 font-mono">{s.platform}</span>
                    <span className="font-mono text-gray-700">{s.host}</span>
                  </div>
                  <div className="items-center">
                    <button type="button" onClick={e => {
                      onConfigTabMove(s);
                    }}>
                      <MoreVertical />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};
