import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PrivacyResultsDetail } from "@/components/privacy-results-detail";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyResultsPage() {
  const [, navigate] = useLocation();
  
  const state = history.state?.usr as any;
  
  if (!state?.result) {
    return (
      <DashboardLayout title="Results" breadcrumbs={[{ label: "Privacy Enhancement" }, { label: "Results" }]}>
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-muted-foreground">No results to display</p>
          <Button onClick={() => navigate("/privacy")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Privacy Enhancement
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Privacy Enhancement Results" breadcrumbs={[{ label: "Privacy Enhancement" }, { label: "Results" }]}>
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/privacy")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Privacy Enhancement
        </Button>
        <PrivacyResultsDetail result={state.result} />
      </div>
    </DashboardLayout>
  );
}
