import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Sparkles, Wand2, Image as ImageIcon, Film, Users, CalendarDays,
  Send, MessagesSquare, UserCircle2, Bot, ShieldCheck, FolderKanban, UsersRound,
  Check, Play, Workflow, Zap, Lock, FileCheck2, Eye, ChevronDown, Twitter,
  Linkedin, Github, Instagram, Building2, Home, Megaphone, Store, BarChart3,
  PenLine, Mic2, Captions, Smartphone, ListChecks, GitBranch, BellRing,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Digital Agency OS — AI-Powered Marketing Agency Platform" },
      {
        name: "description",
        content:
          "Run your entire digital marketing agency from one AI-powered platform. CRM, AI content, video studio, scheduling, team chat, and client portal.",
      },
      { property: "og:title", content: "Digital Agency OS — AI-Powered Marketing Platform" },
      { property: "og:description", content: "All-in-one AI platform for modern marketing agencies. Clients, content, video, scheduling, automation." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

// ---------------- shared bits ----------------

function GradientBg() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in oklab, var(--primary) 35%, transparent), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black, transparent)",
        }}
      />
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
      <span className="size-1.5 rounded-full bg-primary" />
      {children}
    </span>
  );
}

function GlassCard({
  children, className = "",
}: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border/70 bg-card/70 backdrop-blur-xl shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] ${className}`}
    >
      {children}
    </div>
  );
}

// ---------------- 1. Announcement Bar ----------------

function AnnouncementBar() {
  return (
    <div className="relative z-50 border-b border-border/60 bg-navy text-navy-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-2.5 text-sm md:flex-row">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="opacity-90">
            Now powered by AI Content, AI Video, and Social Automation
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Start Free
          </Link>
          <Link
            to="/book-demo"
            className="rounded-md border border-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            Book Demo
          </Link>
        </div>
      </div>
    </div>
  );
}

function TopNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative size-8 rounded-lg bg-gradient-to-br from-primary to-navy shadow-lg shadow-primary/30">
            <Sparkles className="absolute inset-0 m-auto size-4 text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight">Agency OS</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#showcase" className="hover:text-foreground">AI Studio</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline-flex">
            Sign in
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            Get started <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ---------------- 2. Hero ----------------

function Hero() {
  return (
    <header id="demo" className="relative overflow-hidden">
      <GradientBg />
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <SectionLabel>Launching: AI Video Studio v2</SectionLabel>
          <h1 className="mt-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl">
            Run Your Entire Digital Marketing Agency From One{" "}
            <span className="bg-gradient-to-r from-primary to-[oklch(0.6_0.18_220)] bg-clip-text text-transparent">
              AI-Powered Platform
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Manage clients, create AI content, generate videos, schedule posts,
            collaborate with your team, and automate campaigns — all from one dashboard.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
            >
              Start Free
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-6 py-3.5 text-sm font-semibold backdrop-blur hover:bg-card"
            >
              <Play className="size-4" /> Watch Demo
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="relative mx-auto mt-16 max-w-6xl">
          <div className="absolute -inset-x-20 -inset-y-10 -z-10 rounded-[3rem] bg-gradient-to-r from-primary/30 via-transparent to-[oklch(0.55_0.2_220)]/30 blur-3xl" />
          <DashboardMockup />
        </div>
      </div>
    </header>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      <GlassCard className="overflow-hidden p-0">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-border/60 bg-card/80 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-[#ff5f57]" />
            <div className="size-2.5 rounded-full bg-[#febc2e]" />
            <div className="size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="ml-4 flex-1 rounded-md bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            app.agencyos.com/dashboard
          </div>
          <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Mockup
          </span>
        </div>
        <div className="grid grid-cols-12 gap-4 bg-gradient-to-br from-card to-surface p-4 md:p-6">
          {/* sidebar */}
          <div className="col-span-3 hidden flex-col gap-1 lg:flex">
            {[
              { i: BarChart3, l: "Dashboard", a: true },
              { i: Users, l: "Clients" },
              { i: FolderKanban, l: "Campaigns" },
              { i: Wand2, l: "AI Copy" },
              { i: ImageIcon, l: "AI Images" },
              { i: Film, l: "AI Video" },
              { i: CalendarDays, l: "Calendar" },
              { i: MessagesSquare, l: "Team Chat" },
            ].map((x) => (
              <div
                key={x.l}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  x.a ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                <x.i className="size-4" /> {x.l}
              </div>
            ))}
          </div>
          {/* main */}
          <div className="col-span-12 space-y-4 lg:col-span-9">
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: "Active clients", v: "48", t: "+12%" },
                { l: "Posts scheduled", v: "126", t: "+34" },
                { l: "AI generations", v: "2.4k", t: "+18%" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-border/60 bg-background/60 p-3">
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <div className="text-xl font-bold">{s.v}</div>
                    <div className="text-xs text-emerald-500">{s.t}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="md:col-span-2 rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-medium">Content calendar</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 21 }).map((_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-md text-[10px] flex items-end justify-end p-1 ${
                        [3, 7, 12, 15, 18].includes(i)
                          ? "bg-primary/20 text-primary"
                          : [5, 10, 14].includes(i)
                          ? "bg-[oklch(0.7_0.15_180)]/20 text-[oklch(0.45_0.15_180)]"
                          : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Bot className="size-4 text-primary" /> AI Copywriter
                </div>
                <div className="space-y-2 text-xs">
                  <div className="rounded-md bg-muted/40 p-2">
                    "Boost your local visibility with..."
                  </div>
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    ✨ Generating 3 variants...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Floating cards */}
      <FloatingCard className="absolute -left-4 top-32 hidden lg:block">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 text-white">
            <Film className="size-4" />
          </div>
          <div>
            <div className="text-xs font-medium">Video rendered</div>
            <div className="text-[10px] text-muted-foreground">TikTok • 9:16 • 1080p</div>
          </div>
        </div>
      </FloatingCard>
      <FloatingCard className="absolute -right-4 bottom-32 hidden lg:block">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
            <MessagesSquare className="size-4" />
          </div>
          <div>
            <div className="text-xs font-medium">Sarah: Looks great! ✅</div>
            <div className="text-[10px] text-muted-foreground">Team chat • 2m ago</div>
          </div>
        </div>
      </FloatingCard>
    </div>
  );
}

function FloatingCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`animate-fade-in rounded-xl border border-border/70 bg-card/95 px-3 py-2.5 shadow-xl shadow-black/5 backdrop-blur ${className}`}>
      {children}
    </div>
  );
}

// ---------------- 3. Trusted By ----------------

function TrustedBy() {
  const types = [
    { i: Building2, l: "Construction Co." },
    { i: Home, l: "Real Estate" },
    { i: Megaphone, l: "Marketing Agency" },
    { i: Store, l: "Local Business" },
    { i: Building2, l: "Contractors" },
    { i: Home, l: "Property Mgmt" },
  ];
  return (
    <section className="border-y border-border/60 bg-surface/60 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Built for agencies, real estate, contractors, and local businesses
        </p>
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-6">
          {types.map((t) => (
            <div key={t.l} className="flex items-center justify-center gap-2 text-muted-foreground/70 transition-colors hover:text-foreground">
              <t.i className="size-5" />
              <span className="text-sm font-semibold">{t.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- 4. Core Features ----------------

const features = [
  { icon: PenLine, title: "AI Copywriting", desc: "Generate captions, ads, and emails in your brand voice instantly.", color: "from-violet-500 to-purple-500", anchor: "#showcase" },
  { icon: ImageIcon, title: "AI Image Generation", desc: "Studio-quality visuals from a single prompt, every time.", color: "from-pink-500 to-rose-500", anchor: "#showcase" },
  { icon: Film, title: "AI Video Studio", desc: "Scripts, voiceovers, subtitles, and renders — fully automated.", color: "from-orange-500 to-red-500", anchor: "#video-studio" },
  { icon: Users, title: "CRM & Leads", desc: "Capture, qualify, and convert leads in a unified pipeline.", color: "from-emerald-500 to-teal-500", anchor: "#automation" },
  { icon: CalendarDays, title: "Content Calendar", desc: "Plan months ahead with drag-and-drop scheduling.", color: "from-blue-500 to-cyan-500", anchor: "#calendar" },
  { icon: Send, title: "Social Scheduler", desc: "Publish to every platform with one click and approval flows.", color: "from-indigo-500 to-blue-500", anchor: "#calendar" },
  { icon: MessagesSquare, title: "Team Collaboration", desc: "Chat, meetings, tasks, and shared notes in one workspace.", color: "from-amber-500 to-orange-500", anchor: "#team" },
  { icon: UserCircle2, title: "Client Portal", desc: "White-label portal for approvals, reports, and updates.", color: "from-fuchsia-500 to-pink-500", anchor: "#portal" },
  { icon: Bot, title: "AI Chatbot", desc: "24/7 client assistant trained on each client's data safely.", color: "from-cyan-500 to-sky-500", anchor: "#portal" },
];

function CoreFeatures() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Everything you need</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            One platform. Every agency workflow.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Replace 12+ disconnected tools with a single AI-powered operating system.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <a
              key={f.title}
              href={f.anchor}
              className="group relative block overflow-hidden rounded-2xl border border-border/70 bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className={`inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} text-white shadow-lg`}>
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Learn more <ArrowRight className="size-3.5" />
              </div>
              <div className="mt-4 h-24 rounded-lg border border-border/60 bg-gradient-to-br from-muted/40 to-surface p-2">
                <div className="h-full rounded-md bg-gradient-to-br from-background to-muted/30 p-2">
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-3/4 rounded-full bg-muted" />
                    <div className="h-1.5 w-1/2 rounded-full bg-muted" />
                    <div className={`h-1.5 w-2/3 rounded-full bg-gradient-to-r ${f.color}`} />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- 5. AI Content Showcase ----------------

function AIContentShowcase() {
  return (
    <section id="showcase" className="relative overflow-hidden bg-navy py-24 text-navy-foreground">
      <div className="absolute inset-0 opacity-30" style={{
        background: "radial-gradient(circle at 20% 50%, color-mix(in oklab, var(--primary) 50%, transparent), transparent 50%)"
      }} />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>AI Content Creation</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Brilliant content, in seconds — not days.
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Captions, ads, images, videos. Every format, every platform, every brand voice.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Caption */}
          <GlassCard className="bg-white/5 border-white/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-white/60">
              <PenLine className="size-3.5" /> AI Caption
            </div>
            <p className="text-sm leading-relaxed">
              "🏡 Just listed in Brookside! 4-bed colonial with a backyard built for summer.
              DM for a private tour. #realestate"
            </p>
            <div className="mt-4 flex gap-2 text-xs">
              <span className="rounded-full bg-primary/30 px-2 py-0.5">Instagram</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5">Friendly</span>
            </div>
          </GlassCard>

          {/* Ad */}
          <GlassCard className="bg-white/5 border-white/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-white/60">
              <Megaphone className="size-3.5" /> AI Ad Copy
            </div>
            <div className="text-sm font-semibold">Get 30% More Leads This Month</div>
            <p className="mt-2 text-sm text-white/80">
              Local contractors are booking 3x more jobs with our automated funnel. See how →
            </p>
            <div className="mt-4 inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-semibold">
              Book Free Audit
            </div>
          </GlassCard>

          {/* Image */}
          <GlassCard className="bg-white/5 border-white/10 overflow-hidden p-0">
            <div className="aspect-square w-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600" />
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <ImageIcon className="size-3.5" /> AI Image
              </div>
              <p className="mt-1 text-xs text-white/80">"Vibrant product shot, studio lit"</p>
            </div>
          </GlassCard>

          {/* Video */}
          <GlassCard className="bg-white/5 border-white/10 overflow-hidden p-0">
            <div className="relative aspect-square w-full bg-gradient-to-br from-cyan-500 to-blue-700">
              <div className="absolute inset-0 grid place-items-center">
                <div className="grid size-12 place-items-center rounded-full bg-white/90 text-navy">
                  <Play className="size-5" />
                </div>
              </div>
              <div className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px]">0:30</div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Film className="size-3.5" /> AI Video • Reel
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Before / After */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <GlassCard className="bg-white/5 border-white/10 p-6">
            <div className="mb-2 text-xs uppercase tracking-wider text-white/50">Before</div>
            <p className="text-sm text-white/70">"new product available come check it out"</p>
            <div className="mt-4 h-24 rounded-lg bg-gradient-to-br from-gray-500 to-gray-700" />
          </GlassCard>
          <GlassCard className="bg-primary/10 border-primary/30 p-6">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
              <Sparkles className="size-3" /> After (AI-enhanced)
            </div>
            <p className="text-sm">
              "✨ Introducing our newest drop — designed for makers who refuse to settle.
              Limited run. Shop now before it's gone."
            </p>
            <div className="mt-4 h-24 rounded-lg bg-gradient-to-br from-primary via-violet-500 to-pink-500" />
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

// ---------------- 6. AI Video Studio ----------------

function VideoStudio() {
  return (
    <section id="video-studio" className="py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <SectionLabel>AI Video Studio</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            From script to render, in one timeline.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Generate scripts with AI, record voiceovers, auto-generate subtitles, and export
            optimized for TikTok, Reels, Shorts, and YouTube — all from one studio.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              { i: Mic2, l: "AI Voiceovers" },
              { i: Captions, l: "Auto Subtitles" },
              { i: PenLine, l: "AI Scripts" },
              { i: Smartphone, l: "Multi-format export" },
            ].map((x) => (
              <div key={x.l} className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-3 text-sm">
                <x.i className="size-4 text-primary" /> {x.l}
              </div>
            ))}
          </div>
        </div>
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-border/60 bg-card p-3 text-xs font-medium">
            Video timeline • product-launch-v2.mp4
          </div>
          <div className="space-y-3 bg-gradient-to-br from-card to-surface p-5">
            {/* Video preview */}
            <div className="aspect-video w-full overflow-hidden rounded-lg bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
              <div className="grid h-full place-items-center">
                <div className="rounded-full bg-white/90 p-3 text-foreground">
                  <Play className="size-6" />
                </div>
              </div>
            </div>
            {/* Tracks */}
            {[
              { l: "Video", c: "from-violet-500 to-purple-500", w: "w-full" },
              { l: "Audio", c: "from-emerald-500 to-teal-500", w: "w-5/6" },
              { l: "Subtitles", c: "from-pink-500 to-rose-500", w: "w-4/5" },
              { l: "B-roll", c: "from-amber-500 to-orange-500", w: "w-2/3" },
            ].map((t) => (
              <div key={t.l} className="flex items-center gap-3">
                <div className="w-16 text-[11px] text-muted-foreground">{t.l}</div>
                <div className="h-6 flex-1 rounded-md bg-muted/40 p-0.5">
                  <div className={`h-full rounded bg-gradient-to-r ${t.c} ${t.w}`} />
                </div>
              </div>
            ))}
            {/* Export options */}
            <div className="flex flex-wrap gap-2 pt-2">
              {["TikTok 9:16", "Reels 9:16", "YouTube 16:9", "Shorts 9:16"].map((p) => (
                <span key={p} className="rounded-full border border-border bg-background px-3 py-1 text-xs">{p}</span>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

// ---------------- 7. Calendar ----------------

function CalendarShowcase() {
  const week = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const events = [
    { d: 0, t: "9:00", l: "Instagram", c: "bg-pink-500/20 text-pink-600" },
    { d: 1, t: "12:00", l: "TikTok", c: "bg-purple-500/20 text-purple-600" },
    { d: 2, t: "10:30", l: "Facebook", c: "bg-blue-500/20 text-blue-600" },
    { d: 3, t: "14:00", l: "X Post", c: "bg-cyan-500/20 text-cyan-600" },
    { d: 4, t: "11:00", l: "Reel", c: "bg-rose-500/20 text-rose-600" },
    { d: 5, t: "16:00", l: "YouTube", c: "bg-red-500/20 text-red-600" },
  ];
  return (
    <section id="calendar" className="bg-surface/60 py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <GlassCard className="order-2 overflow-hidden p-0 lg:order-1">
          <div className="border-b border-border/60 bg-card p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
              </span>
              <div className="flex gap-1">
                <span className="rounded bg-muted px-2 py-0.5">Week</span>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">Month</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 p-3">
            {week.map((d) => (
              <div key={d} className="pb-1 text-center text-[10px] font-medium text-muted-foreground">{d}</div>
            ))}
            {Array.from({ length: 28 }).map((_, i) => {
              const ev = events.find((e) => e.d === i);
              return (
                <div key={i} className="h-16 rounded-md border border-border/40 bg-background/60 p-1 text-[10px]">
                  <div className="text-muted-foreground">{i + 1}</div>
                  {ev && (
                    <div className={`mt-0.5 truncate rounded px-1 py-0.5 ${ev.c}`}>
                      {ev.t} {ev.l}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
        <div className="order-1 lg:order-2">
          <SectionLabel>Content Calendar</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Plan a month of content in an afternoon.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Drag, drop, schedule. Approval workflows built-in. Publish to every platform automatically.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Drag-and-drop scheduling across platforms",
              "Multi-platform publishing (Instagram, Facebook, TikTok, X, YouTube)",
              "Client approval workflows with one-click sign-off",
              "Recurring content templates and bulk scheduling",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ---------------- 8. Team Collaboration ----------------

function TeamCollab() {
  return (
    <section id="team" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Team Collaboration</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Your whole team, in sync.
          </h2>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Chat */}
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <MessagesSquare className="size-4 text-primary" /> Team chat
            </div>
            <div className="space-y-2 text-xs">
              {[
                { n: "Sarah", m: "Approved the launch creatives 🚀", me: false },
                { n: "You", m: "Pushing to scheduler now", me: true },
                { n: "AI Bot", m: "Generated 3 caption variants", me: false, ai: true },
              ].map((m, i) => (
                <div key={i} className={`flex ${m.me ? "justify-end" : ""}`}>
                  <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${
                    m.me ? "bg-primary text-primary-foreground" : m.ai ? "bg-violet-500/10 text-violet-700 dark:text-violet-300" : "bg-muted"
                  }`}>
                    <div className="text-[10px] opacity-70">{m.n}</div>
                    {m.m}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
          {/* Meetings */}
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4 text-primary" /> Meetings
            </div>
            <div className="space-y-2">
              {[
                { t: "Client kickoff", w: "Today • 2:00 PM" },
                { t: "Sprint review", w: "Tomorrow • 10:00 AM" },
                { t: "Strategy sync", w: "Fri • 3:30 PM" },
              ].map((m) => (
                <div key={m.t} className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 p-2 text-xs">
                  <div>
                    <div className="font-medium">{m.t}</div>
                    <div className="text-muted-foreground">{m.w}</div>
                  </div>
                  <div className="rounded bg-primary/10 px-2 py-0.5 text-primary">Join</div>
                </div>
              ))}
            </div>
          </GlassCard>
          {/* Tasks */}
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ListChecks className="size-4 text-primary" /> Task board
            </div>
            <div className="space-y-2 text-xs">
              {[
                { s: "Done", t: "Brand audit", d: true },
                { s: "In progress", t: "Q4 ad creatives" },
                { s: "Todo", t: "Client report" },
                { s: "Todo", t: "Schedule launch posts" },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/60 p-2">
                  <div className={`size-4 rounded-full border-2 ${t.d ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40"}`} />
                  <div className={t.d ? "line-through text-muted-foreground" : ""}>{t.t}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}

// ---------------- 9. Client Portal ----------------

function ClientPortal() {
  return (
    <section id="portal" className="bg-surface/60 py-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
        <div>
          <SectionLabel>Client Portal</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Give your clients a world-class experience.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A white-label portal where clients track campaigns, approve content, read meeting summaries, and get instant AI support.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Live campaign tracking and reports",
              "One-click content approvals",
              "Auto-generated meeting summaries",
              "24/7 AI chatbot support trained on their data",
            ].map((x) => (
              <li key={x} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {x}
              </li>
            ))}
          </ul>
        </div>
        <GlassCard className="overflow-hidden p-0">
          <div className="border-b border-border/60 bg-card p-3 text-xs">
            <span className="font-medium">Acme Realty</span> <span className="text-muted-foreground">• Client view</span>
          </div>
          <div className="space-y-3 bg-gradient-to-br from-card to-surface p-4">
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <div className="text-xs font-medium">Q4 Lead Gen Campaign</div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-cyan-400" />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>74% complete</span><span>$12k / $16k</span>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 p-3">
              <div className="text-xs font-medium">Pending approval</div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-10 w-10 rounded bg-gradient-to-br from-pink-400 to-orange-400" />
                <div className="flex-1 text-xs">
                  <div className="font-medium">November Reels — 4 posts</div>
                  <div className="text-muted-foreground">Review before Fri</div>
                </div>
                <button className="rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-600">Approve</button>
              </div>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Bot className="size-3.5 text-primary" /> AI Assistant
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                "How did last month's campaign perform?"
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}

// ---------------- 10. Security ----------------

function Security() {
  const items = [
    { i: Lock, t: "Role-based access", d: "Roles stored in a separate table and checked server-side" },
    { i: ShieldCheck, t: "Encryption in transit & at rest", d: "HTTPS/TLS everywhere; encrypted storage by default" },
    { i: FileCheck2, t: "Row-level security", d: "Per-user and per-client data isolation at the database" },
    { i: Eye, t: "Audit logs", d: "Sensitive actions are recorded for review" },
    { i: UsersRound, t: "Privacy controls", d: "Granular permissions per team and client" },
    { i: Sparkles, t: "AI safety policy", d: "Clear rules for AI content — review before publish" },
  ];
  return (
    <section id="security" className="relative overflow-hidden py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-50" style={{
        background: "radial-gradient(circle at 80% 20%, color-mix(in oklab, var(--primary) 25%, transparent), transparent 50%)"
      }} />
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Security & Privacy</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Security and privacy, built in.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            See full details on our <Link to="/security" className="text-primary hover:underline">Security</Link> page.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.t} className="flex gap-4 rounded-2xl border border-border/70 bg-card p-5">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <it.i className="size-5" />
              </div>
              <div>
                <div className="font-semibold">{it.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{it.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- 11. Automation ----------------

function Automation() {
  const steps = [
    { i: Users, l: "Client intake", c: "from-emerald-500 to-teal-500" },
    { i: Wand2, l: "AI generation", c: "from-violet-500 to-purple-500" },
    { i: FileCheck2, l: "Approval", c: "from-amber-500 to-orange-500" },
    { i: CalendarDays, l: "Scheduling", c: "from-blue-500 to-cyan-500" },
    { i: Send, l: "Publishing", c: "from-pink-500 to-rose-500" },
    { i: BarChart3, l: "Analytics", c: "from-indigo-500 to-blue-500" },
  ];
  return (
    <section id="automation" className="bg-navy py-24 text-navy-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Workflows on autopilot</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Automate the entire client lifecycle.
          </h2>
          <p className="mt-4 text-lg text-white/70">
            From the moment a client signs up to the moment they renew — every step is connected.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-6">
          {steps.map((s, i) => (
            <div key={s.l} className="relative">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
                <div className={`mx-auto grid size-12 place-items-center rounded-xl bg-gradient-to-br ${s.c} text-white shadow-lg`}>
                  <s.i className="size-5" />
                </div>
                <div className="mt-3 text-sm font-medium">{s.l}</div>
                <div className="mt-1 text-[10px] text-white/50">Step {i + 1}</div>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute right-[-10px] top-1/2 hidden -translate-y-1/2 md:block">
                  <ArrowRight className="size-4 text-white/40" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3 text-xs text-white/60">
          {[
            { i: Workflow, l: "Visual workflow builder" },
            { i: Zap, l: "1,000+ automation triggers" },
            { i: GitBranch, l: "Conditional logic" },
            { i: BellRing, l: "Real-time notifications" },
          ].map((t) => (
            <div key={t.l} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <t.i className="size-3.5" /> {t.l}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- 12. Pricing ----------------

const plans = [
  {
    name: "Starter", price: "49", desc: "For solo marketers and freelancers",
    features: ["Up to 3 clients", "AI Copywriter (basic)", "Content calendar", "1 user", "Email support"],
    cta: "Start free trial", featured: false,
  },
  {
    name: "Agency", price: "149", desc: "For growing agencies",
    features: ["Up to 25 clients", "All AI tools (unlimited)", "AI Video Studio", "Team chat & meetings", "Client portal", "Up to 10 users", "Priority support"],
    cta: "Start free trial", featured: true,
  },
  {
    name: "Enterprise", price: "Custom", desc: "For large agencies and teams",
    features: ["Unlimited clients", "Unlimited users", "White-label portal", "SAML SSO + audit logs", "Dedicated success manager", "Custom integrations"],
    cta: "Contact sales", featured: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Simple pricing</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Pricing that scales with you.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            14-day free trial. No credit card required. Cancel anytime.
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            Placeholder pricing — billing is not yet active
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                p.featured
                  ? "border-primary bg-gradient-to-b from-primary/10 to-transparent shadow-2xl shadow-primary/10 md:scale-105"
                  : "border-border bg-card"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Most popular
                </div>
              )}
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="mt-1 text-sm text-muted-foreground">{p.desc}</div>
              <div className="mt-6 flex items-baseline gap-1">
                {p.price === "Custom" ? (
                  <span className="text-4xl font-bold">Custom</span>
                ) : (
                  <>
                    <span className="text-5xl font-bold">${p.price}</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              {p.name === "Enterprise" ? (
                <Link
                  to="/contact"
                  className="mt-7 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-accent"
                >
                  {p.cta} <ArrowRight className="size-3.5" />
                </Link>
              ) : (
                <Link
                  to="/auth"
                  search={{ mode: "signup", plan: p.name.toLowerCase() }}
                  className={`mt-7 inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-semibold ${
                    p.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30"
                      : "border border-border bg-background hover:bg-accent"
                  }`}
                >
                  {p.cta} <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- 13. Testimonials ----------------

const testimonials = [
  { quote: "Example testimonial placeholder — replace with a real customer quote before launch.", name: "Customer name", role: "Role, Company" },
  { quote: "Example testimonial placeholder — replace with a real customer quote before launch.", name: "Customer name", role: "Role, Company" },
  { quote: "Example testimonial placeholder — replace with a real customer quote before launch.", name: "Customer name", role: "Role, Company" },
  { quote: "Example testimonial placeholder — replace with a real customer quote before launch.", name: "Customer name", role: "Role, Company" },
];

function Testimonials() {
  return (
    <section className="bg-surface/60 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Testimonials (placeholders)</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Real teams. Real results.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">Replace with real customer quotes before launch.</p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <GlassCard key={`${t.name}-${i}`} className="p-6">
              <p className="text-base leading-relaxed">"{t.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-primary to-navy text-sm font-semibold text-white">
                  {t.name.split(" ").map((w) => w[0]).join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- 14. FAQ ----------------

const faqs = [
  { q: "How does AI content work?", a: "Our AI Copywriter, Image Generator, and Video Studio are trained on each client's brand voice, audience, and assets. You describe what you need; we generate on-brand variants in seconds. You stay in full creative control." },
  { q: "Can clients log in?", a: "Yes. Every client gets a white-label portal where they can view campaigns, approve content, read meeting summaries, and chat with an AI assistant trained on their account." },
  { q: "Does it support social posting?", a: "Yes. Schedule and publish to Instagram, TikTok, LinkedIn, X, YouTube, Facebook, and Pinterest. Built-in approval flows and multi-platform calendars included." },
  { q: "Can my team collaborate?", a: "Absolutely. Real-time team chat, meeting scheduling, task boards, shared notes, and live activity indicators — all in one workspace." },
  { q: "Is my data secure?", a: "We use HTTPS/TLS in transit, encrypted storage at rest, role-based access control, and Row-Level Security so each client's data is isolated. See our Security page for full details." },
  { q: "Does it support AI videos?", a: "Yes. The AI Video Studio handles scripts, voiceovers, subtitles, B-roll, and exports in 9:16 (TikTok, Reels, Shorts), 16:9 (YouTube), and square formats." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Common questions.
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <div key={f.q} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-medium">{f.q}</span>
                <ChevronDown className={`size-5 shrink-0 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-muted-foreground animate-fade-in">{f.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- 15. Final CTA ----------------

function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-navy via-navy to-primary p-12 text-center text-navy-foreground md:p-16">
          <div className="absolute inset-0 opacity-30" style={{
            background: "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--primary) 60%, white), transparent 60%)"
          }} />
          <div className="relative">
            <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
              Build Your AI-Powered Marketing Agency Today
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">
              Start your free 14-day trial. No credit card required.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth" search={{ mode: "signup" }} className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-navy hover:bg-white/90">
                Start Free <ArrowRight className="size-4" />
              </Link>
              <Link to="/book-demo" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold backdrop-blur hover:bg-white/10">
                Book Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------- 16. Footer ----------------

function Footer() {
  type Item = { label: string; to?: string; href?: string };
  const cols: { h: string; l: Item[] }[] = [
    { h: "Product", l: [
      { label: "Features", href: "#features" },
      { label: "AI Studio", href: "#showcase" },
      { label: "Pricing", href: "#pricing" },
      { label: "Watch demo", to: "/demo" },
      { label: "Book demo", to: "/book-demo" },
    ]},
    { h: "Company", l: [
      { label: "Contact", to: "/contact" },
      { label: "Security", to: "/security" },
    ]},
    { h: "Legal", l: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Cookie Policy", to: "/cookies" },
      { label: "AI Content Policy", to: "/ai-content-policy" },
      { label: "Upload & Ownership", to: "/upload-ownership-policy" },
    ]},
  ];
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative size-8 rounded-lg bg-gradient-to-br from-primary to-navy">
                <Sparkles className="absolute inset-0 m-auto size-4 text-white" />
              </div>
              <span className="text-base font-semibold tracking-tight">Agency OS</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The AI-powered platform for modern digital marketing agencies.
            </p>
            <div className="mt-5 flex gap-2">
              {[Twitter, Linkedin, Github, Instagram].map((I, i) => (
                <Link key={i} to="/contact" aria-label="Contact us on social" className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground">
                  <I className="size-4" />
                </Link>
              ))}
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <div className="text-sm font-semibold">{c.h}</div>
              <ul className="mt-4 space-y-2">
                {c.l.map((x) => (
                  <li key={x.label}>
                    {x.to ? (
                      <Link to={x.to} className="text-sm text-muted-foreground hover:text-foreground">{x.label}</Link>
                    ) : (
                      <a href={x.href} className="text-sm text-muted-foreground hover:text-foreground">{x.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 md:flex-row">
          <p className="text-xs text-muted-foreground">© 2026 Digital Agency OS. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">Made for marketers, by marketers.</p>
        </div>
      </div>
    </footer>
  );
}

// ---------------- Page ----------------

export function Landing() {
  return (
    <div className="min-h-screen scroll-smooth bg-background text-foreground">
      <AnnouncementBar />
      <TopNav />
      <Hero />
      <TrustedBy />
      <CoreFeatures />
      <AIContentShowcase />
      <VideoStudio />
      <CalendarShowcase />
      <TeamCollab />
      <ClientPortal />
      <Security />
      <Automation />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}
