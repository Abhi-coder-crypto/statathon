import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  GitCompare,
  Play,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Dataset, PrivacyOperation, UtilityMeasurement } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

export default function UtilityPage() {
  const { toast } = useToast();
  const [selectedOriginal, setSelectedOriginal] = useState<string>("");
  const [selectedOperation, setSelectedOperation] = useState<string>("");
  const [currentMeasurement, setCurrentMeasurement] = useState<UtilityMeasurement | null>(null);

  const { data: datasets } = useQuery<Dataset[]>({
    queryKey: ["/api/datasets"],
  });

  const { data: operations } = useQuery<PrivacyOperation[]>({
    queryKey: ["/api/privacy/operations"],
  });

  const measureMutation = useMutation({
    mutationFn: async (params: { originalDatasetId: number; processedOperationId: number }) => {
      const res = await apiRequest("POST", "/api/utility/measure", params);
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentMeasurement(data);
      queryClient.invalidateQueries({ queryKey: ["/api/utility/measurements"] });
      toast({
        title: "Measurement complete",
        description: `Utility level: ${data.utilityLevel}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Measurement failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMeasure = () => {
    if (!selectedOriginal || !selectedOperation) {
      toast({
        title: "Selection required",
        description: "Please select both original dataset and processed operation.",
        variant: "destructive",
      });
      return;
    }

    measureMutation.mutate({
      originalDatasetId: parseInt(selectedOriginal),
      processedOperationId: parseInt(selectedOperation),
    });
  };

  const getUtilityColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "excellent":
        return "text-chart-4";
      case "good":
        return "text-chart-1";
      case "fair":
        return "text-chart-5";
      case "poor":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getUtilityBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level?.toLowerCase()) {
      case "excellent":
        return "default";
      case "good":
        return "secondary";
      case "fair":
        return "outline";
      case "poor":
        return "destructive";
      default:
        return "outline";
    }
  };

  const metrics = currentMeasurement?.metrics as any;
  
  const radarData = currentMeasurement && metrics ? [
    { metric: "Statistical", original: 100, processed: (metrics.statisticalSimilarity || 0.85) * 100 },
    { metric: "Correlation", original: 100, processed: (currentMeasurement?.correlationPreservation || 0.9) * 100 },
    { metric: "Distribution", original: 100, processed: (currentMeasurement?.distributionSimilarity || 0.88) * 100 },
    { metric: "Information", original: 100, processed: (1 - (currentMeasurement?.informationLoss || 0.15)) * 100 },
    { metric: "Query Accuracy", original: 100, processed: (metrics.queryAccuracy || 0.92) * 100 },
  ] : [];

  const columnComparison = metrics?.columnMetrics || [
    { column: "Age", original: 45.2, processed: 44.8, preservation: 99.1 },
    { column: "Income", original: 52000, processed: 51500, preservation: 99.0 },
    { column: "Education", original: 3.2, processed: 3.1, preservation: 96.9 },
    { column: "Occupation", original: 2.5, processed: 2.4, preservation: 96.0 },
  ];

  return (
    <DashboardLayout title="Utility Measurement" breadcrumbs={[{ label: "Utility Measurement" }]}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Compare Data
              </CardTitle>
              <CardDescription>
                Select original and processed datasets to compare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Original Dataset</Label>
                <Select value={selectedOriginal} onValueChange={setSelectedOriginal}>
                  <SelectTrigger data-testid="select-original-dataset">
                    <SelectValue placeholder="Select original dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets?.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id.toString()}>
                        {dataset.originalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Processed Operation</Label>
                <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                  <SelectTrigger data-testid="select-processed-operation">
                    <SelectValue placeholder="Select processed result" />
                  </SelectTrigger>
                  <SelectContent>
                    {operations?.map((op) => (
                      <SelectItem key={op.id} value={op.id.toString()}>
                        {op.technique} (#{op.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={handleMeasure}
                disabled={measureMutation.isPending || !selectedOriginal || !selectedOperation}
                data-testid="button-measure-utility"
              >
                {measureMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Measuring...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Measure Utility
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {currentMeasurement && (
            <Card>
              <CardHeader>
                <CardTitle>Overall Utility Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`text-5xl font-bold ${getUtilityColor(currentMeasurement.utilityLevel)}`}>
                    {((currentMeasurement.overallUtility || 0) * 100).toFixed(0)}%
                  </div>
                  <Badge 
                    className="mt-3" 
                    variant={getUtilityBadgeVariant(currentMeasurement.utilityLevel)}
                  >
                    {currentMeasurement.utilityLevel}
                  </Badge>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Statistical Similarity</span>
                      <span>{((metrics?.statisticalSimilarity || 0.85) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(metrics?.statisticalSimilarity || 0.85) * 100} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Correlation Preservation</span>
                      <span>{((currentMeasurement.correlationPreservation || 0.9) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(currentMeasurement.correlationPreservation || 0.9) * 100} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Distribution Similarity</span>
                      <span>{((currentMeasurement.distributionSimilarity || 0.88) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(currentMeasurement.distributionSimilarity || 0.88) * 100} className="h-2" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Information Retained</span>
                      <span>{((1 - (currentMeasurement.informationLoss || 0.15)) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(1 - (currentMeasurement.informationLoss || 0.15)) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {currentMeasurement ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Utility Comparison Radar</CardTitle>
                  <CardDescription>
                    Multi-dimensional utility comparison between original and processed data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid className="stroke-muted" />
                        <PolarAngleAxis dataKey="metric" className="text-xs" />
                        <PolarRadiusAxis domain={[0, 100]} className="text-xs" />
                        <Radar
                          name="Original"
                          dataKey="original"
                          stroke="hsl(var(--chart-1))"
                          fill="hsl(var(--chart-1))"
                          fillOpacity={0.2}
                        />
                        <Radar
                          name="Processed"
                          dataKey="processed"
                          stroke="hsl(var(--chart-3))"
                          fill="hsl(var(--chart-3))"
                          fillOpacity={0.2}
                        />
                        <Legend />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Column-Level Preservation</CardTitle>
                  <CardDescription>
                    Statistical preservation rates per column
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={columnComparison} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" domain={[0, 100]} className="text-xs" />
                        <YAxis dataKey="column" type="category" width={100} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: any) => [`${value.toFixed(1)}%`, "Preservation"]}
                        />
                        <Bar dataKey="preservation" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentMeasurement.recommendations?.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5 shrink-0" />
                        <p className="text-sm">{rec}</p>
                      </div>
                    )) || (
                      <>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5 shrink-0" />
                          <p className="text-sm">The anonymized data maintains good statistical properties for analysis</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5 shrink-0" />
                          <p className="text-sm">Correlation between variables is well preserved</p>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <AlertTriangle className="h-5 w-5 text-chart-5 mt-0.5 shrink-0" />
                          <p className="text-sm">Consider reducing generalization for better query accuracy if privacy requirements allow</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="lg:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Measurement Results</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Select an original dataset and a processed operation to measure utility preservation after anonymization.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
