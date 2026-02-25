'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import Link from 'next/link';

const AGENT_ID = 'agent_8401kheez5xxe9wv305azdv2kv26';

const LANGUAGES = [
  { code: 'hi', label: 'Hindi', script: '\u0939\u093F\u0902', greeting: 'Namaste' },
  { code: 'te', label: 'Telugu', script: '\u0C24\u0C46', greeting: 'Namaskaram' },
  { code: 'ta', label: 'Tamil', script: '\u0BA4', greeting: 'Vanakkam' },
  { code: 'kn', label: 'Kannada', script: '\u0C95', greeting: 'Namaskara' },
  { code: 'en', label: 'English', script: 'En', greeting: 'Hello' },
  { code: 'bn', label: 'Bengali', script: '\u09AC\u09BE', greeting: 'Nomoshkar' },
  { code: 'mr', label: 'Marathi', script: '\u092E', greeting: 'Namaskar' },
  { code: 'gu', label: 'Gujarati', script: '\u0A97\u0AC1', greeting: 'Namaste' },
  { code: 'ml', label: 'Malayalam', script: '\u0D2E', greeting: 'Namaskaram' },
  { code: 'pa', label: 'Punjabi', script: '\u0A2A\u0A70', greeting: 'Sat Sri Akaal' },
  { code: 'ur', label: 'Urdu', script: '\u0627\u064F', greeting: 'Assalaam Alaikum' },
];

const LANGUAGE_NAMES: Record<string, string> = {
  hi: 'Hindi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', en: 'English',
  bn: 'Bengali', mr: 'Marathi', gu: 'Gujarati', ml: 'Malayalam', pa: 'Punjabi', ur: 'Urdu',
};

type DemoPhase = 'setup' | 'connecting' | 'active' | 'ended' | 'error';

export function DemoConversation() {
  const [phase, setPhase] = useState<DemoPhase>('setup');
  const [language, setLanguage] = useState('hi');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const conversation = useConversation({
    onConnect: () => {
      setPhase('active');
      setElapsed(0);
    },
    onDisconnect: () => {
      setPhase('ended');
      if (timerRef.current) clearInterval(timerRef.current);
    },
    onError: (error: any) => {
      console.error('ElevenLabs error:', error);
      setErrorMsg(error?.message || 'Connection failed. Please try again.');
      setPhase('error');
      if (timerRef.current) clearInterval(timerRef.current);
    },
  });

  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'active' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const outputData = conversation.getOutputByteFrequencyData();
      const inputData = conversation.getInputByteFrequencyData();
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      const data = outputData || inputData;
      if (!data || data.length === 0) {
        const t = Date.now() / 1000;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 60 + Math.sin(t * 2) * 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(27, 67, 50, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 80 + Math.sin(t * 1.5) * 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(27, 67, 50, 0.08)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        animFrameRef.current = requestAnimationFrame(draw);
        return;
      }
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length / 255;
      const baseRadius = 50;
      const rings = 4;
      for (let r = 0; r < rings; r++) {
        const radius = baseRadius + r * 25 + avg * 40 * (r + 1) * 0.4;
        const alpha = 0.25 - r * 0.05;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(27, 67, 50, ${alpha})`;
        ctx.lineWidth = 2.5 - r * 0.4;
        ctx.stroke();
      }
      const centerR = baseRadius * 0.7 + avg * 15;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, centerR, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(27, 67, 50, ${0.08 + avg * 0.12})`;
      ctx.fill();
      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [phase, conversation]);

  const handleStart = useCallback(async () => {
    setPhase('connecting');
    setErrorMsg('');
    const selectedLang = LANGUAGES.find((l) => l.code === language);
    const greeting = selectedLang?.greeting || 'Namaste';
    const displayName = name.trim() || 'ji';
    const langName = LANGUAGE_NAMES[language] || 'Hindi';

    // Language-specific first messages so the agent starts in the right language
    const firstMessages: Record<string, string> = {
      hi: `${greeting} ${displayName}! Main Cocarely se bol rahi hoon. Aapka khayal rakhne ke liye call kar rahi hoon aaj. Kaisi hain aap?`,
      te: `${greeting} ${displayName}! Nenu Cocarely nundi call chesthunna. Mee aarogyam gurinchi adigadaaniki call chesanu. Ela unnaru?`,
      ta: `${greeting} ${displayName}! Naan Cocarely lerndhu call pannren. Unga udambu nalam paarkka call pannren. Eppadi irukkeenga?`,
      kn: `${greeting} ${displayName}! Naanu Cocarely indha call maadthiddini. Nimma arogya nodikollakke call maadidini. Hege iddira?`,
      en: `${greeting} ${displayName}! I'm calling from Cocarely. I'm calling to check on your health today. How are you doing?`,
      bn: `${greeting} ${displayName}! Ami Cocarely theke call korchi. Apnar shorir kemon ache dekhte call korechi. Kemon achen?`,
      mr: `${greeting} ${displayName}! Mi Cocarely madhun call karte. Tumchya tabyetichi chowkashi karayala call kela. Kase aahat?`,
      gu: `${greeting} ${displayName}! Hu Cocarely thi call karu chhu. Tamari tabiyat jova mate call karyu chhe. Kem chho?`,
      ml: `${greeting} ${displayName}! Njan Cocarely-il ninnum vilikkunnu. Ningalude aarogyam nokkaan aanu vilichath. Engane undu?`,
      pa: `${greeting} ${displayName}! Main Cocarely ton call kar rahi haan. Tuhaadi sehat bare puchhan layi call kiti. Tusi kiwe ho?`,
      ur: `${greeting} ${displayName}! Main Cocarely se call kar rahi hoon. Aapki sehat ka haal poochne ke liye call kiya. Kaise hain aap?`,
    };

    const firstMessage = firstMessages[language] || firstMessages['hi'];

    try {
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'webrtc',
        dynamicVariables: {
          patient_name: displayName,
          medicines_list: 'Metformin (morning), Amlodipine BP tablet (evening)',
          is_new_patient: 'true',
          has_glucometer: 'false',
          has_bp_monitor: 'false',
          preferred_language: langName,
          flow_directive: '',
          tone_directive: '',
          context_notes: 'Demo conversation \u2014 first-time user experiencing the product.',
          relationship_directive: 'Speak as if you already care deeply, even though this is a first call.',
          screening_questions: '',
          first_message_override: firstMessage,
          webhook_url: '',
        },
      });
    } catch (err: any) {
      console.error('Start session error:', err);
      setErrorMsg(
        err?.message?.includes('Permission')
          ? 'Microphone access is needed for the demo. Please allow microphone access and try again.'
          : 'Could not connect. Please check your internet connection and try again.'
      );
      setPhase('error');
    }
  }, [conversation, language, name]);

  const handleEnd = useCallback(async () => {
    await conversation.endSession();
    setPhase('ended');
    if (timerRef.current) clearInterval(timerRef.current);
  }, [conversation]);

  const handleReset = useCallback(() => {
    setPhase('setup');
    setErrorMsg('');
    setElapsed(0);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (phase === 'setup' || phase === 'error') {
    return (
      <div className="animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-heading sm:text-display-sm text-foreground">
            Talk to our <span className="text-gradient">AI wellness companion</span>
          </h1>
          <p className="mt-4 text-body-lg text-muted-foreground max-w-lg mx-auto">
            Experience a real wellness check-in — in your language.
            Just press start and have a conversation.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-card">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground/80 mb-3">
                Choose your language
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                      language === lang.code
                        ? 'bg-primary text-white shadow-soft'
                        : 'bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20'
                    }`}
                  >
                    <span className="text-xs font-bold">{lang.script}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <label htmlFor="demo-name" className="block text-sm font-semibold text-foreground/80 mb-2">
                Your name <span className="text-muted-foreground/70 font-normal">(optional)</span>
              </label>
              <input
                id="demo-name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all"
              />
            </div>

            {phase === 'error' && errorMsg && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-200/60 p-4 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <button onClick={handleStart} className="btn-primary w-full !py-4 !text-base">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
              Start Conversation
            </button>

            <p className="mt-4 text-center text-xs text-muted-foreground/70">
              Requires microphone access. Your audio is not recorded or stored.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'connecting') {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center">
            <svg className="h-10 w-10 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-primary/40 animate-ping" />
        </div>
        <p className="mt-8 text-lg font-medium text-foreground/80">Connecting...</p>
        <p className="mt-2 text-sm text-muted-foreground/70">Setting up your wellness check-in</p>
      </div>
    );
  }

  if (phase === 'active') {
    return (
      <div className="animate-fade-in flex flex-col items-center">
        <div className="text-center mb-6">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">
            {conversation.isSpeaking ? 'Agent is speaking' : 'Listening to you'}
          </p>
        </div>
        <div className="relative mb-8">
          <canvas ref={canvasRef} width={280} height={280} className="mx-auto" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 ${
              conversation.isSpeaking
                ? 'bg-primary text-white scale-110'
                : 'bg-primary/5 text-primary scale-100'
            }`}>
              {conversation.isSpeaking ? (
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
              ) : (
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                </svg>
              )}
            </div>
          </div>
        </div>
        <p className="text-2xl font-semibold text-foreground tabular-nums mb-8">
          {formatTime(elapsed)}
        </p>
        <button
          onClick={handleEnd}
          className="inline-flex items-center gap-2 rounded-full bg-red-500 px-8 py-3.5 text-sm font-semibold text-white shadow-soft transition-all duration-300 hover:bg-red-600 hover:shadow-card hover:-translate-y-0.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
          </svg>
          End Conversation
        </button>
      </div>
    );
  }

  if (phase === 'ended') {
    return (
      <div className="animate-fade-in flex flex-col items-center py-8">
        <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-heading-sm text-foreground mb-2">
          Hope you liked the experience!
        </h2>
        <p className="text-muted-foreground text-center max-w-sm mb-2">
          That was a demo of our daily wellness check-in. Your parents receive this call every day &mdash; in their language, at their pace.
        </p>
        {elapsed > 0 && (
          <p className="text-sm text-muted-foreground/70 mb-8">
            Conversation lasted {formatTime(elapsed)}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/register/payer" className="btn-primary">
            Start 7-Day Free Trial
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <button onClick={handleReset} className="btn-secondary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}
