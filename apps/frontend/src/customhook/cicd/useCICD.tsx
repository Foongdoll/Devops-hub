import { useState } from "react";

export type CicdTab = "main" | "manage"



export const useCICD = () => {
  const [tab, setTab] = useState<CicdTab>("main");


  return {
    tab, setTab
  };
};
