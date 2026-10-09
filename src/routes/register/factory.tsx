import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/register/factory')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/register/factory"!</div>
}
