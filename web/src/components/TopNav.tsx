export default function TopNav() {
  return (
    <header className="border-b bg-background shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold">AI-Bridge</h1>
        </div>

        {/* Breadcrumb placeholder - center */}
        <div className="flex-1 px-8">
          <div className="text-sm text-muted-foreground">Navigation</div>
        </div>

        {/* Connection status placeholder - right */}
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-gray-300" />
          <span className="ml-2 text-sm text-muted-foreground">Disconnected</span>
        </div>
      </div>
    </header>
  );
}
