import { Link } from "react-router";
import type { Route } from "./+types/sponsors";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Our Sponsors | Barton Hills Elementary PTA" },
    {
      name: "description",
      content:
        "Thank you to our Partners in Education who support Barton Hills Elementary PTA.",
    },
  ];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const tiers = [
  {
    name: "Diamond",
    amount: "$2,500+",
    slots: 2,
    color: "bg-eagle-blue",
    borderColor: "border-eagle-blue",
    textColor: "text-eagle-blue",
    bgLight: "bg-eagle-blue/5",
  },
  {
    name: "Platinum",
    amount: "$1,000+",
    slots: 3,
    color: "bg-charcoal",
    borderColor: "border-charcoal",
    textColor: "text-charcoal",
    bgLight: "bg-charcoal/5",
  },
  {
    name: "Gold",
    amount: "$500+",
    slots: 4,
    color: "bg-spirit-gold",
    borderColor: "border-spirit-gold",
    textColor: "text-spirit-gold",
    bgLight: "bg-spirit-gold/5",
  },
  {
    name: "Silver",
    amount: "$250+",
    slots: 6,
    color: "bg-charcoal/50",
    borderColor: "border-charcoal/30",
    textColor: "text-charcoal/60",
    bgLight: "bg-charcoal/[0.03]",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function Sponsors() {
  return (
    <div>
      {/* ── 1. Page Banner ───────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 60px, #d4a843 60px, #d4a843 62px)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white">
            Our Sponsors
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
            Partners in Education supporting Barton Hills Elementary
          </p>
          <div className="mt-6 h-1 w-20 bg-spirit-gold rounded-full mx-auto" />
        </div>
      </section>

      {/* ── 2. Intro ─────────────────────────────────────────────────────── */}
      <section className="bg-warm-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal">
            Partners in Education
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-8 text-lg md:text-xl text-charcoal/70 leading-relaxed">
            Our Partners in Education program recognizes businesses and families
            who provide generous support to Barton Hills Elementary PTA.
          </p>
        </div>
      </section>

      {/* ── 3. Sponsor Tiers ─────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 space-y-16">
          {tiers.map((tier) => (
            <div key={tier.name}>
              {/* Tier header */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`h-10 w-10 rounded-lg ${tier.color} flex items-center justify-center`}>
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-heading font-bold text-charcoal">
                    {tier.name}
                  </h3>
                  <p className={`font-heading font-semibold ${tier.textColor}`}>
                    {tier.amount}
                  </p>
                </div>
              </div>

              {/* Logo placeholders */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: tier.slots }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-[3/2] rounded-lg ${tier.bgLight} border-2 border-dashed ${tier.borderColor} flex items-center justify-center transition-colors hover:border-spirit-gold/50`}
                  >
                    <span className="text-xs font-medium text-charcoal/30 text-center px-3">
                      Your Logo Here
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Become a Sponsor CTA ──────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-eagle-blue to-night-blue py-16 md:py-24 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-spirit-gold/5"
          style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Become a Sponsor
          </h2>
          <div className="mt-3 h-1 w-16 bg-spirit-gold rounded-full mx-auto" />
          <p className="mt-6 text-lg text-white/80 leading-relaxed">
            Support our school community and gain visibility with Barton Hills
            families. Your sponsorship directly funds programs that benefit every
            student.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="mailto:pta@bheeagles.com"
              className="inline-flex items-center bg-spirit-gold text-night-blue font-heading font-bold text-lg px-8 py-3.5 rounded-full hover:bg-spirit-gold/90 transition-all duration-200 hover:shadow-lg hover:shadow-spirit-gold/25"
            >
              Contact Us to Sponsor
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center border-2 border-white text-white font-heading font-bold text-lg px-8 py-3.5 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              Get in Touch
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/50">
            Email us at{" "}
            <a
              href="mailto:pta@bheeagles.com"
              className="text-spirit-gold hover:text-spirit-gold/80 transition-colors underline"
            >
              pta@bheeagles.com
            </a>{" "}
            for sponsorship details
          </p>
        </div>
      </section>
    </div>
  );
}
