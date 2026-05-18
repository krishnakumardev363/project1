// import { Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// export default function Navbar() {
//   const { user, logout } = useAuth();

//   return (
//     <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
//       <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
//         <Link to="/" className="font-mono text-brand-400 font-medium tracking-tight">
//           Note<span className="text-slate-500">Nest</span>
//         </Link>

//         <nav className="flex items-center gap-3">
//           {user ? (
//             <>
//               <span className="text-sm text-slate-400 hidden sm:block">
//                 Hey, <span className="text-slate-200">{user.name}</span>
//               </span>
//               <Link to="/dashboard" className="btn-outline text-xs px-3 py-1.5">
//                 Dashboard
//               </Link>
//               <button onClick={logout} className="btn-danger text-xs px-3 py-1.5">
//                 Logout
//               </button>
//             </>
//           ) : (
//             <>
//               <Link to="/login" className="btn-outline text-xs px-3 py-1.5">
//                 Login
//               </Link>
//               <Link to="/register" className="btn-primary text-xs px-3 py-1.5">
//                 Sign Up
//               </Link>
//             </>
//           )}
//         </nav>
//       </div>
//     </header>
//   );
// }

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-xs px-3 py-1.5 rounded-lg transition-all font-medium ${
        pathname === to
          ? "bg-brand-500/15 text-brand-400 border border-brand-500/20"
          : "text-slate-400 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-mono text-brand-400 font-medium tracking-tight">
          Note<span className="text-slate-500">Nest</span>
        </Link>

        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-slate-400 hidden sm:block mr-1">
                Hey, <span className="text-slate-200">{user.name}</span>
              </span>
              {navLink("/dashboard", "Dashboard")}
              {navLink("/budget", "💰 Budget")}
              <button onClick={logout} className="btn-danger text-xs px-3 py-1.5">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-outline text-xs px-3 py-1.5">Login</Link>
              <Link to="/register" className="btn-primary text-xs px-3 py-1.5">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
