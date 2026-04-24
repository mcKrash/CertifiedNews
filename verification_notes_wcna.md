# WCNA Live Verification Notes

- Latest pushed commit: `c215a99`.
- Home/login page is live and shows **Sign in with Google** plus a direct **Create Account** button.
- Clicking **Create Account** routes correctly to `/auth/register`.
- The journalist registration route `/auth/register/journalist` is live and renders the updated onboarding step with name, username, email, password, and confirm-password fields.
- Local production build for `apps/web` completed successfully after fixing the `MixedFeed` typing issue and removing the `useSearchParams` prerender blocker from the home page.
- Backend syntax checks passed for the modified auth, profile, comment, post controllers, and auth routes.
