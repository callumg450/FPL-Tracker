import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Fixtures' },
  { to: '/team-selector', label: 'Team Selector' },
  { to: '/my-team', label: 'My Team' },
  { to: '/leagues', label: 'Leagues' },
  { to: '/bonus-points', label: 'Bonus Points' },
];

const NavBar = () => {
  const location = useLocation();

  return (
    <nav className="w-full bg-white shadow-lg z-50">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between px-4 py-2 gap-2 sm:gap-0">
        <Link to="/" className="text-2xl font-extrabold text-indigo-700 tracking-tight mb-2 sm:mb-0">FPL Tracker</Link>
        <div className="flex flex-wrap justify-center gap-4 w-full sm:w-auto">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-base font-semibold transition text-indigo-700 hover:text-indigo-900 border-b-2 border-transparent hover:border-indigo-400 px-1 pb-1
                ${location.pathname === link.to ? 'border-indigo-600 text-indigo-900' : ''}
              `}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
