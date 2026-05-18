"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

const testimonials = [
  {
    quote:
      "GrowthLab completely transformed our digital presence. In 5 months we went from barely ranking to owning page 1 for our core keywords — and revenue is up 180%.",
    author: "Sarah Chen",
    role: "CEO, NovaTech",
    avatar: "SC",
    color: "from-blue-400 to-indigo-500",
    rating: 5,
  },
  {
    quote:
      "Their paid media team is exceptional. Every dollar is optimized to death. Our ROAS went from 0.9x to over 3x in 90 days. I wish we'd found them sooner.",
    author: "Marcus Williams",
    role: "CMO, Bloom Studio",
    avatar: "MW",
    color: "from-purple-400 to-pink-500",
    rating: 5,
  },
  {
    quote:
      "The strategy and reporting alone are worth the price. They know exactly what levers to pull and communicate results in a way any CEO can understand.",
    author: "Dr. Priya Patel",
    role: "Director, Apex Clinics",
    avatar: "PP",
    color: "from-teal-400 to-cyan-500",
    rating: 5,
  },
  {
    quote:
      "We'd tried three other agencies before GrowthLab. None came close to understanding our market. These guys get it — and they deliver every single month.",
    author: "James Rodriguez",
    role: "Founder, Verdant Foods",
    avatar: "JR",
    color: "from-orange-400 to-rose-500",
    rating: 5,
  },
  {
    quote:
      "Email automation alone added $45K/month. Their team set up flows we'd never even considered. The ROI is frankly ridiculous in the best possible way.",
    author: "Aisha Thompson",
    role: "VP Marketing, LuxeAir",
    avatar: "AT",
    color: "from-indigo-400 to-purple-500",
    rating: 5,
  },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true });

  return (
    <section id="testimonials" className="py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-50 text-yellow-700 text-sm font-semibold mb-4 border border-yellow-100">
            Client Love
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Don&apos;t Take Our{" "}
            <span className="gradient-text">Word for It</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Hear from founders and marketing leaders who&apos;ve seen the GrowthLab difference firsthand.
          </p>
        </motion.div>

        {/* Featured testimonial */}
        <div className="max-w-4xl mx-auto mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
              className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-3xl p-10 border border-gray-100 shadow-sm"
            >
              <div className="flex gap-1 mb-6">
                {Array.from({ length: testimonials[active].rating }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-xl">★</span>
                ))}
              </div>
              <blockquote className="text-2xl font-medium text-gray-800 leading-relaxed mb-8">
                &ldquo;{testimonials[active].quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonials[active].color} flex items-center justify-center text-white font-bold text-sm`}>
                  {testimonials[active].avatar}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{testimonials[active].author}</div>
                  <div className="text-sm text-gray-500">{testimonials[active].role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Avatar selector */}
        <div className="flex items-center justify-center gap-3">
          {testimonials.map((t, i) => (
            <motion.button
              key={i}
              onClick={() => setActive(i)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-xs transition-all duration-200 ${
                i === active ? "ring-2 ring-offset-2 ring-indigo-400 scale-110" : "opacity-60"
              }`}
            >
              {t.avatar}
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
