import { Metadata } from 'next';
import Link from 'next/link';
import { MarketingNav, Footer } from '@/components/marketing';
import { CheckIcon } from '@/components/ui/Icons';

export const metadata: Metadata = {
  title: 'Pricing - AI App Builder',
  description: 'Simple, transparent pricing for AI App Builder. Start free and scale as you grow.',
};

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out AI App Builder',
    features: [
      'Up to 3 projects',
      'Natural Conversation Wizard',
      'Phased generation (up to 5 phases)',
      'Real-time preview',
      'Community support',
    ],
    cta: 'Get Started',
    ctaHref: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For developers building production apps',
    features: [
      'Unlimited projects',
      'Dual AI System (Gemini + Claude)',
      'Phased generation (2-25+ phases)',
      'Custom architecture generation',
      'Project documentation generator',
      'Planned vs Built comparison',
      'Priority support',
      'Export to GitHub',
    ],
    cta: 'Coming Soon',
    ctaHref: '#',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For teams with advanced needs',
    features: [
      'Everything in Pro',
      'Unlimited version history',
      'SSO & team management',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'On-premise option',
    ],
    cta: 'Contact Us',
    ctaHref: 'mailto:enterprise@aiappbuilder.com',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'Can I try AI App Builder for free?',
    answer:
      'Yes! Our free tier lets you create up to 3 projects with basic features. No credit card required.',
  },
  {
    question: 'What happens when I upgrade?',
    answer:
      'Your existing projects are preserved and you immediately gain access to all Pro features.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes, you can cancel your subscription at any time. Your projects remain accessible on the free tier.',
  },
  {
    question: 'Do you offer refunds?',
    answer: "We offer a 14-day money-back guarantee if you're not satisfied with Pro features.",
  },
];

export default function PricingPage() {
  return (
    <>
      <MarketingNav />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative p-8 rounded-2xl ${
                  tier.highlighted ? 'bg-garden-600/10 border border-garden-500/50' : ''
                }`}
                style={
                  !tier.highlighted
                    ? { background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }
                    : undefined
                }
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-garden-600 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {tier.price}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>{tier.period}</span>
                  </div>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                    {tier.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckIcon size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={tier.ctaHref}
                  className={`block w-full py-3 text-center font-medium rounded-lg transition-colors ${
                    tier.highlighted ? 'bg-garden-600 hover:bg-garden-500 text-white' : ''
                  } ${tier.cta === 'Coming Soon' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={
                    !tier.highlighted
                      ? { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }
                      : undefined
                  }
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2
              className="text-2xl font-bold text-center mb-8"
              style={{ color: 'var(--text-primary)' }}
            >
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="p-6 rounded-xl"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    {faq.question}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
