import { Link, Outlet } from "react-router-dom";
import { ArrowRight, Leaf, Menu } from "lucide-react";

export function AppLayout() {
  return (
    <div className="app-shell min-h-screen">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <div className="nav-wrap">
          <Link to="/" className="brand" aria-label="ResiduGuard home">
            <span className="brand-mark"><Leaf size={19} aria-hidden="true" /></span>
            <span>Residu<span className="brand-light">Guard</span></span>
          </Link>
          <nav aria-label="Main navigation" className="main-nav">
            <a className="nav-link" href="/#features">Platform</a>
            <a className="nav-link" href="/#workflow">How it works</a>
            <a className="nav-link" href="/#participants">For participants</a>
          </nav>
          <div className="nav-actions">
            <Link className="login-link" to="/sign-in">Login</Link>
            <Link className="button button-primary nav-verify" to="/verify">Consumer verification <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <details className="mobile-nav">
            <summary aria-label="Open navigation menu"><Menu size={21} aria-hidden="true" /></summary>
            <nav aria-label="Mobile navigation">
              <a href="/#features">Platform</a><a href="/#workflow">How it works</a><a href="/#participants">For participants</a>
              <Link to="/sign-in">Login</Link><Link to="/verify">Consumer verification</Link>
            </nav>
          </details>
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand"><Link to="/" className="brand"><span className="brand-mark"><Leaf size={18} aria-hidden="true" /></span><span>Residu<span className="brand-light">Guard</span></span></Link><p>Clear records for healthier herds and more trusted dairy supply chains.</p></div>
          <div className="footer-links"><span className="footer-heading">Explore</span><a href="/#features">Platform</a><a href="/#workflow">How it works</a><a href="/#participants">Participants</a></div>
          <div className="footer-links"><span className="footer-heading">Access</span><Link to="/sign-in">Login</Link><Link to="/register">Create account</Link><Link to="/verify">Consumer verification</Link></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} ResiduGuard</span><span>Records support compliance workflows; they are not a substitute for laboratory testing.</span></div>
      </footer>
    </div>
  );
}
