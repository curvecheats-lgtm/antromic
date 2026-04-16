'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Copy, Check, AlertCircle, Key, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
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
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z"/>
    <path fill="#fff" d="M14.26 9.598c.596-.314.996-.863.996-1.642 0-1.267-1.012-1.973-2.566-2.085V4.5h-1.05v1.354h-.84V4.5h-1.05v1.37H7.75v.88h.76c.35 0 .47.183.47.44v4.53c0 .31-.148.48-.504.48h-.726v.93l2 .002v1.37h1.05V13.13h.84v1.37h1.05v-1.387c1.774-.107 2.937-.754 2.937-2.307 0-1.097-.65-1.85-1.6-2.108zm-3.46-.354V7.452c.91.036 1.89.116 1.89.896 0 .716-.726.896-1.89.896zm2.236 3.097c0 .814-.91.91-2.236.91v-1.82c1.326 0 2.236.1 2.236.91z"/>
  </svg>
);

const EthereumIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
  </svg>
);

const LitecoinIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.385 4.667h2.985c.464 0 .765.318.677.783l-1.4 6.466 1.998-.682-.325 1.499-2.01.666-.818 3.767h6.062c.478 0 .782.316.697.78l-.343 1.595c-.083.453-.522.783-.988.783H6.875l1.146-5.27-2.012.677.338-1.57 2.01-.669 1.628-7.529c.087-.466.527-.796 1.005-.796l-.375-.02z"/>
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
    <div className="flex items-center justify-center gap-2 mb-8">
      {['select', 'pay', 'verify', 'success'].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step === s ? 'bg-primary text-primary-foreground scale-110' :
            ['select', 'pay', 'verify', 'success'].indexOf(step) > i ? 'bg-green-500 text-white' :
            'bg-muted text-muted-foreground'
          }`}>
            {['select', 'pay', 'verify', 'success'].indexOf(step) > i ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <span className="flex items-center justify-center h-full w-full leading-none">{i + 1}</span>
            )}
          </div>
          {i < 3 && <div className={`w-8 h-0.5 ${['select', 'pay', 'verify', 'success'].indexOf(step) > i ? 'bg-green-500' : 'bg-muted'}`} />}
        </div>
      ))}
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

      <div className="max-w-2xl mx-auto relative z-10 py-8">
        <Link href="/login" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-all hover:translate-x-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Link>

        <div className="text-center mb-8 animate-fade-in">
          <AnimatedLogo size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Purchase License</h1>
          <p className="text-muted-foreground">
            <span className="text-primary text-xl font-bold">{USD_PRICE}</span>
            <span className="text-sm ml-2">/ 30 days</span>
          </p>
        </div>

        <StepIndicator />

        {step === 'select' && (
          <div className="space-y-4 animate-slide-up">
            <h2 className="text-center text-lg font-semibold mb-6">Step 1: Select Payment Method</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className="cursor-pointer hover:border-primary transition-all glass border-border/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 card-realistic"
                onClick={() => selectMethod('robux')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#E2231A]/20 flex items-center justify-center text-[#E2231A] flex-shrink-0">
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
                className="cursor-pointer hover:border-primary transition-all glass border-border/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 card-realistic"
                onClick={() => selectMethod('btc')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#F7931A]/20 flex items-center justify-center text-[#F7931A] flex-shrink-0">
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
                className="cursor-pointer hover:border-primary transition-all glass border-border/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 card-realistic"
                onClick={() => selectMethod('eth')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#627EEA]/20 flex items-center justify-center text-[#627EEA] flex-shrink-0">
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
                className="cursor-pointer hover:border-primary transition-all glass border-border/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 card-realistic"
                onClick={() => selectMethod('ltc')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-[#345D9D]/20 flex items-center justify-center text-[#345D9D] flex-shrink-0">
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
                  selectedMethod === 'robux' ? 'bg-[#E2231A]/20 text-[#E2231A]' :
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
          <a
            href="https://discord.gg/aqx7MfHXCJ"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 text-[#5865F2] hover:text-[#5865F2]/80 transition-all hover:scale-105"
          >
            <DiscordIcon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm leading-none">Need help? Join our Discord</span>
          </a>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} curve.cc - All rights reserved.</p>
        </div>
      </div>
    </main>
  );
}
