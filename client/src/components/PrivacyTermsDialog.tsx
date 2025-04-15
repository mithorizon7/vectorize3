import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText } from "lucide-react";

// Types for privacy policy and terms of service data
interface PolicyContent {
  title: string;
  lastUpdated: string;
  content: string[];
}

export default function PrivacyTermsDialog() {
  const [privacyPolicy, setPrivacyPolicy] = useState<PolicyContent | null>(null);
  const [termsOfService, setTermsOfService] = useState<PolicyContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Function to fetch both policies
    const fetchPolicies = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch privacy policy
        const privacyResponse = await fetch("/api/privacy-policy");
        if (!privacyResponse.ok) {
          throw new Error("Failed to load privacy policy");
        }
        const privacyData = await privacyResponse.json();
        
        // Fetch terms of service
        const termsResponse = await fetch("/api/terms");
        if (!termsResponse.ok) {
          throw new Error("Failed to load terms of service");
        }
        const termsData = await termsResponse.json();
        
        setPrivacyPolicy(privacyData);
        setTermsOfService(termsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching policies:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPolicies();
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
          Privacy & Terms
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Privacy Policy & Terms of Service</DialogTitle>
          <DialogDescription>
            How we handle your data and guidelines for using our service
          </DialogDescription>
        </DialogHeader>
        
        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        )}
        
        {error && (
          <div className="py-8 text-center text-destructive">
            {error}
          </div>
        )}
        
        {!isLoading && !error && (
          <Tabs defaultValue="privacy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="privacy" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Privacy Policy
              </TabsTrigger>
              <TabsTrigger value="terms" className="flex items-center">
                <FileText className="mr-2 h-4 w-4" />
                Terms of Service
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="privacy" className="py-4">
              {privacyPolicy && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium">{privacyPolicy.title}</h3>
                    <p className="text-sm text-muted-foreground">Last updated: {privacyPolicy.lastUpdated}</p>
                  </div>
                  
                  <div className="space-y-4">
                    {privacyPolicy.content.map((paragraph, index) => (
                      <p key={index} className="text-sm">{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="terms" className="py-4">
              {termsOfService && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium">{termsOfService.title}</h3>
                    <p className="text-sm text-muted-foreground">Last updated: {termsOfService.lastUpdated}</p>
                  </div>
                  
                  <div className="space-y-4">
                    {termsOfService.content.map((paragraph, index) => (
                      <p key={index} className="text-sm">{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        <DialogFooter>
          <Button variant="outline" type="button">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}