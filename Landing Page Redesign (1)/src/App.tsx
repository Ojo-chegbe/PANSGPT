import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./components/ui/accordion";
import { Badge } from "./components/ui/badge";
import { FeatureCard } from "./components/FeatureCard";
import { FeatureShowcase } from "./components/FeatureShowcase";
import { TestimonialCard } from "./components/TestimonialCard";
import { StepCard } from "./components/StepCard";
import { ChatMockup } from "./components/ChatMockup";
import { QuizMockup } from "./components/QuizMockup";
import { FeedbackMockup } from "./components/FeedbackMockup";
import { ComparisonTable } from "./components/ComparisonTable";
import { WhatIsPansGPT } from "./components/WhatIsPansGPT";
import { HowItWorks } from "./components/HowItWorks";
import { MidPageCTA } from "./components/MidPageCTA";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
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
import { useState } from "react";
import About from "./About";
import DownloadPage from "./Download";
import TermsPage from "./Terms";
import ContactPage from "./Contact";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // Show About page if requested
  if (currentPage === "about") {
    return <About onNavigate={handleNavigate} />;
  }

  // Show Download page if requested
  if (currentPage === "download") {
    return <DownloadPage onNavigate={handleNavigate} />;
  }

  // Show Terms page if requested
  if (currentPage === "terms") {
    return <TermsPage onNavigate={handleNavigate} />;
  }

  // Show Contact page if requested
  if (currentPage === "contact") {
    return <ContactPage onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-background dark">
      {/* Navigation */}
      <Navigation currentPage="home" onNavigate={handleNavigate} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge variant="secondary" className="w-fit">
                Built by PANSites, for PANSites
              </Badge>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl text-foreground">
                  Stop Searching. <br />
                  <span className="text-primary">Start Understanding</span> <br />
                  Your Lecture Notes.
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-xl">
                  PansGPT is a free study partner built just for PANSites. It has already read all your official course notes. Ask it a question, and get a simple, correct answer in seconds.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Start Studying Smarter (It's 100% Free)
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>

              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>100% Free Forever</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden border border-border bg-card/50">
                <img 
                  src="https://images.unsplash.com/photo-1738831651985-e242f111309d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBwaGFybWFjeXxlbnwxfHx8fDE3NjIxMDg0Njd8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Student studying"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card border border-border rounded-xl p-4 shadow-xl max-w-sm">
                <p className="text-sm text-muted-foreground mb-2">Student asks:</p>
                <p className="text-foreground mb-3">"Explain Dr. Audu's one-compartment model in simple terms"</p>
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Instant, accurate answer from course materials</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is PansGPT Section */}
      <WhatIsPansGPT />

      {/* Why Use PansGPT Section */}
      <section className="py-20 px-4">
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

      {/* Mid-Page CTA */}
      <MidPageCTA />

      {/* Comparison Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
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
      <section id="features" className="py-20 px-4">
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
      <section id="testimonials" className="py-20 px-4 bg-card/30">
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
              name="[Your Name]"
              role="Creator of PansGPT"
              imageUrl="https://images.unsplash.com/photo-1685538856920-9c7cdd86a49c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwc3R1ZGVudCUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MjEwODQ2OHww&ixlib=rb-4.1.0&q=80&w=1080"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-5xl text-foreground">
            Your Next In-Course Exam is Coming. <br />
            <span className="text-primary">Be Ready for It.</span>
          </h2>
          
          <p className="text-xl text-muted-foreground">
            It takes 30 seconds to sign up. Get your 100% free account and start studying smarter, not just harder.
          </p>

          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Sign Up & Ace Your Next Test (for Free)
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl text-foreground">
              Got Questions? <span className="text-primary">We've Got Answers.</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
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
                Is it really free? What's the catch?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, it is 100% free. We are PANSites too, and we want everyone to be able to use it. There is no catch. We will never sell your personal data.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-foreground hover:text-primary">
                How do I know the answers are correct?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                PansGPT only uses your official UJ Pharmacy notes. Its answers are as accurate as your course materials. It is not guessing from the internet.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border border-border rounded-lg px-6">
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <blockquote className="space-y-4">
            <p className="text-3xl md:text-4xl text-foreground italic">
              "Because every PANSite deserves a friend who understands it all."
            </p>
            <footer className="text-xl text-primary">— The PansGPT Team</footer>
          </blockquote>
        </div>
      </section>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
