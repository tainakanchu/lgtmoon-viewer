import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Random" },
  { to: "/favorites", label: "Favorites" },
  { to: "/ignore-ranges", label: "Ignore Ranges" },
  { to: "/settings", label: "Settings" },
  { to: "/import", label: "Import" },
];

export function Layout() {
  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">lgtmoon Viewer</h1>
        <nav className="app-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link${isActive ? " active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
