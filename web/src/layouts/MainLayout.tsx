import { Outlet } from "react-router";
import TopNav from "@/components/TopNav";
import { Sidebar } from "@/components/Sidebar";

export default function MainLayout() {
  return (
    <>
      {/* Sidebar (fixed position, hidden on mobile) */}
      <Sidebar />

      {/* Main content wrapper */}
      <div className="flex h-screen flex-col md:pl-80">
        <TopNav />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </>
  );
}
