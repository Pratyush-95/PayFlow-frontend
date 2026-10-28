import { Link } from 'react-router-dom';
export default function Logo() {
  return <Link to="/" className="brand"><span className="brand-mark">P</span><span>PayFlow<span className="brand-dot">.</span></span></Link>;
}
