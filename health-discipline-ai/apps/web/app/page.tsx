import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Health Discipline AI</h1>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-primary hover:underline"
            >
              Login
            </Link>
            <Link
              href="/register/payer"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold tracking-tight mb-6">
            Your Parents' Health,<br />
            <span className="text-primary">One Phone Call Away</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            AI-powered daily voice calls to check if your parents took their medicines.
            No app needed. No tech skills required. Simple as answering a phone call.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register/payer"
              className="px-8 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Start Free Trial
            </Link>
            <Link
              href="/register/hospital"
              className="px-8 py-3 text-lg font-medium border border-primary text-primary rounded-lg hover:bg-primary/5"
            >
              For Hospitals
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            7-day free trial. Cancel anytime. Starting at INR 499/month.
          </p>
        </section>

        <section className="bg-muted py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">Set Up Your Parent</h4>
                <p className="text-muted-foreground">
                  Add your parent's details, medicines, and preferred call times via WhatsApp or web.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">AI Calls Daily</h4>
                <p className="text-muted-foreground">
                  Our AI calls your parent by their preferred name, in their language, asking about each medicine.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h4 className="text-xl font-semibold mb-2">Get Instant Reports</h4>
                <p className="text-muted-foreground">
                  Receive immediate WhatsApp updates after each call plus weekly health reports.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Health Discipline AI - Voice is the most inclusive interface</p>
        </div>
      </footer>
    </div>
  );
}
