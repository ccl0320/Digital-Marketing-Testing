"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const services = [
  {
    icon: "🔍",
    title: "SEO & Content",
    description:
      "Dominate search rankings with technical SEO audits, keyword strategy, and content that drives qualified organic traffic at scale.",
    features: ["Technical SEO", "Link Building", "Content Strategy", "Local SEO"],
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
  },
  {
    icon: "💡",
    title: "Paid Advertising",
    description:
      "Maximize every dollar with data-driven PPC campaigns across Google, Meta, LinkedIn and beyond — optimized for ROAS.",
    features: ["Google Ads", "Meta Ads", "Retargeting", "A/B Testing"],
    color: "from-indigo-500 to-purple-600",
    bg: "bg-indigo-50",
  },
  {
    icon: "📱",
    title: "Social Media",
    description:
      "Build a community that converts. We craft platform-native content and engagement strategies that amplify your brand voice.",
    features: ["Content Creation", "Community Mgmt", "Influencer Collab", "Analytics"],
    color: "from-purple-500 to-pink-600",
    bg: "bg-purple-50",
  },
  {
    icon: "✉️",
    title: "Email Marketing",
    description:
      "Turn subscribers into buyers with personalized email sequences, automated flows, and deliverability optimization.",
    features: ["Automation Flows", "Segmentation", "A/B Testing", "Deliverability"],
    color: "from-pink-500 to-rose-600",
    bg: "bg-pink-50",
  },
  {
    icon: "📊",
    title: "Analytics & CRO",
    description:
      "Understand what's working and why. We set up robust tracking, build dashboards, and run CRO experiments that move the needle.",
    features: ["GA4 Setup", "Heatmaps", "Funnel Analysis", "Reporting"],
    color: "from-orange-500 to-amber-600",
    bg: "bg-orange-50",
  },
  {
    icon: "🚀",
    title: "Growth Strategy",
    description:
      "Get a full-funnel growth roadmap tailored to your goals, market, and budget — with quarterly sprints and clear KPIs.",
    features: ["Funnel Mapping", "Go-to-Market", "Competitive Intel", "OKR Planning"],
    color: "from-teal-500 to-cyan-600",
    bg: "bg-teal-50",
  },
];

function ServiceCard({ service, index }: { service: typeof services[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      className="group bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-shadow duration-300 cursor-pointer"
    >
      <div className={`w-14 h-14 rounded-2xl ${service.bg} flex items-center justify-center text-2xl mb-6`}>
        {service.icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-6">{service.description}</p>
      <div className="flex flex-wrap gap-2">
        {service.features.map((f) => (
          <span
            key={f}
            className="text-xs px-3 py-1 rounded-full bg-gray-50 text-gray-600 font-medium border border-gray-100"
          >
            {f}
          </span>
        ))}
      </div>
      <div className={`mt-6 h-0.5 w-0 group-hover:w-full bg-gradient-to-r ${service.color} rounded-full transition-all duration-500`} />
    </motion.div>
  );
}

export default function Services() {
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true });

  return (
    <section id="services" className="py-28 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={titleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-4 border border-indigo-100">
            What We Do
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
            Full-Stack Digital{" "}
            <span className="gradient-text">Marketing</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Every channel, every touchpoint — unified under one growth strategy built for your goals.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
