'use client'

import SectionReveal from '@/components/public/section-reveal'

const BUSH = '#20271A'
const STONE = '#6E6A59'
const SAND = '#EAE3D2'
const OLIVE = '#7A9A4A'

const POINTS_EN = [
  {
    title: 'No agency markup',
    body: "You're quoting directly with the operator who runs the trip. No middleman, no inflated margins — the price you see is what we charge.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <circle cx="14" cy="14" r="13" stroke={OLIVE} strokeWidth="1.5" />
        <path d="M9 14l3.5 3.5L19 10" stroke={OLIVE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Guides who built the routes',
    body: 'Our guides designed the itineraries from years in the field — not adapted from a catalogue. They know where the road washes out and where the leopard drinks.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M14 4 L14 24 M6 10 L14 4 L22 10" stroke={OLIVE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14" cy="18" r="3" stroke={OLIVE} strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'WhatsApp-first support',
    body: 'English, Arabic and Swahili. Real people, not a ticket queue. Message us before, during or after your trip and someone who knows your booking responds.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M5 6h18a1 1 0 011 1v11a1 1 0 01-1 1H9l-5 4V7a1 1 0 011-1z" stroke={OLIVE} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
]

const POINTS_AR = [
  {
    title: 'بدون رسوم وكالات',
    body: 'أنت تتفاوض مباشرة مع المشغل الذي ينفذ الرحلة. لا وسيط، لا هامش ربح مضخوم — السعر الذي تراه هو ما نقوم بتحصيله.',
    icon: POINTS_EN[0].icon,
  },
  {
    title: 'مرشدون صمموا المسارات بأنفسهم',
    body: 'صمم مرشدونا مسارات الرحلات من خلال سنوات في الميدان — وليس من كتالوج. يعرفون أين تغمر الطريق وأين يشرب النمر.',
    icon: POINTS_EN[1].icon,
  },
  {
    title: 'دعم عبر واتساب بشكل أساسي',
    body: 'بالعربية والإنجليزية والسواحيلية. أشخاص حقيقيون لا صندوق تذاكر. راسلنا قبل رحلتك أو خلالها أو بعدها وسيرد عليك شخص يعرف حجزك.',
    icon: POINTS_EN[2].icon,
  },
]

export default function HomeWhyDirect({ isAr }: { isAr: boolean }) {
  const points = isAr ? POINTS_AR : POINTS_EN
  const dir = isAr ? 'rtl' : 'ltr'

  return (
    <section style={{ background: SAND, padding: '80px 24px' }} dir={dir}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <SectionReveal>
          <div style={{ marginBottom: 48 }}>
            <h2 style={{
              fontFamily: 'var(--font-display, "Readex Pro", sans-serif)',
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              fontWeight: 700,
              color: BUSH,
              margin: '0 0 10px',
            }}>
              {isAr ? 'لماذا تحجز مباشرة؟' : 'Why book direct?'}
            </h2>
            <p style={{
              color: STONE,
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: '1rem',
              margin: 0,
            }}>
              {isAr
                ? 'ليس مجرد شعار — هذا ما يعنيه الحجز المباشر معنا عملياً.'
                : "Not a slogan — here's what booking direct with us actually means."}
            </p>
          </div>
        </SectionReveal>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
        }}>
          {points.map((p, i) => (
            <SectionReveal key={p.title} delay={i * 0.08}>
              <div style={{
                background: '#fff',
                borderRadius: 12,
                padding: '28px 24px',
                border: '1px solid #E5E0D8',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                height: '100%',
              }}>
                <div>{p.icon}</div>
                <h3 style={{
                  fontFamily: 'var(--font-display, "Readex Pro", sans-serif)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: BUSH,
                  margin: 0,
                }}>
                  {p.title}
                </h3>
                <p style={{
                  color: STONE,
                  fontFamily: 'var(--font-body, sans-serif)',
                  fontSize: '0.9rem',
                  lineHeight: 1.65,
                  margin: 0,
                }}>
                  {p.body}
                </p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
