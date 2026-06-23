import { IconBriefcase, IconDatabase, IconMessage } from "@tabler/icons-react";
import { NavLink } from "react-router";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/chat", label: "Chat", icon: IconMessage },
  { to: "/kb", label: "Knowledge base", icon: IconDatabase },
];

export function Header() {
  return (
    <div className="mx-auto flex h-14 max-w-2xl items-center justify-between border-b border-border px-2">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-chip-bg">
          <IconBriefcase className="size-4 text-chip-text" aria-hidden="true" />
        </span>
        <p className="text-base font-medium text-foreground">Career Copilot</p>
      </div>

      <nav className="flex items-center gap-0.5 rounded-lg bg-secondary p-0.5">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
                isActive
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
