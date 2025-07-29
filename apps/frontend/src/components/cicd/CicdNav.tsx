import { motion } from "framer-motion";
import { Settings, LayoutDashboard, Wrench } from "lucide-react";
import type { CicdTab } from "../../customhook/cicd/useCICD";
import type { JSX } from "react";

interface CicdNavProp {
  tab: CicdTab;
  setTab: (tab: CicdTab) => void;
}


const tabs: { key: CicdTab; label: string; icon: JSX.Element }[] = [
  { key: "main", label: "Main", icon: <LayoutDashboard size={16} /> },
  { key: "manage", label: "Manage", icon: <Settings size={16} /> },
  { key: "config", label: "Config", icon: <Wrench size={16}  /> }, // key/label 전부 새롭게
];
export const CicdNav: React.FC<CicdNavProp> = ({ tab, setTab }) => {
  return (
    <div className="w-full px-4 py-2 bg-gradient-to-r from-[#e2ccff] to-[#c193ff] rounded-xl shadow-inner">
      <ul className="flex gap-2 items-center">
        {tabs.map(({ key, label, icon }) => {
          const isActive = tab === key;
          return (
            <motion.li
              key={key}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <button
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all
                  ${isActive
                    ? "bg-white text-purple-700 shadow-md"
                    : "text-white/90 hover:bg-white/20"
                  }`}
              >
                <motion.span
                  animate={{
                    y: [0, -2, 0],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.6,
                    ease: "easeInOut",
                    delay: Math.random(),
                  }}
                  whileHover={{
                    rotate: [0, 360],
                    transition: { duration: 0.5 },
                  }}
                >
                  {icon}
                </motion.span>
                {label}
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
};
