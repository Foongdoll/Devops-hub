import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = () => (
  <div className="flex h-screen bg-[#3f2256]">
    {/* Sidebar */}
    <Sidebar />
    {/* Main */}
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <div className="flex-1 overflow-auto">
        <Outlet />   반드시 이 자리에서만!
      </div>
    </div>
  </div>
);

export default DashboardLayout;
