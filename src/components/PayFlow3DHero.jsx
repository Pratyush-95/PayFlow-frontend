import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, CreditCard, Globe2, Link2, ShieldCheck, Store, Wallet, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  { title: 'UPI', subtitle: 'Instant payments', icon: Zap, cls: 'tile-upi', delay: 0.25 },
  { title: 'Payment Links', subtitle: 'Share & get paid', icon: Link2, cls: 'tile-links', delay: 0.55 },
  { title: 'Cards', subtitle: 'Flexible checkout', icon: CreditCard, cls: 'tile-cards', delay: 0.8 },
  { title: 'Global Payments', subtitle: 'Built to scale', icon: Globe2, cls: 'tile-global', delay: 1.05 },
  { title: 'Net Banking', subtitle: 'Direct transfers', icon: Wallet, cls: 'tile-banking', delay: 1.25 },
];

function PhoneMockup() {
  const bars = [24, 37, 31, 52, 45, 66, 58, 82, 72, 96];
  return <motion.div className="phone-3d-wrap" initial={{ opacity: 0, y: 100, rotateY: -26, rotateZ: 8 }} animate={{ opacity: 1, y: 0, rotateY: -12, rotateZ: -7 }} transition={{ duration: 1.25, delay: .25, ease: 'easeOut' }}>
    <div className="phone-3d">
      <div className="phone-island" /><div className="phone-status"><span>9:41</span><span>● ▮ ▰</span></div>
      <div className="phone-brand"><span className="mini-mark">P</span> payflow<span className="brand-dot">.</span><span className="phone-bell">♧</span></div>
      <div className="phone-label">Total payments</div><div className="phone-amount">₹2,48,930</div><div className="phone-growth">↗ 18.5% <span>this month</span></div>
      <div className="phone-chart">{bars.map((h, i) => <motion.i key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: .65, delay: .8 + i * .07 }} />)}</div>
      <div className="phone-months"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
      <div className="phone-line" />
      {[['✓', 'Payment received', '+₹2,499', '2 min ago'], ['▣', 'Order paid', '+₹1,299', '10 min ago'], ['↻', 'Subscription', '+₹499', '1 hour ago']].map((item) => <div className="phone-row" key={item[1]}><span className="phone-row-icon">{item[0]}</span><div><b>{item[1]}</b><small>{item[3]}</small></div><strong>{item[2]}</strong></div>)}
      <div className="phone-tabs"><span>⌂<small>Home</small></span><span>▥<small>Analytics</small></span><span>▣<small>Payments</small></span><span>☰<small>More</small></span></div>
    </div>
  </motion.div>;
}

export default function PayFlow3DHero() {
  return <section className="hero" id="top">
    <div className="hero-backdrop" /><div className="hero-glow hero-glow-a" /><div className="hero-glow hero-glow-b" />
    <div className="hero-main">
      <div className="hero-copy">
        <motion.div className="trust-pill" initial={{ opacity: 0, x: -22 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .65 }}><Zap size={14} fill="currentColor" /> PAYMENT INFRASTRUCTURE FOR THE FUTURE</motion.div>
        <motion.h1 initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .12 }}>Payments<br />that move<br /><span>your world.</span></motion.h1>
        <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .3 }}>Accept, manage and grow with powerful payment infrastructure built for modern businesses.</motion.p>
        <motion.div className="hero-ctas" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .45 }}><Link className="button button-lime hero-primary" to="/signup">Start accepting payments <ArrowRight size={18} /></Link><a className="button button-glass" href="#contact">Talk to sales</a></motion.div>
        <motion.div className="hero-rating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .75 }}><div className="avatar-stack"><span>AK</span><span>SR</span><span>PM</span><span>JD</span><span>RK</span></div><div className="rating-divider" /><div><div className="stars">★★★★★ <b>4.9/5</b></div><small>Payment platform UI preview</small></div></motion.div>
      </div>
      <div className="hero-visual" aria-label="Illustration of PayFlow payment dashboard">
        <div className="globe-scene"><div className="globe-latitudes" /><div className="globe-grid" /><div className="globe-shine" /></div>
        <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
        <motion.div className="success-medallion" initial={{ scale: .2, opacity: 0 }} animate={{ scale: 1, opacity: 1, rotate: [0, 8, 0] }} transition={{ scale: { delay: .65, type: 'spring' }, rotate: { duration: 6, repeat: Infinity } }}><Check size={31} /></motion.div>
        {features.map((item) => { const Icon = item.icon; return <motion.div key={item.title} className={`feature-tile ${item.cls}`} initial={{ opacity: 0, scale: .65, y: 35, rotateY: 28 }} animate={{ opacity: 1, scale: 1, y: [0, -10, 0], rotateY: 0 }} transition={{ opacity: { delay: item.delay, duration: .6 }, scale: { delay: item.delay, duration: .6 }, rotateY: { delay: item.delay, duration: .6 }, y: { delay: item.delay, duration: 4.5, repeat: Infinity, ease: 'easeInOut' } }}><span className="tile-icon"><Icon size={24} /></span><b>{item.title}</b><small>{item.subtitle}</small><ArrowUpRight className="tile-arrow" size={15} /></motion.div>; })}
        <PhoneMockup />
        <motion.div className="merchant-toast" initial={{ opacity: 0, x: 45 }} animate={{ opacity: 1, x: 0, y: [0, -5, 0] }} transition={{ opacity: { delay: 1.35 }, x: { delay: 1.35 }, y: { duration: 4, repeat: Infinity } }}><span className="merchant-icon"><Store size={19} /></span><div><b>Payment event received</b><small>Demo interface · just now</small></div><i /></motion.div>
        <div className="visual-caption"><ShieldCheck size={14} /> SECURE PAYMENT EXPERIENCE</div>
      </div>
    </div>
    <div className="hero-stats"><div className="stat"><span><Store /></span><div><b>Unified</b><small>Payment workspace</small></div></div><div className="stat"><span><Zap /></span><div><b>Fast flows</b><small>Designed for speed</small></div></div><div className="stat"><span><Globe2 /></span><div><b>Multi-channel</b><small>Payment options</small></div></div><div className="stat"><span><Wallet /></span><div><b>Clear insights</b><small>Activity at a glance</small></div></div></div>
    <div className="trusted-strip"><span>BUILT FOR AMBITIOUS BUSINESSES</span><div className="brand-marquee"><b>zomato</b><b>blinkit</b><b>SWIGGY</b><b>◈ CRED</b><b>slice</b><b>meesho</b><b>Myntra</b><b>PharmEasy</b></div></div>
  </section>;
}
