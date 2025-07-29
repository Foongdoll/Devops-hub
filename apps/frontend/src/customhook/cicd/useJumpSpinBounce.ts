import { useEffect } from "react";
import { useAnimation } from "framer-motion";

export function useJumpSpinBounce() {
  const controls = useAnimation();

  useEffect(() => {
    let jumpInterval: NodeJS.Timeout;

    const startBounce = () => {
      controls.start({
        y: [0, -7, 0, -3, 0],
        rotate: 0,
        transition: { duration: 1.2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
      });
    };

    const triggerJumpSpin = () => {
      controls.start({
        y: [0, -30, 0],
        rotate: [0, 360, 0],
        transition: { duration: 0.8, ease: "easeInOut" }
      }).then(startBounce);
    };

    startBounce();
    jumpInterval = setInterval(triggerJumpSpin, Math.random() * 4000 + 5000);

    return () => {
      clearInterval(jumpInterval);
      controls.stop();
    };
  }, [controls]);

  return controls;
}
