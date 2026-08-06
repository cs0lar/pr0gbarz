import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  Component,
  type ErrorInfo,
  lazy,
  type ReactNode,
  Suspense,
  useState,
} from 'react'
import {
  createBrowserRouter,
  isRouteErrorResponse,
  RouterProvider,
  useRouteError,
} from 'react-router-dom'

import { AppShell } from './components/AppShell.js'
import { ToastProvider } from './components/ToastProvider.js'
import { ThemeProvider } from './components/ThemeProvider.js'
import { ComponentsPage, NotFoundPage } from './pages.js'

const DashboardPage = lazy(() =>
  import('./features/dashboard/DashboardPage.js').then((module) => ({
    default: module.DashboardPage,
  })),
)
const ProjectDetailPage = lazy(() =>
  import('./features/projects/ProjectDetailPage.js').then((module) => ({
    default: module.ProjectDetailPage,
  })),
)
const ProjectsPage = lazy(() =>
  import('./features/projects/ProjectsPage.js').then((module) => ({
    default: module.ProjectsPage,
  })),
)

function RouteLoading() {
  return (
    <main className="fatal-error" aria-busy="true" aria-live="polite">
      <div className="wordmark" aria-label="pr0gbarz">
        <span className="wordmark__bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        pr0gbarz
      </div>
      <p>Loading workspace…</p>
    </main>
  )
}

function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${String(error.status)}: ${error.statusText}`
    : 'The page could not be loaded.'

  return <NotFoundPage description={message} />
}

function createRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <AppShell />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'projects', element: <ProjectsPage /> },
        { path: 'projects/:projectId', element: <ProjectDetailPage /> },
        { path: 'archive', element: <ProjectsPage archived /> },
        { path: 'components', element: <ComponentsPage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ])
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 30_000,
      },
    },
  })
}

interface ErrorBoundaryState {
  failed: boolean
}

class ApplicationErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  override state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('The pr0gbarz interface crashed.', error, info.componentStack)
  }

  override render() {
    if (this.state.failed) {
      return (
        <main className="fatal-error">
          <div className="wordmark" aria-label="pr0gbarz">
            <span className="wordmark__bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            pr0gbarz
          </div>
          <h1>Something went off track.</h1>
          <p>Your data is safe. Reload the interface to try again.</p>
          <button
            type="button"
            onClick={() => {
              window.location.reload()
            }}
          >
            Reload pr0gbarz
          </button>
        </main>
      )
    }

    return this.props.children
  }
}

export function App() {
  const [queryClient] = useState(createQueryClient)
  const [router] = useState(createRouter)

  return (
    <ApplicationErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Suspense fallback={<RouteLoading />}>
              <RouterProvider router={router} />
            </Suspense>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ApplicationErrorBoundary>
  )
}
