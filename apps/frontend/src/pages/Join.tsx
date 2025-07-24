// src/pages/Join.tsx
import { useNavigate } from "react-router-dom";
import { useJoin } from "../customhook/useJoin";

const Join = () => {
  const navigate = useNavigate();
  const { userId, setUserId, userPw, setUserPw, userName, setUserName, handleJoin } = useJoin({ navigate });

  return (
    <div className="h-[calc(100vh-40px)] flex flex-col justify-center items-center bg-gradient-to-tr from-[#e8defa] to-[#b3c1f7]">
      <div className="w-[370px] bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
        <div className="text-2xl font-bold text-[#6f52e4] mb-3">회원가입</div>
        <form className="w-full" onSubmit={handleJoin}>
          <input type="text" placeholder="아이디" className="w-full mb-3 px-4 py-2 rounded bg-gray-100 border" value={userId} onChange={e => setUserId(e.target.value)} required />
          <input type="password" placeholder="비밀번호" className="w-full mb-3 px-4 py-2 rounded bg-gray-100 border" value={userPw} onChange={e => setUserPw(e.target.value)} required />
          <input type="text" placeholder="이름" className="w-full mb-5 px-4 py-2 rounded bg-gray-100 border" value={userName} onChange={e => setUserName(e.target.value)} required />
          <button type="submit" className="w-full bg-gradient-to-r from-[#7e4cff] to-[#6e70f2] text-white font-bold py-2 rounded-xl shadow-lg hover:from-[#8b5cf6] hover:to-[#7e4cff] transition">
            가입하기
          </button>
        </form>
        <div className="mt-8 text-xs text-gray-400">
          이미 계정이 있으신가요? <button className="text-[#7e4cff] underline hover:text-[#6e70f2] transition cursor-pointer" onClick={() => navigate("/login")}>로그인</button>
        </div>
      </div>
    </div>
  );
};

export default Join;
