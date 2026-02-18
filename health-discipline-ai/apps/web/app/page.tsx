import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">Health Discipline</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register/payer"
              className="px-5 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Trusted by 200+ families across India
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Know how your parents
              <br />
              <span className="text-primary">are really doing</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              A warm AI companion calls your parents daily, checks on their wellbeing,
              medicines, and mood &mdash; then sends you the truth. In their language. No app needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register/payer"
                className="px-8 py-3.5 text-base font-medium bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
              >
                Start 7-Day Free Trial
              </Link>
              <Link
                href="/register/hospital"
                className="px-8 py-3.5 text-base font-medium border-2 border-border text-foreground rounded-xl hover:bg-secondary transition-colors"
              >
                For Hospitals & Clinics
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-5">
              No credit card required. Starting at ₹1,350/month ($15).
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-secondary/50 py-20 border-y border-border/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight mb-3">Simple as 1-2-3</h2>
              <p className="text-muted-foreground">Set up once. We handle the rest, every single day.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/50">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <span className="text-xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Add your parent</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Their name, medicines, and phone number. That&apos;s all. Takes 2 minutes.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/50">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <span className="text-xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">AI calls daily</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  A warm voice calls them by name, in their language, checking on their health and wellbeing.
                </p>
              </div>
              <div className="bg-card rounded-2xl p-8 shadow-sm border border-border/50">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <span className="text-xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">You get updates</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Instant WhatsApp wellness reports after each call. Weekly summaries. Peace of mind.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight mb-3">Built for Indian families</h2>
              <p className="text-muted-foreground mb-12">Because your parents deserve more than a pill reminder they&apos;ll ignore.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="flex gap-4 p-5 rounded-xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">11 Indian languages</h4>
                  <p className="text-sm text-muted-foreground">Hindi, Telugu, Tamil, Kannada, Bengali, Marathi, and more.</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 rounded-xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">No tech needed</h4>
                  <p className="text-sm text-muted-foreground">Works on any phone. Your parents just answer a call. That&apos;s it.</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 rounded-xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Vitals tracking</h4>
                  <p className="text-sm text-muted-foreground">Optional glucose and BP check-ins during the daily call.</p>
                </div>
              </div>
              <div className="flex gap-4 p-5 rounded-xl bg-card border border-border/50">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Genuinely caring</h4>
                  <p className="text-sm text-muted-foreground">Not a robot reading a script. A warm, patient voice like family.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          Health Discipline &mdash; Voice is the most inclusive interface
        </div>
      </footer>
    </div>
  );
}
