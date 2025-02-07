import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from "sonner";
import App from './App.tsx'
import './index.css'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
})

const container = document.getElementById('root')

if (container) {
  const root = createRoot(container)
  root.render(
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-center" closeButton />
      <App />
    </QueryClientProvider>
  )
}