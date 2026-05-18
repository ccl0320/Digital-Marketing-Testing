"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

export default function ContactCTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section id="contact" className="py-28 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl overflow-hidden"
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 animated-gradient" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Blobs */}
          <div className="absolute top-[-30%] right-[-10%] w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-5%] w-80 h-80 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 text-center px-8 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white/90 text-sm font-medium mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Taking on New Clients — Limited Spots Available
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 }}
              className="text-4xl lg:text-6xl font-extrabold text-white leading-tight mb-6"
            >
              Ready to 10× Your
              <br />
              Marketing Results?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="text-white/70 text-lg mb-10 max-w-xl mx-auto"
            >
              Book a free 30-minute strategy call. We&apos;ll audit your current marketing and show you exactly
              where your biggest growth opportunities are — no strings attached.
            </motion.p>

            {!submitted ? (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.5 }}
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email"
                  className="flex-1 px-5 py-4 rounded-full bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white/60 backdrop-blur-sm text-sm"
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-7 py-4 rounded-full bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-colors shadow-xl whitespace-nowrap"
                >
                  Book Free Call →
                </motion.button>
              </motion.form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto"
              >
                <div className="text-4xl mb-3">🎉</div>
                <div className="text-white font-bold text-lg">You&apos;re on the list!</div>
                <div className="text-white/70 text-sm mt-1">
                  We&apos;ll reach out within 24 hours to schedule your free strategy call.
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.7 }}
              className="mt-8 flex items-center justify-center gap-6 text-white/60 text-xs"
            >
              <span className="flex items-center gap-1.5">✓ No credit card</span>
              <span className="flex items-center gap-1.5">✓ 30-day guarantee</span>
              <span className="flex items-center gap-1.5">✓ Cancel anytime</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
