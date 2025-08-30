import { useState } from "react";
import QRScanner from "./components/qr-scanner";
import GroupSelector from "./components/group-selector";
import ResultsDisplay from "./components/results-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { PWAInstaller } from "@/components/pwa-installer";
import {  QrCode, Users } from "phosphor-react";

interface Result {
  name: string;
  status: string;
  success: boolean;
}

function App() {
  const [selectedGroup, setSelectedGroup] = useState("G6");
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQRScan = async (qrCode: string) => {
    setIsProcessing(true);
    setResults([]);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/mark_attendance';
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: selectedGroup,
          qr_code: qrCode,
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim());

          lines.forEach((line) => {
            const [name, status] = line.split(":");
            if (name && status) {
              const result: Result = {
                name: name.trim(),
                status: status.trim(),
                success: status.includes("SUCCESS"),
              };
              setResults((prev) => [...prev, result]);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      setResults([
        {
          name: "Error",
          status: `Failed to mark attendance: ${error instanceof Error ? error.message : "Unknown error"}`,
          success: false,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground font-sans">
        {/* Mobile-optimized container with safe area padding */}
        <div className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
          {/* Header with improved mobile spacing */}
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div className="flex items-center gap-2">
              <img src="/icon.svg" className="w-10"/>
              <h1 className="text-3xl font-black text-sky-500 font-heading">OurCamu</h1>
            </div>
            <div className="flex items-center gap-2">
              <PWAInstaller />
              <ModeToggle />
            </div>
          </div>

          {/* Mobile-first grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Scanner Controls Card */}
            <Card className="order-1">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="font-heading text-base sm:text-lg">Scanner Controls</CardTitle>
                <QrCode size={20} weight="bold" className="sm:w-6 sm:h-6" />
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <GroupSelector
                  selectedGroup={selectedGroup}
                  onGroupChange={setSelectedGroup}
                />
                <QRScanner onScan={handleQRScan} disabled={isProcessing} />
              </CardContent>
            </Card>
            
            {/* Results Card */}
            <Card className="order-2">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="font-heading text-base sm:text-lg">
                  Attendance Results
                </CardTitle>
                <Users size={20} weight="bold" className="sm:w-6 sm:h-6" />
              </CardHeader>
              <CardContent>
                <ResultsDisplay results={results} isProcessing={isProcessing} />
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
