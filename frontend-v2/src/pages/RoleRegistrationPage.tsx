import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorMessage } from "../components/ui/Feedback";
import { FormField } from "../components/ui/FormField";
import { registerUser } from "../services/api/auth";
import { registrationErrorMessage } from "../features/auth/registrationErrors";
import type { UserRole } from "../types/api";
import { assertRegistrationRoleProfile, emptyRegistrationValues, registrationPayload, validateRegistration, type RegistrationField, type RegistrationValues } from "../features/auth/registrationSchemas";
import { roleLabel, roleForRegistrationPath } from "../features/auth/roles";

interface FieldDefinition {
  key: RegistrationField;
  label: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  optional?: boolean;
  multiline?: boolean;
}

const sharedFields: FieldDefinition[] = [
  { key: "name", label: "Full name", autoComplete: "name" },
  { key: "email", label: "Email address", type: "email", autoComplete: "email" },
];

const roleFields: Record<UserRole, FieldDefinition[]> = {
  FARMER: [
    { key: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
    { key: "village", label: "Village" },
    { key: "organization", label: "Farm / organization name", optional: true },
  ],
  VETERINARIAN: [
    { key: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
    { key: "licenseNumber", label: "Veterinary license number" },
    { key: "specialization", label: "Specialization", optional: true },
    { key: "clinicName", label: "Clinic name", optional: true },
    { key: "address", label: "Address", optional: true, multiline: true },
  ],
  COLLECTION_CENTRE: [
    { key: "centreName", label: "Collection centre name" },
    { key: "registrationNumber", label: "Registration number" },
    { key: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
    { key: "address", label: "Address", multiline: true },
    { key: "village", label: "Village / location details", optional: true },
  ],
  FACTORY: [
    { key: "factoryName", label: "Factory name" },
    { key: "registrationNumber", label: "Registration number" },
    { key: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
    { key: "address", label: "Address", multiline: true },
  ],
  AUTHORITY: [
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "employeeId", label: "Employee ID" },
    { key: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
    { key: "officeAddress", label: "Office address", multiline: true },
  ],
};

function RoleRegistrationForm({ role }: { role: UserRole }) {
  const [values, setValues] = useState<RegistrationValues>(emptyRegistrationValues);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegistrationField, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  function updateField(key: RegistrationField, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const validationErrors = validateRegistration(role, values);
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setError("Review the highlighted fields and try again.");
      return;
    }

    setBusy(true);
    try {
      const result = await registerUser(registrationPayload(role, values));
      assertRegistrationRoleProfile(role, result);
      setSuccess(true);
    } catch (cause) {
      setError(registrationErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (success) return <div className="auth-page mx-auto max-w-2xl px-5 py-12">
    <Card className="auth-card p-7 sm:p-9">
      <div className="success-mark" aria-hidden="true">✓</div>
      <p className="eyebrow">Registration complete</p>
      <h1 className="auth-title">Your {roleLabel(role).toLowerCase()} account is ready.</h1>
      <p className="auth-intro">Sign in with the email and password you just registered. Registration does not automatically sign you in.</p>
      <Link className="button button-primary mt-5" to="/sign-in">Continue to sign in <ArrowRight size={17} aria-hidden="true" /></Link>
    </Card>
  </div>;

  const fields = [...sharedFields, ...roleFields[role]];
  return <div className="auth-page mx-auto max-w-3xl px-5 py-12">
    <div className="auth-heading-row"><div><p className="eyebrow">New {roleLabel(role).toLowerCase()} account</p><h1 className="auth-title">Create your account</h1><p className="auth-intro">Enter your details to create a {roleLabel(role).toLowerCase()} profile.</p></div><Link className="auth-back-link" to="/register">Change role</Link></div>
    <Card className="auth-card p-6 sm:p-8">
      {error && <div className="mb-5"><ErrorMessage message={error} /></div>}
      <form className="registration-grid" noValidate onSubmit={handleSubmit}>
        {fields.map((field) => field.multiline ? <div className="space-y-1.5" key={field.key}>
          <label className="field-label" htmlFor={`field-${field.key}`}>{field.label}{field.optional && <span className="optional-label"> · optional</span>}</label>
          <textarea id={`field-${field.key}`} className="field-textarea" rows={3} value={values[field.key]} onChange={(event) => updateField(field.key, event.target.value)} aria-invalid={Boolean(fieldErrors[field.key])} aria-describedby={fieldErrors[field.key] ? `error-${field.key}` : undefined} />
          {fieldErrors[field.key] && <p id={`error-${field.key}`} className="text-sm text-red-700" role="alert">{fieldErrors[field.key]}</p>}
        </div> : <FormField key={field.key} label={field.label} name={`field-${field.key}`} type={field.type ?? "text"} autoComplete={field.autoComplete} required={!field.optional} hint={field.optional ? "Optional" : undefined} error={fieldErrors[field.key]} value={values[field.key]} onChange={(event) => updateField(field.key, event.target.value)} />)}

        <FormField label="Password" name="field-password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={values.password} error={fieldErrors.password} onChange={(event) => updateField("password", event.target.value)} trailing={<button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button>} />
        <FormField label="Confirm password" name="field-confirmPassword" type={showConfirmation ? "text" : "password"} autoComplete="new-password" required value={values.confirmPassword} error={fieldErrors.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} trailing={<button className="password-toggle" type="button" aria-label={showConfirmation ? "Hide password confirmation" : "Show password confirmation"} onClick={() => setShowConfirmation((visible) => !visible)}>{showConfirmation ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}</button>} />
        <div className="registration-actions"><Button className="button-large" type="submit" disabled={busy}>{busy ? "Creating account…" : <>Create {roleLabel(role).toLowerCase()} account <ArrowRight size={17} aria-hidden="true" /></>}</Button><p>Already have an account? <Link to="/sign-in">Sign in</Link></p></div>
      </form>
    </Card>
  </div>;
}

export function RoleRegistrationPage() {
  const { role: rolePath } = useParams();
  const role = roleForRegistrationPath(rolePath ?? "");
  if (!role) return <Navigate to="/register" replace />;
  return <RoleRegistrationForm key={role} role={role} />;
}
