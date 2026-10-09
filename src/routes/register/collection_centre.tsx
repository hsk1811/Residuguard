import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/register/collection_centre')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/register/collection-centre"!</div>
}
