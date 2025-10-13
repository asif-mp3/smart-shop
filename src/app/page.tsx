import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const HomePage = () => {
  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-16">
        <div className="mb-4">
          <h1 className="text-4xl font-bold">Product Recommender</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl">
          AI-powered product recommendations with intelligent explanations based
          on your behavior and preferences
        </p>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto mb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              Discover Products Tailored for You
            </CardTitle>
            <CardDescription className="text-base">
              Our recommendation engine analyzes your behavior to suggest
              products you'll love, with clear explanations for every
              recommendation
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto mb-20">
        <h2 className="text-2xl font-semibold mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit mb-2">
                Step 1
              </Badge>
              <CardTitle>Browse Products</CardTitle>
              <CardDescription>
                Explore our product catalog and interact with items that
                interest you
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit mb-2">
                Step 2
              </Badge>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>
                Our system analyzes your behavior and preferences to understand
                what you're looking for
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Badge variant="outline" className="w-fit mb-2">
                Step 3
              </Badge>
              <CardTitle>Get Recommendations</CardTitle>
              <CardDescription>
                Receive personalized product suggestions with AI-generated
                explanations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="max-w-7xl mx-auto mb-20">
        <h2 className="text-2xl font-semibold mb-8">Technology Stack</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Backend</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Recommendation API with machine learning</li>
                  <li>• Database for products & user interactions</li>
                  <li>• LLM integration for explanations</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Frontend</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Next.js with React</li>
                  <li>• Real-time recommendation updates</li>
                  <li>• Interactive product dashboard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="max-w-7xl mx-auto mb-20" />

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto text-center mb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl mb-4">
              Ready to Get Personalized Recommendations?
            </CardTitle>
            <CardDescription className="text-base mb-6">
              Start exploring products and let our AI help you discover items
              you'll love
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center">
              <Button size="lg">Start Shopping</Button>
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;
