import { Outlet } from "react-router-dom";
import AdminNavbar from "./components/AdminNavbar";

// Shell for all /admin/* pages. Uses its own navbar (no citizen Navbar/Footer)
// so the admin experience is visually and functionally separate (§6).
export default function AdminLayout() {
  return <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
    <AdminNavbar />
    <main className="flex-1 pt-20">
      <Outlet />
    </main>
  </div>;
}
