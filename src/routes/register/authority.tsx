import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/register/authority')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/register/authority"!</div>
}
