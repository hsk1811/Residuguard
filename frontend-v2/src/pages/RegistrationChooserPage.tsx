import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { roleOptions } from "../features/auth/roles";

export function RegistrationChooserPage() {
  return <div className="auth-page mx-auto max-w-5xl px-5 py-12">
    <p className="eyebrow">Create an account</p>
    <h1 className="auth-title">Choose your registration type</h1>
    <p className="auth-intro">Your role determines which profile details are recorded. Choose the role that matches your work.</p>
    <div className="role-choice-grid">
      {roleOptions.map((option) => <Link className="role-choice-card" to={`/register/${option.path}`} key={option.role}>
        <span><b>{option.label}</b><small>{option.description}</small></span><ArrowRight size={18} aria-hidden="true" />
      </Link>)}
    </div>
    <p className="auth-secondary-link">Already registered? <Link to="/sign-in">Sign in</Link></p>
  </div>;
}
