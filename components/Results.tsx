"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect } from "react";

const caseStudies = [
  {
    brand: "NovaTech",
    category: "SaaS",
    logo: "🖥️",
    headline: "From 0 to 50K MRR in 8 months",
    metrics: [
      { label: "Organic Traffic", value: "+420%", before: "2.1K/mo", after: "10.9K/mo" },
      { label: "Trial Sign-ups", value: "+280%", before: "180/mo", after: "684/mo" },
      { label: "CAC Reduction", value: "-52%", before: "$210", after: "$101" },
    ],
    color: "from-blue-500 to-indigo-600",
    tagColor: "bg-blue-50 text-blue-700",
  },
  {
    brand: "Bloom Studio",
    category: "E-Commerce",
    logo: "🛍️",
    headline: "3× ROAS in 90 days flat",
    metrics: [
      { label: "Ad Revenue", value: "+310%", before: "$42K/mo", after: "$172K/mo" },
      { label: "ROAS", value: "3.1×", before: "0.9×", after: "3.1×" },
      { label: "Email Revenue", value: "+185%", before: "$18K/mo", after: "$51K/mo" },
    ],
    color: "from-purple-500 to-pink-600",
    tagColor: "bg-purple-50 text-purple-700",
  },
  {
    brand: "Apex Clinics",
    category: "Healthcare",
    logo: "🏥",
    headline: "1,200 new patients in 6 months",
    metrics: [
      { label: "Local Search Rank", value: "#1", before: "#14", after: "#1" },
      { label: "New Patient Leads", value: "+340%", before: "200/mo", after: "880/mo" },
      { label: "Cost per Lead", value: "-61%", before: "$87", after: "$34" },
    ],
    color: "from-teal-500 to-cyan-600",
    tagColor: "bg-teal-50 text-teal-700",
  },
];

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const count = useMotionValue(0);

  useEffect(() => {
    if (inView) {
      const controls = animate(count, target, { duration: 2, ease: "easeOut" });
      return controls.stop;
    }
  }, [inView, count, target]);

  return (
    <motion.span ref={ref}>
      {Math.round(count.get())}{suffix}
    </motion.span>
  );
}

export default function Results() {
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true });

  return (
    <section id="results" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-semibold mb-4 border border-green-100">
            Proven Results
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Numbers That{" "}
            <span className="gradient-text">Speak for Themselves</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Real campaigns. Real clients. Real growth — no vanity metrics, just business impact.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {caseStudies.map((cs, i) => {
            const ref = useRef<HTMLDivElement>(null);
            const inView = useInView(ref, { once: true, margin: "-60px" });
            return (
              <motion.div
                key={cs.brand}
                ref={ref}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: i * 0.15 }}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/40 transition-shadow duration-300 overflow-hidden"
              >
                {/* Header gradient bar */}
                <div className={`h-1.5 bg-gradient-to-r ${cs.color}`} />
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cs.logo}</span>
                      <div>
                        <div className="font-bold text-gray-900">{cs.brand}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cs.tagColor}`}>
                          {cs.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-extrabold text-gray-900 mb-6">{cs.headline}</h3>

                  <div className="flex flex-col gap-4">
                    {cs.metrics.map((m) => (
                      <div key={m.label} className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500 font-medium">{m.label}</span>
                          <span className={`text-sm font-extrabold bg-gradient-to-r ${cs.color} bg-clip-text text-transparent`}>
                            {m.value}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="line-through">{m.before}</span>
                          <span>→</span>
                          <span className="font-semibold text-gray-700">{m.after}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
