import { clerkSetup } from '@clerk/testing/playwright'

export default async function globalSetup() {
  // clerkSetup sets CLERK_TESTING_TOKEN which makes Clerk skip actual auth
  // and use a bypass token instead
  if (process.env.CLERK_SECRET_KEY) {
    await clerkSetup()
  }
}
