'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, AlertCircle, Key, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PixelRain } from '@/components/pixel-rain';
import { AnimatedLogo } from '@/components/animated-logo';
import { paymentApi } from '@/lib/api';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const RobloxIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M5.164 0L.001 18.928 18.836 24l5.164-18.928L5.164 0zm8.049 15.994l-5.157-1.413 1.413-5.157 5.157 1.413-1.413 5.157z"/>
  </svg>
);

const BitcoinIcon = () => (
  <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
    <circle cx="16" cy="16" r="16" fill="#F7931A"/>
    <path fill="#fff" d="M22.7 14.3c.4-2.7-1.7-4.1-4.4-5.1l.9-3.6-2.2-.6-.9 3.5c-.6-.1-1.2-.3-1.8-.4l.9-3.6-2.2-.6-.9 3.6c-.5-.1-1-.2-1.5-.4l.1-.1-3.1-.8-.6 2.4s1.7.4 1.6.4c.9.2 1.1.8 1.1 1.2l-1.1 4.5c.1 0 .2.1.3.1l-.3-.1-1.6 6.3c-.1.3-.4.8-1 .6.1.1-1.6-.4-1.6-.4l-1.1 2.6 2.9.7c.5.1 1 .3 1.5.4l-.9 3.7 2.2.6.9-3.6c.6.2 1.2.3 1.8.5l-.9 3.5 2.2.6.9-3.7c3.8.7 6.6-.4 7.8-3.1.9-2.4-.1-4.4-2.1-5.5 1.5-.3 2.6-1.2 2.9-3.1zm-5.3 6.7c-.7 2.8-5.4 1.3-7 1l1.2-5c1.5.4 6.4 1.1 5.8 4zm.7-6.8c-.6 2.5-4.5 1.2-5.8 1l1.1-4.6c1.3.3 5.5.9 4.7 3.6z"/>
  </svg>
);

const EthereumIcon = () => (
  <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
    <circle cx="16" cy="16" r="16" fill="#627EEA"/>
    <path fill="#fff" d="M16 6l-7 12 7 4 7-4-7-12zm0 2.5l5.5 10-5.5 3-5.5-3 5.5-10z"/>
    <path fill="#fff" opacity=".6" d="M16 14.5l-7 3.5 7 4 7-4-7-3.5z"/>
  </svg>
);

const LitecoinIcon = () => (
  <svg viewBox="0 0 32 32" className="w-10 h-10" fill="none">
    <circle cx="16" cy="16" r="16" fill="#345D9D"/>
    <path fill="#fff" d="M10 19.5l1.5-6h9c.8 0 1.3.5 1.1 1.3l-.3 1.2c-.2.6-.7 1-1.3 1h-6l-.5 2h8c.8 0 1.3.5 1.1 1.3l-.3 1.2c-.2.6-.7 1-1.3 1H8.5l1.5-6.5h-2l.5-2h2z"/>
  </svg>
);

type PaymentMethod = 'robux' | 'btc' | 'eth' | 'ltc' | null;
type Step = 'select' | 'pay' | 'verify' | 'success';

const WALLETS = {
  btc: 'bc1q6ut7d7rmfvjq9fsh8cd8gumtdpys0jsq5gcq2m',
  eth: '0x433a9e59Da4C02216b28E0847d60fd8B25563a70',
  ltc: 'LQbFLZ3jFo7yc9uGNozHmpGSUQkXgMUvxq',
};

const GAMEPASS_ID = '1385281940';
const GAMEPASS_PRICE = '1,000 Robux';
const USD_PRICE = '$6.99';

export default function BuyPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [step, setStep] = useState<Step>('select');
  const [robloxUsername, setRobloxUsername] = useState('');
  const [cryptoWallet, setCryptoWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [walletCopied, setWalletCopied] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  const copyToClipboard = async (text: string, type: 'key' | 'wallet') => {
    await navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setWalletCopied(true);
      setTimeout(() => setWalletCopied(false), 2000);
    }
  };

  const selectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep('pay');
    setError('');
  };

  const confirmPayment = () => {
    setHasPurchased(true);
    setStep('verify');
  };

  const handleVerify = async () => {
    if (selectedMethod === 'robux' && !robloxUsername.trim()) {
      setError('Please enter your Roblox username');
      return;
    }
    if (selectedMethod !== 'robux' && !cryptoWallet.trim()) {
      setError('Please enter your wallet address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (selectedMethod === 'robux') {
        // Call real API to verify gamepass ownership
        const result = await paymentApi.verifyGamepass(robloxUsername.trim());
        
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        
        if (result.verified && result.key) {
          setGeneratedKey(result.key);
          setStep('success');
        } else {
          setError('Gamepass not owned. Please purchase the gamepass first, then verify.');
        }
      } else {
        // Call real API to verify crypto payment
        const cryptoType = selectedMethod as 'btc' | 'eth' | 'ltc';
        const result = await paymentApi.verifyCrypto(cryptoWallet.trim(), cryptoType);
        
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        
        if (result.verified && result.key) {
          setGeneratedKey(result.key);
          setStep('success');
        } else {
          setError('Payment not found. Please send payment and wait for confirmation.');
        }
      }
    } catch (err) {
      setError('Failed to verify payment. Please try again or contact support.');
    }
    
    setLoading(false);
  };

  const goBack = () => {
    if (step === 'pay') {
      setSelectedMethod(null);
      setStep('select');
    } else if (step === 'verify') {
      setStep('pay');
    }
    setError('');
  };

  const StepIndicator = () => (
    <div className="my-6 flex items-center justify-center">
      <div className="flex w-full max-w-md items-center">
        {['select', 'pay', 'verify', 'success'].map((s, i, steps) => {
          const currentStepIndex = steps.indexOf(step);
          const isCompleted = currentStepIndex > i;
          const isActive = step === s;

          return (
            <div key={s} className="flex flex-1 items-center">
              <div className="flex flex-1 justify-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                  isActive ? 'bg-[#ff2a2a] text-white' :
                  isCompleted ? 'bg-green-500 text-white' :
                  'bg-white/8 text-white/50'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center leading-none">{i + 1}</span>
                  )}
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 px-2">
                  <div className={`h-0.5 w-full ${currentStepIndex > i ? 'bg-green-500' : 'bg-white/15'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (step === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
        <PixelRain />

        <Card className="w-full max-w-md glass border-border/50 relative z-10 animate-scale-in">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Key className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Payment Verified!</h2>
            <p className="text-muted-foreground mb-6 text-sm">Here is your license key</p>
            
            <div className="bg-input/80 rounded-lg p-4 mb-6 border border-primary/30">
              <code className="text-lg tracking-widest text-primary">{generatedKey}</code>
            </div>

            <Button
              onClick={() => copyToClipboard(generatedKey, 'key')}
              className="w-full bg-primary hover:bg-primary/90 mb-4 h-11 transition-all hover:shadow-lg hover:shadow-primary/30"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Key
                </>
              )}
            </Button>

            <Link href="/login">
              <Button variant="outline" className="w-full h-11 border-primary/30 hover:bg-primary/10">
                Go to Login
              </Button>
            </Link>

            <div className="mt-6 pt-6 border-t border-border/50">
              <a
                href="https://discord.gg/aqx7MfHXCJ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-[#5865F2] hover:text-[#5865F2]/80 transition-all hover:scale-105"
              >
                <DiscordIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm leading-none">Join our Discord</span>
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background p-4 overflow-hidden">
      <PixelRain />

      <div className="max-w-[900px] mx-auto relative z-10 px-5 py-10">
        <Link href="/login" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-all hover:translate-x-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="text-center mb-8 animate-fade-in">
          <img 
            src="/images/logo-full.png" 
            alt="Antromic" 
            className="mx-auto mb-4 h-24 w-auto object-contain"
          />
          <h1 className="text-2xl font-bold text-foreground mb-2">Purchase License</h1>
          <p className="text-muted-foreground">
            <span className="text-primary text-xl font-bold">{USD_PRICE}</span>
            <span className="text-sm ml-2">/ 30 days</span>
          </p>
        </div>

        <StepIndicator />

        {step === 'select' && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-[18px] font-semibold text-center mt-4">Step 1: Select Payment Method</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <Card
                className="cursor-pointer hover:border-primary transition-all glass border-border/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
                onClick={() => selectMethod('robux')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] flex-shrink-0">
                    <RobloxIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">Robux</h3>
                    <p className="text-sm text-muted-foreground">{GAMEPASS_PRICE}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary transition-all glass border-border/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
                onClick={() => selectMethod('btc')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#F7931A]/20 flex items-center justify-center text-[#F7931A] flex-shrink-0">
                    <BitcoinIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">Bitcoin</h3>
                    <p className="text-sm text-muted-foreground">{USD_PRICE} in BTC</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary transition-all glass border-border/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
                onClick={() => selectMethod('eth')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#627EEA]/20 flex items-center justify-center text-[#627EEA] flex-shrink-0">
                    <EthereumIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">Ethereum</h3>
                    <p className="text-sm text-muted-foreground">{USD_PRICE} in ETH</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:border-primary transition-all glass border-border/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1"
                onClick={() => selectMethod('ltc')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-[#345D9D]/20 flex items-center justify-center text-[#345D9D] flex-shrink-0">
                    <LitecoinIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">Litecoin</h3>
                    <p className="text-sm text-muted-foreground">{USD_PRICE} in LTC</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-6">
              <a
                href="https://discord.gg/aqx7MfHXCJ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] px-6 py-3 rounded-lg transition-all border border-[#5865F2]/30 hover:scale-105"
              >
                <DiscordIcon className="w-6 h-6 flex-shrink-0" />
                <span className="font-medium leading-none">Join our Discord for Support</span>
              </a>
            </div>
          </div>
        )}

        {step === 'pay' && (
          <Card className="glass border-border/50 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedMethod === 'robux' ? 'bg-[#3B82F6]/20 text-[#3B82F6]' :
                  selectedMethod === 'btc' ? 'bg-[#F7931A]/20 text-[#F7931A]' :
                  selectedMethod === 'eth' ? 'bg-[#627EEA]/20 text-[#627EEA]' :
                  'bg-[#345D9D]/20 text-[#345D9D]'
                }`}>
                  {selectedMethod === 'robux' && <RobloxIcon />}
                  {selectedMethod === 'btc' && <BitcoinIcon />}
                  {selectedMethod === 'eth' && <EthereumIcon />}
                  {selectedMethod === 'ltc' && <LitecoinIcon />}
                </div>
                Step 2: Make Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedMethod === 'robux' ? (
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                      <h4 className="font-semibold text-sm">Purchase the Gamepass</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 pl-8">
                      Click the button below to purchase the gamepass for {GAMEPASS_PRICE}
                    </p>
                    <div className="pl-8">
                      <a
                        href={`https://www.roblox.com/game-pass/${GAMEPASS_ID}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="bg-[#E2231A] hover:bg-[#C31E17] text-white transition-all hover:shadow-lg">
                          Open Gamepass Page
                        </Button>
                      </a>
                    </div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                      <h4 className="font-semibold text-sm">Confirm Purchase</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 pl-8">
                      After purchasing, click the button below to continue
                    </p>
                    <div className="pl-8">
                      <Button
                        onClick={confirmPayment}
                        className="bg-green-600 hover:bg-green-700 text-white transition-all hover:shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {"I've Purchased the Gamepass"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
                      <h4 className="font-semibold text-sm">Send Payment</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 pl-8">
                      Send exactly {USD_PRICE} worth of {selectedMethod?.toUpperCase()} to:
                    </p>
                    <div className="flex items-center gap-2 bg-input/80 rounded-lg p-3 border border-border/50 ml-8">
                      <code className="text-xs flex-1 break-all text-foreground">
                        {WALLETS[selectedMethod as 'btc' | 'eth' | 'ltc']}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(WALLETS[selectedMethod as 'btc' | 'eth' | 'ltc'], 'wallet')}
                        className="shrink-0"
                      >
                        {walletCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
                      <h4 className="font-semibold text-sm">Confirm Payment</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 pl-8">
                      After sending, click the button below to continue
                    </p>
                    <div className="pl-8">
                      <Button
                        onClick={confirmPayment}
                        className="bg-green-600 hover:bg-green-700 text-white transition-all hover:shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        {"I've Sent the Payment"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Button variant="ghost" onClick={goBack} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Choose different method
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'verify' && (
          <Card className="glass border-border/50 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                Step 3: Verify Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
                {selectedMethod === 'robux' ? (
                  <>
                    <h4 className="font-semibold mb-2 text-sm">Enter your Roblox username</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      We&apos;ll verify that you own the gamepass
                    </p>
                    <Input
                      value={robloxUsername}
                      onChange={(e) => setRobloxUsername(e.target.value)}
                      placeholder="Your Roblox username"
                      className="bg-input/80 h-11 mb-4 focus:shadow-lg focus:shadow-primary/20"
                    />
                  </>
                ) : (
                  <>
                    <h4 className="font-semibold mb-2 text-sm">Enter your wallet address</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Enter the wallet address you sent the payment from
                    </p>
                    <Input
                      value={cryptoWallet}
                      onChange={(e) => setCryptoWallet(e.target.value)}
                      placeholder="Your wallet address"
                      className="bg-input/80 h-11 mb-4 focus:shadow-lg focus:shadow-primary/20"
                    />
                  </>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 mb-4 animate-shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <Button
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 h-11 transition-all hover:shadow-lg hover:shadow-primary/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Verify Payment
                    </>
                  )}
                </Button>
              </div>

              <Button variant="ghost" onClick={goBack} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go back
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center space-y-3">
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Antromic - All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
