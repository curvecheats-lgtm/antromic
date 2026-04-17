'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Clock, AlertCircle, Sparkles } from 'lucide-react';

export default function ResellPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" />
          Resell Program
        </h1>
        <p className="text-muted-foreground">Become an Antromic reseller</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="bg-card border-border">
        <CardHeader className="text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Coming Soon</CardTitle>
          <CardDescription className="text-base">
            The reseller program is currently in development
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Discounted Keys</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Get access to bulk pricing and discounted license keys for resale
              </p>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Priority Support</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Dedicated support channel for all your reseller needs
              </p>
            </div>
          </div>

          {/* Notification Signup */}
          <div className="bg-secondary/30 rounded-lg p-6 border border-border/50">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Want to be notified?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Join our Discord server to be the first to know when the reseller program launches.
            </p>
            <a
              href="https://discord.gg/aqx7MfHXCJ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white">
                Join Discord Server
              </Button>
            </a>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-muted-foreground text-center">
            Reseller applications will open soon. Stay tuned for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
