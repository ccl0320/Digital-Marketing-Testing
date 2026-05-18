"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const plans = [
  {
    name: "Starter",
    price: { monthly: 1499, annual: 1199 },
    description: "Perfect for early-stage startups and small businesses ready to grow.",
    color: "border-gray-200",
    badge: null,
    features: [
      "2 marketing channels",
      "Monthly strategy calls",
      "SEO + Content basics",
      "Performance dashboard",
      "Email marketing setup",
      "Dedicated account manager",
    ],
    cta: "Get Started",
    ctaStyle: "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white",
  },
  {
    name: "Growth",
    price: { monthly: 3499, annual: 2799 },
    description: "For scaling companies serious about market share and consistent revenue growth.",
    color: "border-indigo-500",
    badge: "Most Popular",
    features: [
      "4 marketing channels",
      "Bi-weekly strategy calls",
      "Full SEO + PPC management",
      "Advanced analytics & CRO",
      "Email automation flows",
      "Social media management",
      "Monthly competitor analysis",
      "Priority support",
    ],
    cta: "Start Growing",
    ctaStyle: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200",
  },
  {
    name: "Enterprise",
    price: { monthly: null, annual: null },
    description: "Custom strategy and dedicated team for high-growth companies at scale.",
    color: "border-gray-200",
    badge: null,
    features: [
      "All channels + custom",
      "Weekly strategy sessions",
      "Dedicated growth team",
      "White-glove onboarding",
      "Custom reporting & BI",
      "PR & influencer campaigns",
      "International markets",
      "SLA guarantees",
    ],
    cta: "Contact Sales",
    ctaStyle: "border-2 border-gray-200 text-gray-700 hover:border-indigo-300 hover:text-indigo-600",
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true });

  return (
    <section id="pricing" className="py-28 bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-4 border border-indigo-100">
            Transparent Pricing
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Invest in Growth,{" "}
            <span className="gradient-text">Not Guesswork</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
            No hidden fees. Cancel anytime. Every plan comes with a 30-day performance guarantee.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-white rounded-full p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!annual ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${annual ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500"}`}
            >
              Annual
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => {
            const ref = useRef<HTMLDivElement>(null);
            const inView = useInView(ref, { once: true, margin: "-60px" });
            const isPopular = plan.badge === "Most Popular";
            return (
              <motion.div
                key={plan.name}
                ref={ref}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`relative bg-white rounded-3xl border-2 ${plan.color} p-8 flex flex-col ${isPopular ? "shadow-2xl shadow-indigo-100/60 scale-[1.02]" : "shadow-sm"}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>

                <div className="mb-8">
                  {plan.price.monthly ? (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">
                        ${annual ? plan.price.annual : plan.price.monthly}
                      </span>
                      <span className="text-gray-400 mb-1">/mo</span>
                    </div>
                  ) : (
                    <div className="text-3xl font-extrabold text-gray-900">Custom</div>
                  )}
                </div>

                <ul className="flex flex-col gap-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="text-indigo-500 mt-0.5 font-bold flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <motion.a
                  href="#contact"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`block text-center py-3.5 rounded-full font-semibold text-sm transition-all duration-200 ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </motion.a>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          All plans include a 30-day money-back guarantee. Questions?{" "}
          <a href="#contact" className="text-indigo-600 hover:underline font-medium">Chat with us →</a>
        </p>
      </div>
    </section>
  );
}
