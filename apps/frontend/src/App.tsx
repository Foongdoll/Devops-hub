import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx'; // 이후 만들 컴포넌트
import { NotifyProvider } from './common/context/GlobalNotifyContext.tsx'; 

const App = () => {
  return (    
    <BrowserRouter>
      <NotifyProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* <Route path="/*" element={<Dashboard />} /> */}
      </Routes>
      </NotifyProvider>
    </BrowserRouter>
  );
}
export default App;