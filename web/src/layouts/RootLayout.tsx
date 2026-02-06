import { Outlet } from "react-router";

export default function RootLayout() {
  return (
    <div className="h-screen w-full bg-background">
      <div className="mx-auto h-full max-w-7xl">
        <Outlet />
      </div>
    </div>
  );
}
