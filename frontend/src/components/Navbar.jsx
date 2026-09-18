import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { name: "Dashboard", path: "/" },
    { name: "Members", path: "/members" },
    { name: "Trainers", path: "/trainers" },
    { name: "Memberships", path: "/memberships" },
    { name: "Payments", path: "/payments" },
    { name: "Workouts", path: "/workouts" },
    { name: "Exercises", path: "/exercises" },
    { name: "Categories", path: "/categories" },
    { name: "Progress", path: "/progress" },
    { name: "Attendance", path: "/attendance" }
  ];

  const handleNavigation = () => {
    setMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[#050d14] px-4 text-white lg:hidden">
        <Link to="/" onClick={handleNavigation}>
          <h1 className="text-lg font-black tracking-[0.1em]">
            MASADAVERSE
          </h1>

          <p className="text-[8px] font-medium tracking-[0.16em] text-[#a3e635]">
            YOUR WORLD OF STRENGTH
          </p>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-lg text-white transition hover:bg-white/10"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="fixed left-0 top-16 z-40 w-full border-b border-white/10 bg-[#050d14] px-4 py-4 text-white shadow-2xl lg:hidden">
          <nav className="grid grid-cols-2 gap-2">
            {links.map((link) => {
              const active = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={handleNavigation}
                  className={`rounded-lg px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-[#a3e635] text-[#07100a]"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-white/10 bg-[#050d14] text-white lg:block">
        <div className="flex h-full flex-col">

          <div className="border-b border-white/10 px-6 py-6">
            <Link to="/">
              <h1 className="text-xl font-black tracking-[0.12em]">
                MASADAVERSE
              </h1>

              <p className="mt-1 text-[9px] font-medium tracking-[0.18em] text-[#a3e635]">
                YOUR WORLD OF STRENGTH
              </p>
            </Link>
          </div>

          <div className="px-4 pt-6">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Main Menu
            </p>

            <nav className="space-y-1">
              {links.map((link) => {
                const active = location.pathname === link.path;

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-[#a3e635] text-[#07100a]"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-white/10 px-5 py-5">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
              Gym Management System
            </p>

            <p className="mt-1 text-xs font-medium text-slate-400">
              MASADAVERSE
            </p>
          </div>

        </div>
      </aside>
    </>
  );
}

export default Navbar;