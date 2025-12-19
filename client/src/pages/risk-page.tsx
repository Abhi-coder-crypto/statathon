import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Shield,
  Users,
  Fingerprint,
  BarChart3,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  Target,
  Eye,
  TrendingUp,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Dataset, RiskAssessment } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";

const attackScenarios = [
  { id: "prosecutor", label: "Prosecutor Attack", description: "Attacker knows target is in the dataset" },
  { id: "journalist", label: "Journalist Attack", description: "Attacker randomly selects records" },
  { id: "marketer", label: "Marketer Attack", description: "Attacker targets multiple records" },
];

export default function RiskPage() {
  const { toast } = useToast();
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [quasiIdentifiers, setQuasiIdentifiers] = useState<string[]>([]);
  const [sensitiveAttributes, setSensitiveAttributes] = useState<string[]>([]);
  const [kThreshold, setKThreshold] = useState([5]);
  const [sampleSize, setSampleSize] = useState([100]);
  const [selectedAttacks, setSelectedAttacks] = useState<string[]>(["prosecutor"]);
  const [assessmentsByAttack, setAssessmentsByAttack] = useState<Record<string, RiskAssessment | null>>({});
  const [activeAttackTab, setActiveAttackTab] = useState<string>("prosecutor");

  const { data: datasets, isLoading: datasetsLoading } = useQuery<Dataset[]>({
    queryKey: ["/api/datasets"],
  });

  const { data: assessments, isLoading: assessmentsLoading } = useQuery<RiskAssessment[]>({
    queryKey: ["/api/risk/assessments"],
  });

  const selectedDatasetObj = datasets?.find((d) => d.id.toString() === selectedDataset);

  const assessMutation = useMutation({
    mutationFn: async (params: {
      datasetId: number;
      quasiIdentifiers: string[];
      sensitiveAttributes: string[];
      kThreshold: number;
      sampleSize: number;
      attackScenarios: string[];
    }) => {
      const res = await apiRequest("POST", "/api/risk/assess", params);
      return res.json();
    },
    onSuccess: (data, variables) => {
      const attackType = variables.attackScenarios[0];
      setAssessmentsByAttack(prev => ({
        ...prev,
        [attackType]: data
      }));
      if (!activeAttackTab) {
        setActiveAttackTab(attackType);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/risk/assessments"] });
      toast({
        title: "Assessment complete",
        description: `${attackType} attack risk: ${data.riskLevel}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assessment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRunAssessment = () => {
    if (!selectedDataset || quasiIdentifiers.length === 0) {
      toast({
        title: "Configuration required",
        description: "Please select a dataset and at least one quasi-identifier.",
        variant: "destructive",
      });
      return;
    }

    // Run separate assessment for each selected attack scenario
    selectedAttacks.forEach((attack) => {
      assessMutation.mutate({
        datasetId: parseInt(selectedDataset),
        quasiIdentifiers,
        sensitiveAttributes,
        kThreshold: kThreshold[0],
        sampleSize: sampleSize[0],
        attackScenarios: [attack],
      });
    });
  };

  const getAttackIcon = (attackId: string) => {
    switch(attackId) {
      case "prosecutor": return <Target className="h-4 w-4" />;
      case "journalist": return <Eye className="h-4 w-4" />;
      case "marketer": return <Users className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAttackDescription = (attackId: string) => {
    switch(attackId) {
      case "prosecutor":
        return "Attacker knows target is in dataset. High confidence attack with specific record knowledge.";
      case "journalist":
        return "Attacker randomly selects records. Medium confidence attack with limited knowledge.";
      case "marketer":
        return "Attacker targets multiple records. Bulk analysis to extract patterns.";
      default: return "";
    }
  };

  const getAttackDetails = (assessment: RiskAssessment | null) => {
    if (!assessment) return null;
    
    const reIdRisk = ((assessment.overallRisk || 0) * 100).toFixed(1);
    // Protection effectiveness = inverse of risk (100% - Re-ID Risk)
    const successRate = (100 - parseFloat(reIdRisk)).toFixed(1);
    
    return {
      reIdRisk,
      successRate,
      uniqueRecords: assessment.uniqueRecords || 0,
      violations: assessment.violations || 0,
      riskLevel: assessment.riskLevel || "Unknown",
    };
  };

  const currentAssessment = assessmentsByAttack[activeAttackTab] || null;

  const toggleColumn = (column: string, type: "quasi" | "sensitive") => {
    if (type === "quasi") {
      setQuasiIdentifiers((prev) =>
        prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
      );
    } else {
      setSensitiveAttributes((prev) =>
        prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
      );
    }
  };

  const toggleAttack = (attackId: string) => {
    setSelectedAttacks((prev) =>
      prev.includes(attackId) ? prev.filter((a) => a !== attackId) : [...prev, attackId]
    );
  };

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "low":
        return "text-chart-4";
      case "medium":
        return "text-chart-5";
      case "high":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  const getRiskBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level?.toLowerCase()) {
      case "low":
        return "secondary";
      case "medium":
        return "outline";
      case "high":
        return "destructive";
      default:
        return "outline";
    }
  };

  const equivalenceClassData = currentAssessment?.equivalenceClasses as any;
  const chartData = equivalenceClassData?.histogram || [];
  
  // Get attack-specific risks
  const getAttackSpecificRisks = (attack: string) => {
    const eqData = currentAssessment?.equivalenceClasses as any;
    if (attack === "prosecutor" && eqData?.prosecutorRisk !== undefined) {
      return { risk: eqData.prosecutorRisk, label: "Prosecutor" };
    } else if (attack === "journalist" && eqData?.journalistRisk !== undefined) {
      return { risk: eqData.journalistRisk, label: "Journalist" };
    } else if (attack === "marketer" && eqData?.marketerRisk !== undefined) {
      return { risk: eqData.marketerRisk, label: "Marketer" };
    }
    return { risk: currentAssessment?.overallRisk || 0, label: attack };
  };

  return (
    <DashboardLayout title="Risk Assessment" breadcrumbs={[{ label: "Risk Assessment" }]}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>
                Configure risk assessment parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Select Dataset</Label>
                <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                  <SelectTrigger data-testid="select-dataset">
                    <SelectValue placeholder="Choose a dataset" />
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

              {selectedDatasetObj && (
                <>
                  <div className="space-y-3">
                    <Label>Quasi-Identifiers</Label>
                    <ScrollArea className="h-[120px] rounded-md border p-3">
                      <div className="space-y-2">
                        {selectedDatasetObj.columns?.map((col) => (
                          <div key={col} className="flex items-center gap-2">
                            <Checkbox
                              id={`qi-${col}`}
                              checked={quasiIdentifiers.includes(col)}
                              onCheckedChange={() => toggleColumn(col, "quasi")}
                            />
                            <label htmlFor={`qi-${col}`} className="text-sm cursor-pointer">
                              {col}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="space-y-3">
                    <Label>Sensitive Attributes</Label>
                    <ScrollArea className="h-[120px] rounded-md border p-3">
                      <div className="space-y-2">
                        {selectedDatasetObj.columns?.map((col) => (
                          <div key={col} className="flex items-center gap-2">
                            <Checkbox
                              id={`sa-${col}`}
                              checked={sensitiveAttributes.includes(col)}
                              onCheckedChange={() => toggleColumn(col, "sensitive")}
                            />
                            <label htmlFor={`sa-${col}`} className="text-sm cursor-pointer">
                              {col}
                            </label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>K-Anonymity Threshold</Label>
                  <Badge variant="outline">{kThreshold[0]}</Badge>
                </div>
                <Slider
                  value={kThreshold}
                  onValueChange={setKThreshold}
                  min={2}
                  max={20}
                  step={1}
                  data-testid="slider-k-threshold"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Sample Size</Label>
                  <Badge variant="outline">{sampleSize[0]}%</Badge>
                </div>
                <Slider
                  value={sampleSize}
                  onValueChange={setSampleSize}
                  min={10}
                  max={100}
                  step={10}
                  data-testid="slider-sample-size"
                />
              </div>

              <div className="space-y-3">
                <Label>Attack Scenarios</Label>
                <div className="space-y-2">
                  {attackScenarios.map((attack) => (
                    <div key={attack.id} className="flex items-start gap-2">
                      <Checkbox
                        id={attack.id}
                        checked={selectedAttacks.includes(attack.id)}
                        onCheckedChange={() => toggleAttack(attack.id)}
                      />
                      <div className="grid gap-0.5">
                        <label htmlFor={attack.id} className="text-sm font-medium cursor-pointer">
                          {attack.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{attack.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleRunAssessment}
                disabled={assessMutation.isPending || !selectedDataset || quasiIdentifiers.length === 0}
                data-testid="button-run-assessment"
              >
                {assessMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Assessment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {Object.keys(assessmentsByAttack).length > 0 && selectedAttacks.length > 0 ? (
            <>
              <Tabs value={activeAttackTab} onValueChange={setActiveAttackTab} className="w-full">
                <TabsList className="grid w-full gap-2" style={{ gridTemplateColumns: `repeat(${selectedAttacks.length}, 1fr)` }}>
                  {selectedAttacks.map((attack) => {
                    const assessment = assessmentsByAttack[attack];
                    return (
                      <TabsTrigger key={attack} value={attack} className="gap-2 flex items-center">
                        {getAttackIcon(attack)}
                        <span className="capitalize">{attack.replace("-", " ")}</span>
                        {assessment && (
                          <Badge 
                            className="ml-1"
                            variant={getRiskBadgeVariant(assessment.riskLevel)}
                          >
                            {assessment.riskLevel}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {selectedAttacks.map((attack) => {
                  const assessment = assessmentsByAttack[attack];
                  const details = assessment ? getAttackDetails(assessment) : null;
                  const attackSpecificRisks = assessment ? getAttackSpecificRisks(attack) : null;

                  return (
                    <TabsContent key={attack} value={attack} className="space-y-6">
                      {/* Attack Description Card */}
                      <Card className="bg-muted/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            {getAttackIcon(attack)}
                            <div className="flex-1">
                              <CardTitle className="capitalize">{attack.replace("-", " ")} Attack Analysis</CardTitle>
                              <CardDescription className="mt-2">
                                {getAttackDescription(attack)}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>

                      {assessment && details ? (
                        <>
                          {/* Key Metrics */}
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                                <CardTitle className="text-sm font-medium">Re-ID Risk</CardTitle>
                                <TrendingUp className="h-5 w-5 text-destructive" />
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold text-destructive">
                                  {details.reIdRisk}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Likelihood of attack success
                                </p>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                                <Shield className="h-5 w-5 text-chart-4" />
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold text-chart-4">
                                  {details.successRate}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Protection effectiveness
                                </p>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                                <CardTitle className="text-sm font-medium">Violations</CardTitle>
                                <XCircle className="h-5 w-5 text-destructive" />
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold text-destructive">
                                  {details.violations}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Records below k-threshold
                                </p>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                                <CardTitle className="text-sm font-medium">Unique Records</CardTitle>
                                <Fingerprint className="h-5 w-5 text-chart-5" />
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold text-chart-5">
                                  {details.uniqueRecords}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Highest risk individuals
                                </p>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Graphs for Attack */}
                          <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                              <CardHeader>
                                <CardTitle>Equivalence Class Distribution</CardTitle>
                                <CardDescription>Size of record groups for this attack</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="h-[250px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={equivalenceClassData?.histogram || chartData}>
                                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                      <XAxis dataKey="size" className="text-xs" />
                                      <YAxis className="text-xs" />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: "hsl(var(--card))",
                                          border: "1px solid hsl(var(--border))",
                                          borderRadius: "8px",
                                        }}
                                      />
                                      <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle>Risk-Protection Trade-off</CardTitle>
                                <CardDescription>Risk vs Protection balance</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="h-[250px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={[
                                          { name: "At Risk", value: parseFloat(details.reIdRisk) },
                                          { name: "Protected", value: parseFloat(details.successRate) },
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                      >
                                        <Cell fill="hsl(var(--destructive))" />
                                        <Cell fill="hsl(var(--chart-4))" />
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: "hsl(var(--card))",
                                          border: "1px solid hsl(var(--border))",
                                          borderRadius: "8px",
                                        }}
                                      />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-destructive" />
                                    <span className="text-xs text-muted-foreground">At Risk: {details.reIdRisk}%</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-chart-4" />
                                    <span className="text-xs text-muted-foreground">Protected: {details.successRate}%</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Recommendations */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                Attack-Specific Recommendations
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {assessment.recommendations && assessment.recommendations.length > 0 ? (
                                  assessment.recommendations.map((rec, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                      <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5 shrink-0" />
                                      <p className="text-sm">{rec}</p>
                                    </div>
                                  ))
                                ) : (
                                  <>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                      <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5 shrink-0" />
                                      <p className="text-sm">Increase k-anonymity threshold to reduce identifiable records</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                      <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5 shrink-0" />
                                      <p className="text-sm">Apply generalization to quasi-identifiers with high cardinality</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                                      <CheckCircle className="h-5 w-5 text-chart-4 mt-0.5 shrink-0" />
                                      <p className="text-sm">Consider suppressing records that cannot meet the threshold</p>
                                    </div>
                                  </>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <Card>
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">Analyzing attack scenario...</p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </>
          ) : (
            <Card className="lg:col-span-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Assessment Results</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Configure parameters, select attack scenarios, and click "Run Assessment" to see separate risk analysis for each attack type.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
