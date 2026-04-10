import Image from "next/image";
import Link from "next/link";

const reviews = [
  {
    name: "Sarah M.",
    role: "Product Designer",
    body: "Extinguish helped me realize I was burning out months before it became a crisis. The daily check-ins are so quick I actually stick with them.",
    rating: 5,
  },
  {
    name: "James T.",
    role: "Software Engineer",
    body: "I was skeptical about journaling, but the AI insights make it feel less like a chore and more like a conversation. Genuinely useful.",
    rating: 4,
  },
  {
    name: "Priya K.",
    role: "Startup Founder",
    body: "The burnout risk index is eye-opening. Seeing the trends over weeks finally convinced me to take a real vacation.",
    rating: 5,
  },
  {
    name: "David L.",
    role: "Clinical Psychologist",
    body: "I recommend Extinguish to clients who aren't ready for therapy. It's a thoughtful, low-friction way to start paying attention to wellbeing.",
    rating: 5,
  },
  {
    name: "Mia C.",
    role: "UX Researcher",
    body: "Clean, distraction-free, and genuinely smart. The morning and afternoon prompts fit naturally into my schedule.",
    rating: 4,
  },
  {
    name: "Carlos R.",
    role: "Engineering Manager",
    body: "My whole team started using it. The statistics page gave us language to actually talk about stress at work.",
    rating: 4,
  },
];

const features = [
  {
    image: "/product/journal_morning.png",
    tag: "Morning Journal",
    title: "Start every day with intention.",
    description:
      "A brief, guided morning check-in helps you set the tone before the noise kicks in. Reflect on how you slept, what you're feeling, and what matters today.",
    flip: false,
  },
  {
    image: "/product/insights.png",
    tag: "AI Insights",
    title: "Patterns you'd never notice alone.",
    description:
      "Our AI reads between the lines of your entries and surfaces meaningful trends, from recurring stress triggers to shifts in your emotional vocabulary over time.",
    flip: true,
  },
  {
    image: "/product/journal_afternoon.png",
    tag: "Afternoon Journal",
    title: "Close the loop before the day ends.",
    description:
      "A short afternoon reflection lets you decompress, capture what went well, and flag what drained you so tomorrow starts with context.",
    flip: false,
  },
];

const footerLinks = {
  Product: ["Features", "Pricing", "Changelog", "Roadmap", "Status"],
  Company: ["About", "Blog", "Careers", "Press", "Brand"],
  Resources: [
    "Documentation",
    "Help Center",
    "Community",
    "Webinars",
    "Research",
  ],
  Legal: [
    "Privacy Policy",
    "Terms of Service",
    "Cookie Policy",
    "Security",
    "Accessibility",
  ],
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-foreground" : "fill-foreground/20"}`}
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Page() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="font-mono text-sm font-semibold tracking-tight">
            Extinguish
          </span>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
            <a
              href="#features"
              className="transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#reviews"
              className="transition-colors hover:text-foreground"
            >
              Reviews
            </a>
            <a
              href="#footer"
              className="transition-colors hover:text-foreground"
            >
              Company
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-32">
          {/* Subtle grid background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.145 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.145 0 0) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
          <div className="relative mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl">
              Journal your way
              <br />
              <span className="text-muted-foreground">out of burnout.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground sm:text-lg">
              Extinguish combines guided daily reflection with AI analysis to
              help you spot burnout before it happens.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-full bg-foreground px-7 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
              >
                Start journaling free
              </Link>
              <a
                href="#features"
                className="rounded-full border border-border px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                See how it works
              </a>
            </div>

            {/* Hero image */}
            <div className="relative mt-16 overflow-hidden rounded-2xl border border-border shadow-2xl shadow-foreground/5">
              <Image
                src="/product/hero.png"
                alt="Extinguish app interface"
                width={1200}
                height={750}
                className="w-full object-cover"
                priority
              />
              {/* Fade to white at bottom so it blends into next section */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
            </div>
          </div>
        </section>

        {/* Social proof bar */}
        <section className="border-y border-border/50 bg-muted/30 px-6 py-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <p className="text-xs text-muted-foreground sm:shrink-0">
              A Capstone Project
            </p>
            {/* Divider */}
            <div className="hidden h-8 w-px bg-border sm:block" />
            {/* Logos side by side */}
            <div className="flex items-center gap-2">
              {/* TMU logo */}

              <Image
                src="/TMU-rgb.svg"
                alt="Toronto Metropolitan University"
                width={500}
                height={500}
                className="h-24 w-auto object-contain"
              />
              {/* ECB department text block — mirrors the image layout */}
              <div className="flex flex-col justify-center leading-tight">
                <span className="text-[11px] font-semibold text-foreground">
                  Department of Electrical,
                </span>
                <span className="text-[11px] font-semibold text-foreground">
                  Computer, And Biomedical Engineering
                </span>
                <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                  Faculty of Engineering and Architectural Science
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Features
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to understand yourself.
              </h2>
            </div>

            <div className="space-y-24">
              {features.map((f) => (
                <div
                  key={f.tag}
                  className={`flex flex-col items-center gap-12 lg:flex-row ${
                    f.flip ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Image */}
                  <div className="w-full overflow-hidden rounded-2xl border border-border shadow-xl shadow-foreground/5 lg:w-1/2">
                    <Image
                      src={f.image}
                      alt={f.title}
                      width={700}
                      height={480}
                      className="w-full object-cover"
                    />
                  </div>

                  {/* Text */}
                  <div className="flex w-full flex-col gap-4 lg:w-1/2">
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {f.tag}
                    </span>
                    <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                      {f.title}
                    </h3>
                    <p className="text-base leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                    <Link
                      href="/signup"
                      className="mt-2 inline-flex w-fit items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      Try it yourself
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stat strip */}
        <section className="border-y border-border/50 bg-muted/30 px-6 py-14">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-10 sm:grid-cols-4">
            {[
              { value: "10k+", label: "Active users" },
              { value: "2.1M", label: "Entries written" },
              { value: "94%", label: "Feel more self-aware" },
              { value: "3 min", label: "Average check-in time" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col gap-1 text-center">
                <span className="text-3xl font-bold tracking-tight">
                  {s.value}
                </span>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="overflow-hidden px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <div className="mb-16 text-center">
              <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Reviews
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                People who used to be burned out.
              </h2>
            </div>

            <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
              {reviews.map((r) => (
                <div
                  key={r.name}
                  className="mb-6 break-inside-avoid rounded-2xl border border-border bg-muted/20 p-6"
                >
                  <StarRating rating={r.rating} />
                  <p className="mt-3 text-sm leading-relaxed text-foreground">
                    {r.body}
                  </p>
                  <div className="mt-4 flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="footer" className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category} className="flex flex-col gap-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
                  {category}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-start justify-between gap-4 border-t border-border pt-8 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-sm font-semibold">
                Extinguish
              </span>
              <span className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Extinguish Inc. All rights
                reserved.
              </span>
            </div>
            <div className="flex items-center gap-5 text-muted-foreground">
              {/* X / Twitter */}
              <a
                href="#"
                aria-label="Twitter"
                className="transition-colors hover:text-foreground"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="#"
                aria-label="LinkedIn"
                className="transition-colors hover:text-foreground"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              {/* GitHub */}
              <a
                href="#"
                aria-label="GitHub"
                className="transition-colors hover:text-foreground"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
