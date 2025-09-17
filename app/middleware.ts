
import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // Add any custom middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // If accessing auth pages and already logged in, redirect to dashboard
        if (req.nextUrl.pathname.startsWith("/auth/") && token) {
          return false // Will redirect to default page
        }
        
        // Allow access to auth pages if not logged in
        if (req.nextUrl.pathname.startsWith("/auth/")) {
          return true
        }
        
        // Require authentication for all other pages
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}
