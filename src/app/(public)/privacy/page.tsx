import { Metadata } from 'next';
import Link from 'next/link';
import { MarketingNav, Footer } from '@/components/marketing';

export const metadata: Metadata = {
  title: 'Privacy Policy - AI App Builder',
  description: 'Privacy Policy for AI App Builder - how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <>
      <MarketingNav />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Privacy Policy
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Last updated:{' '}
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  1. Information We Collect
                </h2>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  We collect information you provide directly to us, including:
                </p>
                <ul
                  className="list-disc list-inside space-y-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <li>Account information (email, name)</li>
                  <li>Project data and generated code</li>
                  <li>Usage data and preferences</li>
                  <li>Communications with our support team</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  2. How We Use Your Information
                </h2>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  We use the information we collect to:
                </p>
                <ul
                  className="list-disc list-inside space-y-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process your requests and transactions</li>
                  <li>Send you technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Develop new features and services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  3. Data Storage and Security
                </h2>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Your data is stored securely using industry-standard encryption. We use Supabase
                  for database and authentication services, which provides enterprise-grade
                  security. Your generated code and project data are stored in secure cloud
                  infrastructure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  4. AI Processing
                </h2>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  When you use AI App Builder, your prompts and project context are sent to our AI
                  providers (Google Gemini for visual analysis, Anthropic Claude for code
                  generation) to process your requests. This data is processed in accordance with
                  our providers&apos; privacy policies and is not used to train AI models.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  5. Data Sharing
                </h2>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul
                  className="list-disc list-inside space-y-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <li>Service providers who assist in our operations</li>
                  <li>Legal authorities when required by law</li>
                  <li>Other parties with your consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  6. Your Rights
                </h2>
                <p className="leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
                  You have the right to:
                </p>
                <ul
                  className="list-disc list-inside space-y-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Export your project data</li>
                  <li>Opt out of marketing communications</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  7. Cookies
                </h2>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  We use essential cookies to maintain your session and preferences. We do not use
                  tracking cookies for advertising purposes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  8. Changes to This Policy
                </h2>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  We may update this privacy policy from time to time. We will notify you of any
                  changes by posting the new policy on this page and updating the &quot;Last
                  updated&quot; date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  9. Contact Us
                </h2>
                <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  If you have questions about this privacy policy or your data, please contact us at{' '}
                  <a
                    href="mailto:privacy@aiappbuilder.com"
                    className="text-garden-400 hover:text-garden-300"
                  >
                    privacy@aiappbuilder.com
                  </a>
                </p>
              </section>
            </div>
          </div>

          {/* Back Link */}
          <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--border-color)' }}>
            <Link href="/" className="text-garden-400 hover:text-garden-300 transition-colors">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
