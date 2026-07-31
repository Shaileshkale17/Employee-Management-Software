import { NavLink } from "react-router-dom";

const sidebarItems = [
  { name: "Overview", path: "/overview" },
  { name: "Task", path: "/task" },
  { name: "Message", path: "/message" },
  { name: "Meeting", path: "/meeting" },
  { name: "Attendance Info", path: "/attendance" },
  { name: "Leaves", path: "/leaves" },
  { name: "Report", path: "/report" },
  { name: "Event", path: "/event" },
  { name: "Search Employees", path: "/search" },
  { name: "Notifications", path: "/notifications" },
];

const SideNavbar = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto scrollbar-thin">
      <nav className="p-3">
        <ul className="space-y-1">
          {sidebarItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`
                }>
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default SideNavbar;
