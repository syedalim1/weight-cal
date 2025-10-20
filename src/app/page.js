import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Wrench } from "lucide-react";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background via-secondary/20 to-background">
      <Card className="w-full max-w-md shadow-[var(--shadow-elevated)]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Pipe Weight Calculator</CardTitle>
          <CardDescription>Select the type of calculator you need</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/ss-calculator">
            <Button className="w-full" size="lg">
              <Calculator className="mr-2 h-5 w-5" />
              SS Tube Calculator
            </Button>
          </Link>
          <Link href="/ms-pipe-calculator">
            <Button className="w-full" variant="outline" size="lg">
              <Wrench className="mr-2 h-5 w-5" />
              MS Pipe Calculator
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
