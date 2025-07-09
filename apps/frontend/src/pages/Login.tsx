import React, { useState } from 'react';

const Login: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // const response = await axios.post('/api/auth/login', {
      //   userId,
      //   password,
      // });

      // const { token } = response.data;
      // localStorage.setItem('jwt', token); // JWT 저장
      // window.location.href = '/'; // 로그인 후 메인으로 이동
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인 실패');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-4">로그인</h2>

        <input
          type="text"
          placeholder="아이디"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full mb-3 p-2 border border-gray-300 rounded"
          required
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded"
          required
        />

        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          로그인
        </button>
      </form>
    </div>
  );
};

export default Login;
