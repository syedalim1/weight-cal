
import Link from "next/link";
import { Calculator, Wrench, Sparkles } from "lucide-react";

export default function Home() {
  const cards = [
    {
      href: "/ai-analyzer",
      title: "AI Furniture Analyzer",
      description: "Upload a photo and let AI generate the complete pipe cut list with weight & cost.",
      icon: Sparkles,
      colorClass: "text-violet-400 group-hover:text-violet-300",
      iconBg: "bg-violet-500/10 border-violet-500/20",
      glowClass: "glow-ai",
    },
    {
      href: "/ss-calculator",
      title: "SS Weight Calculator",
      description: "Accurately compute stainless steel weights & rates for factory output.",
      icon: Calculator,
      colorClass: "text-sky-400 group-hover:text-sky-300",
      iconBg: "bg-sky-500/10 border-sky-500/20",
      glowClass: "glow-ss",
    },
    {
      href: "/ms-pipe-calculator",
      title: "MS Weight Calculator",
      description: "Calculate mild steel weight with standard industrial formulas.",
      icon: Wrench,
      colorClass: "text-orange-400 group-hover:text-orange-300",
      iconBg: "bg-orange-500/10 border-orange-500/20",
      glowClass: "glow-ms",
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#0c0c0e] text-white">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-transparent to-transparent pointer-events-none" />

      <div className="w-full max-w-4xl space-y-8 z-10 text-center md:text-left">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex px-3 py-1 text-xs font-medium tracking-wider uppercase bg-white/5 border border-white/10 rounded-full text-zinc-400">
            Steel Arc Manufacturing
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Industrial Systems
          </h1>
          <p className="text-zinc-400 max-w-md mx-auto text-sm md:text-base">
            Select an application to start weight calculations.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link key={idx} href={card.href} className="group">
                <div className={`glass-panel glass-panel-hover ${card.glowClass} p-6 rounded-xl flex flex-col md:flex-row items-center md:items-start gap-5 cursor-pointer h-full transition-all duration-300`}>
                  <div className={`p-4.5 rounded-xl border ${card.iconBg} ${card.colorClass} transition-colors duration-300`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-zinc-600 text-xs pt-4">
          Steel Weight Calculator v2.0 • Secured Offline Storage
        </div>
      </div>
    </div>
  );
}
