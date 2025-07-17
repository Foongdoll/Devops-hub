import { useNavigate } from 'react-router-dom';
import { useLogin } from '../customhook/useLogin';

const Login = () => {
  const navigate = useNavigate();
  const {
    userId, setUserId,
    userPw, setUserPw,
    handleLogin
  } = useLogin({ navigate });

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-tr from-[#e8defa] to-[#b3c1f7]">
      <div className="w-[370px] bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
        {/* 로고 */}
        <div className="mb-4">
          <span className="w-15 h-15 rounded-full mr-2 flex items-center justify-center text-[2rem] bg-[#e8e5fd] border border-[#b9b3e3] shadow">
            🛠️
          </span>
        </div>
        {/* 환영 메시지 */}
        <div className="text-2xl font-bold text-[#6f52e4] mb-2">DevOps Hub</div>
        <div className="text-gray-500 mb-8 text-sm text-center">
          안녕하세요! <br />DevOps Hub에 로그인해주세요.
        </div>
        {/* 폼 */}
        <form className="w-full" onSubmit={handleLogin} autoComplete="off">
          <input
            type="text"
            placeholder="아이디"
            className="w-full mb-3 px-4 py-2 rounded bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-[#7e4cff] transition"
            value={userId}
            onChange={e => setUserId(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full mb-5 px-4 py-2 rounded bg-gray-100 border focus:outline-none focus:ring-2 focus:ring-[#7e4cff] transition"
            value={userPw}
            onChange={e => setUserPw(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            // loading은 전역(GlobalUI)에서 관리, 버튼은 전역 컨텍스트에서 disabled 제어
            className="w-full bg-gradient-to-r from-[#7e4cff] to-[#6e70f2] text-white font-bold py-2 rounded-xl shadow-lg hover:from-[#8b5cf6] hover:to-[#7e4cff] transition"
          >
            로그인
          </button>
        </form>
        {/* 하단 링크 */}
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
      </div>
    </div>
  );
};

export default Login;