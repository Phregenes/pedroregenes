import { Link, NavLink, Outlet, useLocation } from "react-router";
import { LiveClock } from "~/components/live-clock";
import { profile } from "~/data/resume";

const navItems = [
  { to: "/", label: "HOME", code: "00" },
  { to: "/trabalhos", label: "TRABALHOS", code: "01" },
  { to: "/contato", label: "CONTATO", code: "02" },
];

export default function SiteLayout() {
  const year = new Date().getFullYear();
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <div className="relative min-h-dvh flex flex-col">
      <div className="grid-field fixed inset-0 -z-10" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />

      <header className="fixed top-0 inset-x-0 z-40 border-b border-line bg-paper/92 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-5 md:px-8 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="font-bold tracking-tight text-[13px] hover:opacity-60 transition-opacity"
          >
            P.H.R.R
            <span className="text-muted font-normal">/{new Date().getFullYear()}</span>
          </Link>

          <nav className="flex items-center gap-0.5 md:gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  [
                    "tag px-2.5 py-1.5 rounded-sm transition-colors",
                    isActive
                      ? "bg-ink text-paper"
                      : "text-ink/70 hover:text-ink hover:bg-ink/5",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="opacity-50 mr-1">{item.code}/</span>
                    {item.label}
                    {isActive ? <span className="ml-1">■</span> : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2 tag text-muted">
            <span className="size-1.5 rounded-full bg-accent inline-block blink" />
            <span>SP, BR</span>
            <span className="opacity-40">//</span>
            <LiveClock />
          </div>
        </div>
      </header>

      <main className={isHome ? "pt-14" : "flex-1 pt-14"}>
        <Outlet />
      </main>

      {isHome ? null : (
        <footer className="border-t border-line">
          <div className="mx-auto max-w-6xl px-5 md:px-8 py-7 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="tag text-muted">
              © {year} {profile.name} — feito à mão, sem tracking.
            </p>
            <div className="flex items-center gap-5 tag">
              <a
                href={`mailto:${profile.email}`}
                className="hover:text-accent transition-colors"
              >
                EMAIL
              </a>
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-accent transition-colors"
              >
                LINKEDIN
              </a>
              <Link
                to="/contato"
                className="hover:text-accent transition-colors"
              >
                CONTATO
              </Link>
            </div>
            <div className="flex items-center gap-2 tag text-muted">
              <span className="size-1.5 rounded-full bg-accent inline-block" />
              SYSTEM OK
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
