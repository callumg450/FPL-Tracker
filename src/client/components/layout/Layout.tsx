import NavBar from './NavBar';
import { ReactNode } from 'react';

const Footer = () => (
  <footer className="w-full bg-indigo-50 border-t border-indigo-100 text-center py-4 mt-12 text-sm text-gray-500">
    <span>
      &copy; {new Date().getFullYear()} FPL Tracker &mdash; Not affiliated with the Premier League. Built by FPL fans.
    </span>
  </footer>
);

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200">
    <NavBar />
    <main className="flex-1 w-full max-w-6xl mx-auto px-2 pt-4 pb-8">
      {children}
    </main>
    <Footer />
  </div>
);

export default Layout;
