import { useState } from 'react';
import { ArrowUpRight, Globe2, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <header className="site-header">
    <div className="nav-inner"><Logo />
      <nav className={`nav-links ${open ? 'nav-open' : ''}`}>
        <a href="#products" onClick={close}>Products <span></span></a>
        <a href="#developers" onClick={close}>Developers <span></span></a>
        <a href="#solutions" onClick={close}>Solutions <span></span></a>
        <a href="#pricing" onClick={close}>Pricing</a>
        <a href="#resources" onClick={close}>Resources <span></span></a>
      </nav>
      <div className="nav-actions"><span className="locale"><Globe2 size={16} /> IN <span></span></span><Link className="nav-login" to="/login">Log in</Link><Link className="button button-lime nav-cta" to="/signup">Get Started <ArrowUpRight size={17} /></Link></div>
      <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
    </div>
  </header>;
}
