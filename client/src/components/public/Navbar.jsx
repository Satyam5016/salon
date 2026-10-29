import { CalendarCheck, Menu, Scissors, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { navLinks } from '../../data/navigation.js';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `rounded-full px-3.5 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-rosewood text-white shadow-sm' : 'text-neutral-700 hover:bg-pearl hover:text-rosewood'
    }`;

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-champagne/60 bg-ivory/88 shadow-sm backdrop-blur-xl">
      <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" to="/" onClick={closeMenu}>
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-rosewood to-ink text-white shadow-soft">
            <Scissors className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold leading-5 text-ink">Bliss Beauty</span>
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-blush">Salon</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink className={linkClass} key={link.href} to={link.href}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden lg:block">
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-ink"
            to="/book"
          >
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            Book Now
          </Link>
        </div>

        <button
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-white text-ink shadow-sm ring-1 ring-champagne/70 lg:hidden"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </nav>

      {isOpen ? (
        <div className="border-t border-champagne/70 bg-white/96 px-4 py-4 shadow-salon backdrop-blur-xl lg:hidden">
          <div className="grid gap-2">
            {navLinks.map((link) => (
              <NavLink className={linkClass} key={link.href} to={link.href} onClick={closeMenu}>
                {link.label}
              </NavLink>
            ))}
            <Link
              className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-white shadow-soft"
              to="/book"
              onClick={closeMenu}
            >
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
              Book Now
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}

export default Navbar;
