import { useNavigate } from 'react-router-dom';
import { useLogin } from '../customhook/useLogin';
import { motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

// 1. AnimatedCircles를 React.memo로 감싸서 렌더링 최적화
const AnimatedCircles = React.memo(function AnimatedCircles({ count = 8 }) {
  // 2. circles를 useRef로 생성 (한번만)
  const circlesRef = useRef(null);

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

  // 3. 키프레임도 마운트 한 번만
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
    // cleanup은 불필요(처음 1회만 생성, unmount시만 제거해도 됨)
    // eslint-disable-next-line
  }, []);

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

export default function Login() {
  const navigate = useNavigate();
  const { userId, setUserId, userPw, setUserPw, handleLogin } = useLogin({ navigate });

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
      {/* (1) 움직이는 역동적인 배경: 오직 마운트 1회만 생성! */}
      <AnimatedCircles count={10} />

      {/* (2) 로그인 폼 */}
      <motion.div
        className="w-[350px] md:w-[370px] bg-white rounded-2xl shadow-2xl p-8 md:p-10 flex flex-col items-center relative z-10"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 60, damping: 13 }}
      >
        <motion.span
          className="w-16 h-16 rounded-full mb-4 flex items-center justify-center text-[2rem] bg-[#e8e5fd] border border-[#b9b3e3] shadow"
          initial={{ scale: 0.8, y: -14, rotate: -10 }}
          animate={{ scale: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 10, duration: 0.8 }}
        >
          🛠️
        </motion.span>
        <div className="text-2xl font-bold text-[#6f52e4] mb-2">DevOps Hub</div>
        <div className="text-gray-500 mb-8 text-sm text-center">
          안녕하세요! <br />DevOps Hub에 로그인해주세요.
        </div>
        <form className="w-full" onSubmit={handleLogin} autoComplete="off">
          <motion.input
            type="text"
            placeholder="아이디"
            className="w-full mb-3 px-4 py-2 rounded bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-[#7e4cff] transition"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            required
            autoFocus
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.36 }}
          />
          <motion.input
            type="password"
            placeholder="비밀번호"
            className="w-full mb-5 px-4 py-2 rounded bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-[#7e4cff] transition"
            value={userPw}
            onChange={e => setUserPw(e.target.value)}
            required
            autoComplete="current-password"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.36 }}
          />
          <motion.button
            type="submit"
            className="w-full bg-gradient-to-r from-[#7e4cff] to-[#6e70f2] text-white font-bold py-2 rounded-xl shadow-lg hover:from-[#8b5cf6] hover:to-[#7e4cff] transition focus:scale-105 active:scale-95"
            whileHover={{ scale: 1.04, boxShadow: "0 2px 24px #b3c1f7" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 220, damping: 13 }}
          >
            로그인
          </motion.button>
        </form>
        <div className="mt-8 text-xs text-gray-400">
          계정이 없으신가요?{" "}
          <button
            type="button"
            className="text-[#7e4cff] underline focus:outline-none hover:text-[#6e70f2] transition cursor-pointer"
            onClick={() => navigate("/join")}
            tabIndex={0}
          >
            회원가입
          </button>
        </div>
      </motion.div>
    </div>
  );
}
