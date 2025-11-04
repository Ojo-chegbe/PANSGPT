"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { motion } from "framer-motion";
import { 
  Download, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  Shield,
  Zap,
  BookOpen,
  Apple,
  ArrowRight,
  Share2,
  Home,
  Sparkles,
  Target,
  TrendingUp,
  FileCheck,
  PlayCircle,
  Brain
} from "lucide-react";
import { useState } from "react";
import Navigation from "@/components/landing/Navigation";
import Footer from "@/components/landing/Footer";

export default function DownloadPage() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background dark">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 sm:px-8 lg:px-12 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Download Available Now
                </Badge>
              </motion.div>
              
              <motion.h1 
                className="text-5xl lg:text-6xl text-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Get PANSGPT on Your Phone
              </motion.h1>
              
              <motion.p 
                className="text-xl text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Study smarter with PANSGPT right in your pocket. Access your personalized pharmacy tutor anytime, anywhere.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4 pt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground group">
                  <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                  Download for Android
                </Button>
                <Button size="lg" variant="outline">
                  <Apple className="w-5 h-5 mr-2" />
                  iOS Instructions
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                className="flex flex-wrap gap-6 pt-6 border-t border-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>100% Safe</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="w-5 h-5 text-primary" />
                  <span>Instant Setup</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <span>Native Experience</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Visual Mockup */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
              <motion.div 
                className="relative"
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ duration: 0.3 }}
              >
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1691256676376-357c3aa66c89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHBob25lJTIwbW9ja3VwJTIwaGFuZHxlbnwxfHx8fDE3NjIxMTE4MzJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="PANSGPT App Mockup"
                  className="w-full h-auto rounded-2xl"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Download Section */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl text-foreground mb-4">
              Why Download PANSGPT?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the full power of your personalized pharmacy tutor with our native app
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Smartphone,
                title: "Native App Experience",
                description: "Get a dedicated app with push notifications, better performance, and a seamless experience designed specifically for your phone.",
                color: "text-blue-500"
              },
              {
                icon: Zap,
                title: "Faster Performance",
                description: "Native app means instant loading, smoother animations, and quicker responses. No waiting for web pages to load.",
                color: "text-yellow-500"
              },
              {
                icon: BookOpen,
                title: "One Tap Access",
                description: "Launch PANSGPT directly from your home screen. No need to open a browser or bookmark a link.",
                color: "text-primary"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <Card className="bg-card border-border h-full hover:border-primary/50 transition-all duration-300">
                  <CardContent className="pt-6">
                    <motion.div 
                      className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4"
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </motion.div>
                    <h3 className="text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Download for Android Section */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              <Download className="w-3 h-3 mr-1" />
              Available Now
            </Badge>
            <h2 className="text-4xl lg:text-5xl text-foreground mb-4">
              Download PANSGPT for Android
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              You can now download PANSGPT directly — no Play Store required. After downloading, simply install the file and start learning instantly.
            </p>
          </motion.div>

          {/* Installation Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { step: 1, icon: Download, title: "Tap Download", description: "Click the button below to download the APK file" },
              { step: 2, icon: FileCheck, title: "Open File", description: "Find the downloaded file in your notifications" },
              { step: 3, icon: Shield, title: "Allow Installation", description: "Tap 'Install' and grant permission" },
              { step: 4, icon: Sparkles, title: "Start Learning", description: "Open PANSGPT and ace your exams" }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onHoverStart={() => setHoveredStep(index)}
                onHoverEnd={() => setHoveredStep(null)}
              >
                <Card className={`bg-card border-border h-full transition-all duration-300 ${hoveredStep === index ? 'border-primary scale-105' : ''}`}>
                  <CardContent className="pt-6 text-center">
                    <motion.div 
                      className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4"
                      animate={hoveredStep === index ? { rotate: [0, -10, 10, -10, 0] } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                        {item.step}
                      </span>
                      <item.icon className="w-7 h-7 text-primary" />
                    </motion.div>
                    <h4 className="text-foreground mb-2">{item.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Download Button */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 group">
                <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Download PANSGPT (Android APK)
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground mt-4">
              File size: ~25MB • Version 1.0.0 • Last updated: November 2025
            </p>
          </motion.div>

          {/* Security Note */}
          <motion.div 
            className="mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-foreground mb-2">Safe & Secure Download</h4>
                    <p className="text-muted-foreground text-sm">
                      Our APK is digitally signed and verified. If your device shows a security warning about "unknown sources," 
                      it's normal — just go to your settings and allow installation from this source. PANSGPT is completely safe and built specifically for University of Jos Pharmacy students.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* iOS Section */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20 mb-4">
              <Clock className="w-3 h-3 mr-1" />
              Coming Soon
            </Badge>
            <h2 className="text-4xl lg:text-5xl text-foreground mb-4">
              iOS Version Coming Soon
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're currently perfecting the iOS version of PANSGPT. But you can still use it today — directly from your browser.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <motion.div 
              className="order-2 lg:order-1"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full"></div>
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  transition={{ duration: 0.3 }}
                >
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1608714783717-618b2de85e39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpcGhvbmUlMjBob21lJTIwc2NyZWVufGVufDF8fHx8MTc2MjExMTgzMnww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="iPhone Home Screen"
                    className="relative w-full h-auto rounded-2xl"
                  />
                </motion.div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div 
              className="order-1 lg:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-3xl text-foreground mb-4">
                Use PANSGPT Now on iPhone
              </h3>
              <p className="text-muted-foreground mb-6">
                Just add PANSGPT to your home screen for a full app-like experience. It works just like a native app — with push notifications and instant loading.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: "Full-screen experience", description: "No browser bars, just pure learning" },
                  { title: "Launch from home screen", description: "One tap access, just like any app" },
                  { title: "Quick Access", description: "Study anywhere with one tap from your home screen" }
                ].map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex gap-3"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How to Add to Home Screen (iOS) */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="container mx-auto max-w-5xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl text-foreground mb-4">
              How to Add PANSGPT to Your Home Screen
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              You can add PANSGPT to your iPhone like a regular app. Here's how:
            </p>
          </motion.div>

          {/* Steps */}
          <div className="space-y-6 max-w-3xl mx-auto">
            {[
              { 
                step: 1, 
                icon: BookOpen, 
                title: "Open pansgpt.com in Safari", 
                description: "Make sure you're using Safari browser (not Chrome or any other browser). This feature only works in Safari on iOS.",
                tip: "Find Safari on your iPhone — it's the blue compass icon"
              },
              { 
                step: 2, 
                icon: Share2, 
                title: "Tap the Share icon", 
                description: "Look for the square icon with an arrow pointing up at the bottom of your screen (or top on iPad). Tap it to open the share menu.",
                tip: "It looks like this: □↑"
              },
              { 
                step: 3, 
                icon: Target, 
                title: "Scroll and tap 'Add to Home Screen'", 
                description: "In the share menu, scroll down until you find 'Add to Home Screen' option and tap it.",
                tip: "You might need to scroll down a bit to find it"
              },
              { 
                step: 4, 
                icon: Home, 
                title: "Name it 'PANSGPT' and tap Add", 
                description: "Give it a name (we suggest 'PANSGPT') and tap 'Add' in the top right corner. Now you can open it directly from your home screen anytime — just like a native app.",
                tip: "You can also customize the icon name if you want"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300">
                  <CardContent className="pt-6">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        <motion.div 
                          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.5 }}
                        >
                          <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
                            {item.step}
                          </span>
                          <item.icon className="w-7 h-7 text-primary" />
                        </motion.div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-foreground mb-2">{item.title}</h4>
                        <p className="text-muted-foreground mb-3">
                          {item.description}
                        </p>
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                          <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-muted-foreground">
                            <span className="text-primary">Tip:</span> {item.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Visual Guide */}
          <motion.div 
            className="mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                  >
                    <PlayCircle className="w-12 h-12 text-primary flex-shrink-0" />
                  </motion.div>
                  <div className="flex-1">
                    <h4 className="text-foreground mb-2">Need a visual guide?</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      We've created a short video showing each step. Watch it once and you'll have PANSGPT installed in less than 30 seconds.
                    </p>
                  </div>
                  <Button variant="outline" className="border-primary/20 hover:bg-primary/10 group">
                    Watch Tutorial
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 bg-gradient-to-br from-primary/10 via-background to-background border-y border-border">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain className="w-10 h-10 text-primary" />
            </motion.div>
            <h2 className="text-4xl lg:text-5xl text-foreground mb-4">
              Your Study Just Got Easier
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Don't waste time searching online for answers that don't match your notes. With PANSGPT, every explanation is built around your pharmacy lectures — clear, local, and reliable.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 group">
                <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                Download for Android
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" className="border-border hover:bg-muted group">
                <Apple className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Add to iPhone
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-3 gap-8 pt-8 border-t border-border max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {[
              { value: "500+", label: "Students Using", icon: TrendingUp },
              { value: "10K+", label: "Questions Answered", icon: CheckCircle },
              { value: "4.8★", label: "Average Rating", icon: Sparkles }
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.1, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-3xl text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

