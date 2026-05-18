"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    number: "01",
    title: "Discovery & Audit",
    description:
      "We deep-dive into your brand, market, competitors, and current performance to map exactly where growth opportunities lie.",
    duration: "Week 1-2",
    icon: "🔎",
    color: "text-blue-600 bg-blue-50",
  },
  {
    number: "02",
    title: "Strategy Design",
    description:
      "Your custom growth roadmap is built — prioritized channels, budget allocation, messaging framework, and 90-day sprint plan.",
    duration: "Week 2-3",
    icon: "🗺️",
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    number: "03",
    title: "Build & Launch",
    description:
      "Campaigns go live. Ads created, SEO foundations laid, automations configured — everything ready to capture demand from day one.",
    duration: "Week 3-4",
    icon: "🚀",
    color: "text-purple-600 bg-purple-50",
  },
  {
    number: "04",
    title: "Optimize & Scale",
    description:
      "We analyze, iterate, and double down on what's working — pushing performance higher every week through data-backed decisions.",
    duration: "Ongoing",
    icon: "📈",
    color: "text-pink-600 bg-pink-50",
  },
];

export default function Process() {
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true });

  return (
    <section id="process" className="py-28 bg-gray-50/60">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-purple-50 text-purple-700 text-sm font-semibold mb-4 border border-purple-100">
            How It Works
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            From Zero to{" "}
            <span className="gradient-text">Full Throttle</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            A proven 4-step process designed to get you results fast — and keep compounding them.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-pink-200" />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => {
              const ref = useRef<HTMLDivElement>(null);
              const inView = useInView(ref, { once: true, margin: "-60px" });
              return (
                <motion.div
                  key={step.number}
                  ref={ref}
                  initial={{ opacity: 0, y: 40 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  className="flex flex-col items-center text-center"
                >
                  {/* Icon circle */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-24 h-24 rounded-3xl ${step.color} flex items-center justify-center text-3xl mb-6 shadow-sm relative z-10 bg-white border-2 border-gray-100`}
                  >
                    {step.icon}
                    <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-xs font-extrabold text-gray-400`}>
                      {i + 1}
                    </span>
                  </motion.div>

                  <div className="inline-block text-xs font-bold text-gray-400 px-3 py-1 rounded-full bg-white border border-gray-100 mb-3">
                    {step.duration}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{step.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
