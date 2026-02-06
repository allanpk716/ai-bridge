import { Outlet } from "react-router";
import TopNav from "@/components/TopNav";

export default function MainLayout() {
  return (
    <div className="flex h-screen flex-col">
      <TopNav />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
