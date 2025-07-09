import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx'; // 이후 만들 컴포넌트


const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* <Route path="/*" element={<Dashboard />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
export default App;