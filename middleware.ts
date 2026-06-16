import { authMiddleware } from '@clerk/nextjs';

export default authMiddleware({
  publicRoutes: ['/', '/sign-in(.*)', '/sign-up(.*)', '/api/webhook(.*)'],
  async afterAuth(auth, req) {
    if (auth.userId && auth.isPublicRoute) {
      const path = '/dashboard';
      const home = new URL(path, req.url);
      return Response.redirect(home);
    }
  },
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
