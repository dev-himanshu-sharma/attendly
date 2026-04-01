import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* 1. Sidebar: Fixed width, stays on the left */}
      <div className="sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* 2. Main Content: Fills the remaining space */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* Max-width container keeps content from stretching too far on giant monitors */}
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}