import { Outlet } from "react-router";
import TopNav from "@/components/TopNav";
import { Sidebar } from "@/components/Sidebar";

export default function MainLayout() {
  return (
    <div className="flex h-screen flex-col">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (fixed position, hidden on mobile) */}
        <Sidebar />

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 md:pl-80">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
