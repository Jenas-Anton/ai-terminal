"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { QrCode, Copy, Check } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const startDeviceFlow = async () => {
    try {
      setIsLoading(true);
      const response = await authClient.signIn.deviceFlow({});
      
      if (response.data) {
        setDeviceCode(response.data.deviceCode);
        setUserCode(response.data.userCode);
        
        // Generate QR code URL (you can also use a QR code library)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
          `https://genai-cli.com/device?user_code=${response.data.userCode}`
        )}`;
        setQrCode(qrUrl);
        
        toast.success("Device code generated! Scan the QR code or enter the code on another device.");
      }
    } catch (error) {
      console.error("Device flow error:", error);
      toast.error("Failed to initiate device flow");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    if (userCode) {
      navigator.clipboard.writeText(userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Code copied to clipboard!");
    }
  };

  if (deviceCode && userCode) {
    return (
      <div className="flex flex-col gap-6 justify-center items-center min-h-screen">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Image 
            src={"/login.svg"} 
            alt="Login" 
            height={300} 
            width={300}
          />
          <h1 className="text-4xl font-extrabold text-indigo-400">Welcome Back!</h1>
          <p className="text-base font-medium text-zinc-400">Device Flow Authentication</p>
        </div>

        <Card className="border-dashed border-2 w-full max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* QR Code */}
              {qrCode && (
                <div className="flex justify-center">
                  <img 
                    src={qrCode} 
                    alt="Device QR Code" 
                    className="w-64 h-64 border-2 border-indigo-400 rounded-lg p-2"
                  />
                </div>
              )}

              {/* User Code */}
              <div className="space-y-2">
                <p className="text-sm text-center text-zinc-400">Or enter this code on another device:</p>
                <div className="flex gap-2">
                  <Input 
                    value={userCode} 
                    readOnly 
                    className="text-center text-lg font-bold tracking-widest"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyCode}
                    type="button"
                    className="focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Next Steps:</p>
                <ol className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-decimal list-inside">
                  <li>Use the CLI command: <code className="bg-black/20 px-2 py-1 rounded text-xs">genai login</code></li>
                  <li>Enter the code above when prompted</li>
                  <li>You'll be authenticated!</li>
                </ol>
              </div>

              <Button 
                variant="outline"
                className="w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => {
                  setDeviceCode(null);
                  setUserCode(null);
                  setQrCode(null);
                }}
                type="button"
              >
                Start Over
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-zinc-500 max-w-md text-center">
          This device flow is designed for CLI authentication. Scan the QR code with your mobile device or enter the code in your terminal.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 justify-center items-center min-h-screen">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Image 
          src={"/login.svg"} 
          alt="Login" 
          height={500} 
          width={500}
        />
        <h1 className="text-6xl font-extrabold text-indigo-400">Welcome Back!</h1>
        <h2 className="text-2xl font-bold text-zinc-300">to GenAI CLI</h2>
        <p className="text-base font-medium text-zinc-400">Authenticate using Device Flow</p>
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <Button
              size="lg"
              className="w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={isLoading}
              onClick={startDeviceFlow}
              type="button"
            >
              <QrCode className="mr-2 h-5 w-5" />
              {isLoading ? "Generating Code..." : "Start Device Flow"}
            </Button>

            <p className="text-xs text-center text-zinc-500">
              No social login required. Use your CLI or scan a QR code.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



