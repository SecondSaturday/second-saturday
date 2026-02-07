import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Second Saturday',
  description: 'Privacy policy for Second Saturday application',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: February 2026</p>

        <div className="space-y-8 text-foreground">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Second Saturday. We respect your privacy and are committed to protecting
              your personal data. This privacy policy explains how we collect, use, and safeguard
              your information when you use our application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Data We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect the following types of information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Account Information:</strong> Email address, name, and profile picture when
                you sign up or sign in
              </li>
              <li>
                <strong>Authentication Data:</strong> We use Clerk for authentication, which may
                store session tokens and login history
              </li>
              <li>
                <strong>User Content:</strong> Photos, videos, and other content you upload to the
                application
              </li>
              <li>
                <strong>Usage Data:</strong> How you interact with our application, including pages
                visited and features used
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating system, and device
                identifiers
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. OAuth and Third-Party Sign-In</h2>
            <p className="text-muted-foreground leading-relaxed">
              We offer sign-in through Google and Apple. When you use these services, we receive
              basic profile information (name, email, profile picture) that you have made available
              through your account settings with those providers. We do not receive or store your
              passwords from these services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. How We Use Your Data</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>To provide and maintain our service</li>
              <li>To authenticate your identity and secure your account</li>
              <li>To send you notifications about your account and activity</li>
              <li>To improve our application based on usage patterns</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the following third-party services to operate our application:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Clerk:</strong> Authentication and user management
              </li>
              <li>
                <strong>Convex:</strong> Database and file storage
              </li>
              <li>
                <strong>Mux:</strong> Video processing and delivery
              </li>
              <li>
                <strong>Resend:</strong> Email delivery
              </li>
              <li>
                <strong>OneSignal:</strong> Push notifications
              </li>
              <li>
                <strong>Sentry:</strong> Error tracking and monitoring
              </li>
              <li>
                <strong>PostHog:</strong> Analytics and product insights
              </li>
              <li>
                <strong>Vercel:</strong> Hosting and deployment
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Each of these services has their own privacy policy governing how they handle data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using industry-standard encryption. We use secure
              connections (HTTPS) for all data transmission. Access to your data is restricted to
              authorized personnel only. We regularly review and update our security practices.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Your Rights (GDPR)</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you are located in the European Economic Area (EEA), you have certain rights
              regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>
                <strong>Right to Access:</strong> You can request a copy of your personal data
              </li>
              <li>
                <strong>Right to Rectification:</strong> You can request correction of inaccurate
                data
              </li>
              <li>
                <strong>Right to Erasure:</strong> You can request deletion of your data
              </li>
              <li>
                <strong>Right to Portability:</strong> You can request your data in a portable
                format
              </li>
              <li>
                <strong>Right to Object:</strong> You can object to certain processing of your data
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> You can withdraw consent at any time
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Data Deletion</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can request deletion of your account and associated data at any time by contacting
              us. Upon request, we will delete your personal data from our systems within 30 days,
              except where we are required to retain it for legal or regulatory purposes. Some data
              may persist in backups for a limited time but will not be actively used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not directed to children under 13. We do not knowingly collect personal
              information from children under 13. If you believe we have collected information from
              a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes
              by posting the new policy on this page and updating the &quot;Last updated&quot; date.
              We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this privacy policy or our data practices, please
              contact us at:{' '}
              <a href="mailto:privacy@secondsaturday.app" className="text-primary hover:underline">
                privacy@secondsaturday.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
