import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return <div className="mx-auto max-w-lg py-20 text-center"><p className="eyebrow justify-center">404 · Page not found</p><h1 className="mt-4 text-3xl font-semibold text-emerald-950">This page isn’t here.</h1><p className="mt-3 text-stone-600">The address may be outdated or mistyped.</p><Link className="mt-7 inline-flex" to="/"><Button>Return to ResiduGuard</Button></Link></div>;
}
