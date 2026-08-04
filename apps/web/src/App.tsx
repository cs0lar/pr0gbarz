import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import {
  createBrowserRouter,
  isRouteErrorResponse,
  RouterProvider,
  useRouteError,
} from 'react-router-dom'

import { AppShell } from './components/AppShell.js'
import { ToastProvider } from './components/ToastProvider.js'
import { ThemeProvider } from './components/ThemeProvider.js'
import {
  ArchivePage,
  ComponentsPage,
  DashboardPage,
  NotFoundPage,
  ProjectsPage,
} from './pages.js'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${String(error.status)}: ${error.statusText}`
    : 'The page could not be loaded.'

  return <NotFoundPage description={message} />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'archive', element: <ArchivePage /> },
      { path: 'components', element: <ComponentsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

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
  return (
    <ApplicationErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ApplicationErrorBoundary>
  )
}
