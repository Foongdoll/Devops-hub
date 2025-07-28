import { useNavigate } from "react-router-dom";
import { useJoin } from "../customhook/useJoin";
import { motion, number } from "framer-motion";
import React, { useEffect, useRef } from "react";
type CircleType = {
  key: number;
  style: React.CSSProperties; // 또는 style 구조에 맞는 타입 명시
};
// (1) 로그인에서 사용한 AnimatedCircles 재사용 (공통 파일로 분리해도 됨!)
const AnimatedCircles = React.memo(function AnimatedCircles({ count = 10 }: { count: number }) {
  const circlesRef = useRef<CircleType[]>([]);

  if (!circlesRef.current) {
    const colorArr = [
      ['#e0c3fc', '#8ec5fc'],
      ['#a0c4ff', '#b3c1f7'],
      ['#c3aed6', '#fbc2eb'],
      ['#a1c4fd', '#c2e9fb'],
      ['#fcb7af', '#e8defa'],
    ];
    circlesRef.current = Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 200 + 140;
      const left = Math.random() * 80 + 5;
      const top = Math.random() * 65 + 10;
      const duration = Math.random() * 7 + 7;
      const delay = Math.random() * 4;
      const blur = Math.floor(Math.random() * 6) * 4;
      const colors = colorArr[Math.floor(Math.random() * colorArr.length)];
      return {
        key: i,
        style: {
          width: size,
          height: size,
          left: `${left}%`,
          top: `${top}%`,
          filter: `blur(${blur}px)`,
          background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
          opacity: 0.15 + Math.random() * 0.2,
          animation: `float${i} ${duration}s ease-in-out ${delay}s infinite alternate`,
        }
      };
    });
  }

  useEffect(() => {
    if (!document.getElementById('animated-circle-keyframes')) {
      const style = document.createElement('style');
      style.id = 'animated-circle-keyframes';
      let css = '';
      for (let i = 0; i < count; i++) {
        const x = Math.random() * 80 - 40;
        const y = Math.random() * 60 - 30;
        const scale = 1 + Math.random() * 0.5;
        css += `
        @keyframes float${i} {
          0% { transform: translate(0,0) scale(1);}
          40% { transform: translate(${x / 2}px,${y / 2}px) scale(${(scale + 1) / 2});}
          80% { transform: translate(${-x / 2}px,${-y / 2}px) scale(${(scale + 1.2) / 2});}
          100% { transform: translate(${x}px,${y}px) scale(${scale});}
        }
        `;
      }
      style.innerHTML = css;
      document.head.appendChild(style);
    }
  }, [count]);

  return (
    <div
      className="absolute w-full h-full top-0 left-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {circlesRef.current.map(c =>
        <div key={c.key} className="absolute rounded-full pointer-events-none will-change-transform" style={c.style} />
      )}
    </div>
  );
});

const Join = () => {
  const navigate = useNavigate();
  const { userId, setUserId, userPw, setUserPw, userName, setUserName, handleJoin } = useJoin({ navigate });

  return (
    <div
      className="fixed left-0 w-full flex items-center justify-center bg-transparent select-none overflow-hidden"
      style={{
        top: '40px',
        height: 'calc(100vh - 40px)',
        minHeight: '360px',
        zIndex: 1,
      }}
    >
      {/* 역동적인 배경 */}
      <AnimatedCircles count={10} />

      {/* 회원가입 폼 */}
      <motion.div
        className="w-[350px] md:w-[370px] bg-white rounded-2xl shadow-2xl p-8 md:p-10 flex flex-col items-center relative z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 60, damping: 13 }}
      >
        <div className="text-2xl font-bold text-[#6f52e4] mb-3">회원가입</div>
        <form className="w-full" onSubmit={handleJoin} autoComplete="off">
          <motion.input
            type="text"
            placeholder="아이디"
            className="w-full mb-3 px-4 py-2 rounded bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-[#7e4cff] transition"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            required
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.17, duration: 0.36 }}
          />
          <motion.input
            type="password"
            placeholder="비밀번호"
            className="w-full mb-3 px-4 py-2 rounded bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-[#7e4cff] transition"
            value={userPw}
            onChange={e => setUserPw(e.target.value)}
            required
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.23, duration: 0.36 }}
          />
          <motion.input
            type="text"
            placeholder="이름"
            className="w-full mb-5 px-4 py-2 rounded bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-[#7e4cff] transition"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            required
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.29, duration: 0.36 }}
          />
          <motion.button
            type="submit"
            className="w-full bg-gradient-to-r from-[#7e4cff] to-[#6e70f2] text-white font-bold py-2 rounded-xl shadow-lg hover:from-[#8b5cf6] hover:to-[#7e4cff] transition focus:scale-105 active:scale-95"
            whileHover={{ scale: 1.04, boxShadow: "0 2px 24px #b3c1f7" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 220, damping: 13 }}
          >
            가입하기
          </motion.button>
        </form>
        <div className="mt-8 text-xs text-gray-400">
          이미 계정이 있으신가요?{" "}
          <button
            className="text-[#7e4cff] underline hover:text-[#6e70f2] transition cursor-pointer"
            onClick={() => navigate("/login")}
          >
            로그인
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Join;
