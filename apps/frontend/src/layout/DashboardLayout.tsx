import Sidebar from './Sidebar';
import TopBar from './TopBar';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen bg-[#3f2256]">
    {/* Sidebar */}
    <Sidebar />
    {/* Main */}
    <div className="flex-1 flex flex-col bg-white">
      <TopBar />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  </div>
);

export default DashboardLayout;
