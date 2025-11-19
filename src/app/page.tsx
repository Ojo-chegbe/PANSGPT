"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Brain, 
  CheckCircle, 
  MessageSquare, 
  ListChecks, 
  Lightbulb, 
  Check,
  ArrowRight
} from "lucide-react";
import Navigation from "@/components/landing/Navigation";
import Footer from "@/components/landing/Footer";
import { WhatIsPansGPT } from "@/components/landing/WhatIsPansGPT";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import { ChatMockup } from "@/components/landing/ChatMockup";
import { QuizMockup } from "@/components/landing/QuizMockup";
import { FeedbackMockup } from "@/components/landing/FeedbackMockup";
import { TestimonialCard } from "@/components/landing/TestimonialCard";
import Link from "next/link";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/main");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-xl text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      {/* Navigation */}
      <Navigation />

      {/* Main Content Wrapper */}
      <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 sm:px-8 lg:px-12 bg-gradient-to-b from-background via-background to-green-950/5 dark:to-green-950/10">
        <div className="container mx-auto">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            <div className="space-y-10">
              {/* Badge */}
              <div>
                <Badge variant="secondary" className="w-fit mx-auto px-4 py-1.5 text-xs font-medium tracking-wide uppercase border border-border/50 bg-background/50 backdrop-blur-sm">
                  Built by PANSites, for PANSites
                </Badge>
              </div>
              
              {/* Heading */}
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight">
                  The Ultimate Study Hack
                  <br />
                  <span className="text-green-600 dark:text-green-500">
                    for PANSites
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                  PansGPT is a study partner built just for PANSites. It has already read all your official course notes. Ask it a question, and get a simple, correct answer in seconds.
                </p>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/signup">
                  <Button size="lg" className="group px-8 py-6 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 rounded-xl">
                    Start Studying Smarter
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 text-sm text-muted-foreground justify-center pt-6">
                <div className="flex items-center gap-2.5 group">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-medium">No credit card required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is PansGPT Section */}
      <WhatIsPansGPT />

      {/* Why Use PansGPT Section */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl text-foreground">
              Because Your 2 AM Cram Session <br />
              <span className="text-primary">Needs a Co-pilot.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-8 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-foreground">Find Answers in Seconds</h3>
                <p className="text-muted-foreground">
                  No more scrolling through 10 giant PDFs to find one definition. Just ask, "What is the mechanism of action for Metformin?" and get the answer instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-8 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Brain className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-foreground">Actually Learn the Topic</h3>
                <p className="text-muted-foreground">
                  Don't just memorize—understand. Ask "Why does this drug work this way?" and get a simple explanation, based on your lecturer's exact notes.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-8 space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-foreground">Test Yourself Before the Exam</h3>
                <p className="text-muted-foreground">
                  Stop guessing what's important. Create quizzes from your notes to find out what you don't know, so you can fix it before the test.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Comparison Section */}
      <section className="py-20 px-6 sm:px-8 lg:px-12 bg-card/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl text-foreground">
              How PansGPT is Different <br />
              <span className="text-primary">from ChatGPT</span>
            </h2>
          </div>

          <ComparisonTable />

          <p className="text-center text-lg text-muted-foreground mt-12">
            Using ChatGPT for your course is like searching a giant, messy library with no librarian. <br />
            <span className="text-foreground">PansGPT is your personal, organized study folder.</span>
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl text-foreground">
              Everything You Need to <span className="text-primary">Study Better</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed specifically for pharmacy students at University of Jos
            </p>
          </div>

          <div className="space-y-32">
            <FeatureShowcase 
              icon={MessageSquare}
              title="Chat With Your Notes"
              description="Ask questions and get answers from your entire curriculum. You can even filter by Lecturer, Course Code, and Year of Study. No more endless scrolling through PDFs—just ask and get instant, accurate answers from your course materials."
              mockup={<ChatMockup />}
            />
            
            <FeatureShowcase 
              icon={ListChecks}
              title="Smart Quiz Generator"
              description="Create quizzes that really test your understanding. It asks you questions in different ways (not just definitions) to make sure you're ready. Generate custom quizzes on any topic and identify your weak spots before exam day."
              mockup={<QuizMockup />}
              reverse
            />
            
            <FeatureShowcase 
              icon={Lightbulb}
              title="Helpful Quiz Feedback"
              description="Our quizzes don't just say 'correct' or 'wrong.' They explain why an answer is right, helping you learn from your mistakes. Get detailed explanations with references to your course materials so you truly understand the concepts."
              mockup={<FeedbackMockup />}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6 sm:px-8 lg:px-12 bg-card/30">
        <div className="container mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl text-foreground">
              Built by PANSites. <span className="text-primary">Trusted by PANSites.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <TestimonialCard 
              quote="PansGPT helps me study faster. I use it to summarize 10 lectures into one and then generate 50 quiz questions to find my weak spots. It's how I find what I don't know before an exam."
              name="Kelvin A."
              role="500 Level (Academic Excellence Awardee)"
              imageUrl="https://images.unsplash.com/photo-1685538856920-9c7cdd86a49c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwc3R1ZGVudCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MjEwODQ2OHww&ixlib=rb-4.1.0&q=80&w=1080"
            />
            
            <TestimonialCard 
              quote="I was failing PHA 303. I just couldn't keep up. PansGPT was like having a patient friend explain things to me over and over. I finally understood pharmacodynamics, and I passed. It's a lifesaver."
              name="Anita E."
              role="300 Level"
              imageUrl="https://images.unsplash.com/photo-1706025090794-7ade2c1b6208?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDF8fHx8MTc2MjA1MDY5OHww&ixlib=rb-4.1.0&q=80&w=1080"
            />
            
            <TestimonialCard 
              quote="As an educator, my goal is to help students understand complex topics, not just memorize. The way PansGPT uses our own materials to help students learn is remarkable. I am recommending it to all my students as a powerful study aid."
              name="Dr. [Respected Lecturer's Name]"
              role="Dept. of Clinical Pharmacy"
              imageUrl="https://images.unsplash.com/photo-1758270705031-ebd46917a454?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwcHJvZmVzc29yJTIwdGVhY2hpbmd8ZW58MXx8fHwxNzYyMDE3Njc1fDA&ixlib=rb-4.1.0&q=80&w=1080"
            />
            
            <TestimonialCard 
              quote="We built this because we lived through the 2 AM cram sessions. We knew there had to be a better way than scrolling through 20 different PDFs. This is the tool we wish we had."
              name="The PansGPT Team"
              role="Creators"
              imageUrl="https://images.unsplash.com/photo-1685538856920-9c7cdd86a49c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwc3R1ZGVudCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MjEwODQ2OHww&ixlib=rb-4.1.0&q=80&w=1080"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-5xl text-foreground mb-12">
            Your Next Exam is Coming. <br />
            <span className="text-primary">Be Ready for It.</span>
          </h2>
          
         

          <Link href="/signup">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Study Smarter
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-6 sm:px-8 lg:px-12 bg-card/30">
        <div className="mx-auto max-w-lg">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl text-foreground">
              Got Questions? <span className="text-primary">We've Got Answers.</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4 w-full">
            <AccordionItem value="item-1" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-foreground hover:text-primary">
                Is this cheating?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No. PansGPT is a study tool, like a textbook, past question, or a tutor. It helps you understand your notes, not cheat on a test. It even tells you where in your notes the answer came from, so you learn the source material.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-foreground hover:text-primary">
                How do I know the answers are correct?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                PansGPT only uses your official UJ Pharmacy notes. Its answers are as accurate as your course materials. It is not guessing from the internet.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-foreground hover:text-primary">
                Can I upload my own notes?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can add your own personal notes, jottings, or anything else to a private, secure folder that only you can see.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-20 px-6 sm:px-8 lg:px-12">
        <div className="container mx-auto max-w-4xl text-center">
          <blockquote className="space-y-4">
            <p className="text-3xl md:text-4xl text-foreground italic">
              "Because every PANSite deserves a friend who understands it all."
            </p>
            <footer className="text-xl text-primary">— The PansGPT Team</footer>
          </blockquote>
      </div>
      </section>

      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
} 