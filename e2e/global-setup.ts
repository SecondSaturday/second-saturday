import { clerkSetup } from '@clerk/testing/playwright'
import fs from 'fs'
import path from 'path'

export default async function globalSetup() {
  // Ensure .auth directory exists for storing auth state
  const authDir = path.join(__dirname, '../.auth')
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  // clerkSetup fetches a testing token using CLERK_SECRET_KEY
  // This token bypasses bot protection/CAPTCHA in Clerk's Frontend API
  await clerkSetup()
}
