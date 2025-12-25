import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Lock,
  Database,
  Shuffle,
  Sparkles,
  Play,
  Loader2,
  CheckCircle,
  Download,
  Info,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Dataset, PrivacyOperation } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

const techniques = [
  {
    id: "k-anonymity",
    name: "K-Anonymity",
    icon: Shield,
    description: "Ensure each record is indistinguishable from k-1 others",
  },
  {
    id: "l-diversity",
    name: "L-Diversity",
    icon: Database,
    description: "Ensure sensitive attribute diversity within groups",
  },
  {
    id: "t-closeness",
    name: "T-Closeness",
    icon: Lock,
    description: "Limit sensitive attribute distribution divergence",
  },
  {
    id: "differential-privacy",
    name: "Differential Privacy",
    icon: Shuffle,
    description: "Add calibrated noise to protect individual records",
  },
  {
    id: "synthetic-data",
    name: "Synthetic Data",
    icon: Sparkles,
    description: "Generate synthetic records with similar statistics",
  },
];

export default function PrivacyPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [selectedTechnique, setSelectedTechnique] = useState("k-anonymity");
  const [quasiIdentifiers, setQuasiIdentifiers] = useState<string[]>([]);
  const [sensitiveAttribute, setSensitiveAttribute] = useState<string>("");
  
  const [kValue, setKValue] = useState([5]);
  const [suppressionLimit, setSuppressionLimit] = useState([10]);
  const [kMethod, setKMethod] = useState("global-recoding");
  
  const [lValue, setLValue] = useState([3]);
  const [lMethod, setLMethod] = useState("distinct");
  
  const [tValue, setTValue] = useState([0.5]);
  
  const [epsilon, setEpsilon] = useState([2.0]);
  const [dpMechanism, setDpMechanism] = useState("laplace");
  
  const [syntheticSize, setSyntheticSize] = useState([100]);
  const [syntheticMethod, setSyntheticMethod] = useState("statistical");
  
  const [currentOperation, setCurrentOperation] = useState<PrivacyOperation | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  const { data: datasets } = useQuery<Dataset[]>({
    queryKey: ["/api/datasets"],
  });

  const { data: operations } = useQuery<PrivacyOperation[]>({
    queryKey: ["/api/privacy/operations"],
  });

  const selectedDatasetObj = datasets?.find((d) => d.id.toString() === selectedDataset);

  const applyMutation = useMutation({
    mutationFn: async (params: any) => {
      setProcessingProgress(20);
      const res = await apiRequest("POST", `/api/privacy/${selectedTechnique}`, params);
      setProcessingProgress(80);
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentOperation(data);
      setProcessingProgress(100);
      queryClient.invalidateQueries({ queryKey: ["/api/privacy/operations"] });
      toast({
        title: "Privacy enhancement complete",
        description: `${techniques.find(t => t.id === selectedTechnique)?.name} applied successfully.`,
      });
      setTimeout(() => {
        setProcessingProgress(0);
        // Navigate to results page with data
        navigate("/privacy-results", {
          state: {
            result: {
              technique: data.technique,
              recordsSuppressed: data.recordsSuppressed || 0,
              totalRecords: selectedDatasetObj?.rowCount || 0,
              informationLoss: data.informationLoss || 0,
              equivalenceClasses: (data.parameters as any)?.equivalenceClasses,
              avgGroupSize: (data.parameters as any)?.avgGroupSize,
              privacyRisk: (data.parameters as any)?.privacyRisk,
              diverseClasses: (data.parameters as any)?.diverseClasses,
              violatingClasses: (data.parameters as any)?.violatingClasses,
              avgDiversity: (data.parameters as any)?.avgDiversity,
              satisfyingClasses: (data.parameters as any)?.satisfyingClasses,
              avgDistance: (data.parameters as any)?.avgDistance,
              maxDistance: (data.parameters as any)?.maxDistance,
            }
          }
        });
      }, 1000);
    },
    onError: (error: Error) => {
      setProcessingProgress(0);
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApply = () => {
    if (!selectedDataset || quasiIdentifiers.length === 0) {
      toast({
        title: "Configuration required",
        description: "Please select a dataset and configure quasi-identifiers.",
        variant: "destructive",
      });
      return;
    }

    let params: any = {
      datasetId: parseInt(selectedDataset),
      quasiIdentifiers,
    };

    switch (selectedTechnique) {
      case "k-anonymity":
        params = { ...params, kValue: kValue[0], suppressionLimit: suppressionLimit[0] / 100, method: kMethod };
        break;
      case "l-diversity":
        params = { ...params, lValue: lValue[0], sensitiveAttribute, method: lMethod };
        break;
      case "t-closeness":
        params = { ...params, tValue: tValue[0], sensitiveAttribute };
        break;
      case "differential-privacy":
        params = { ...params, epsilon: epsilon[0], mechanism: dpMechanism };
        break;
      case "synthetic-data":
        params = { ...params, sampleSize: syntheticSize[0], method: syntheticMethod };
        break;
    }

    applyMutation.mutate(params);
  };

  const toggleColumn = (column: string) => {
    setQuasiIdentifiers((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
    );
  };

  const handleDownload = async () => {
    if (!currentOperation) return;
    
    try {
      const response = await fetch(`/api/privacy/${currentOperation.id}/download`, {
        credentials: "include",
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `anonymized_data_${currentOperation.id}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the processed data.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout title="Privacy Enhancement" breadcrumbs={[{ label: "Privacy Enhancement" }]}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Technique</CardTitle>
              <CardDescription>Choose an anonymization method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {techniques.map((tech) => (
                <div
                  key={tech.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                    ${selectedTechnique === tech.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"}
                  `}
                  onClick={() => setSelectedTechnique(tech.id)}
                  data-testid={`technique-${tech.id}`}
                >
                  <div className={`p-2 rounded-md ${selectedTechnique === tech.id ? "bg-primary/20" : "bg-muted"}`}>
                    <tech.icon className={`h-5 w-5 ${selectedTechnique === tech.id ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{tech.name}</p>
                    <p className="text-xs text-muted-foreground">{tech.description}</p>
                  </div>
                  {selectedTechnique === tech.id && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dataset & Columns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Dataset</Label>
                <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                  <SelectTrigger data-testid="select-dataset-privacy">
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
                <div className="space-y-3">
                  <Label>Quasi-Identifiers</Label>
                  <ScrollArea className="h-[150px] rounded-md border p-3">
                    <div className="space-y-2">
                      {selectedDatasetObj.columns?.map((col) => (
                        <div key={col} className="flex items-center gap-2">
                          <Checkbox
                            id={`privacy-qi-${col}`}
                            checked={quasiIdentifiers.includes(col)}
                            onCheckedChange={() => toggleColumn(col)}
                          />
                          <label htmlFor={`privacy-qi-${col}`} className="text-sm cursor-pointer">
                            {col}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {techniques.find(t => t.id === selectedTechnique)?.icon && 
                  (() => {
                    const Icon = techniques.find(t => t.id === selectedTechnique)!.icon;
                    return <Icon className="h-5 w-5" />;
                  })()
                }
                {techniques.find(t => t.id === selectedTechnique)?.name} Parameters
              </CardTitle>
              <CardDescription>
                Configure the parameters for {techniques.find(t => t.id === selectedTechnique)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedTechnique === "k-anonymity" && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>K Value</Label>
                      <Badge variant="outline">{kValue[0]}</Badge>
                    </div>
                    <Slider
                      value={kValue}
                      onValueChange={setKValue}
                      min={2}
                      max={20}
                      step={1}
                      data-testid="slider-k-value"
                    />
                    <p className="text-xs text-muted-foreground">
                      Each record will be indistinguishable from at least {kValue[0] - 1} other records
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Suppression Limit</Label>
                      <Badge variant="outline">{suppressionLimit[0]}%</Badge>
                    </div>
                    <Slider
                      value={suppressionLimit}
                      onValueChange={setSuppressionLimit}
                      min={0}
                      max={20}
                      step={1}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Method</Label>
                    <RadioGroup value={kMethod} onValueChange={setKMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="global-recoding" id="global" />
                        <Label htmlFor="global" className="font-normal">Global Recoding</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="local-recoding" id="local" />
                        <Label htmlFor="local" className="font-normal">Local Recoding</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="clustering" id="clustering" />
                        <Label htmlFor="clustering" className="font-normal">Clustering-based</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              {selectedTechnique === "l-diversity" && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>L Value</Label>
                      <Badge variant="outline">{lValue[0]}</Badge>
                    </div>
                    <Slider
                      value={lValue}
                      onValueChange={setLValue}
                      min={2}
                      max={10}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Each equivalence class will have at least {lValue[0]} distinct sensitive values
                    </p>
                  </div>

                  {selectedDatasetObj && (
                    <div className="space-y-2">
                      <Label>Sensitive Attribute</Label>
                      <Select value={sensitiveAttribute} onValueChange={setSensitiveAttribute}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select attribute" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedDatasetObj.columns?.map((col) => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Method</Label>
                    <RadioGroup value={lMethod} onValueChange={setLMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="distinct" id="distinct" />
                        <Label htmlFor="distinct" className="font-normal">Distinct L-Diversity</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="entropy" id="entropy" />
                        <Label htmlFor="entropy" className="font-normal">Entropy L-Diversity</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="recursive" id="recursive" />
                        <Label htmlFor="recursive" className="font-normal">Recursive (c,l)-Diversity</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              {selectedTechnique === "t-closeness" && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>T Value (Threshold)</Label>
                      <Badge variant="outline">{tValue[0].toFixed(2)}</Badge>
                    </div>
                    <Slider
                      value={tValue}
                      onValueChange={setTValue}
                      min={0.1}
                      max={1}
                      step={0.05}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum allowed distance between local and global distribution
                    </p>
                  </div>

                  {selectedDatasetObj && (
                    <div className="space-y-2">
                      <Label>Sensitive Attribute</Label>
                      <Select value={sensitiveAttribute} onValueChange={setSensitiveAttribute}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select attribute" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedDatasetObj.columns?.map((col) => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              {selectedTechnique === "differential-privacy" && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Epsilon (Privacy Budget)</Label>
                      <Badge variant="outline">{epsilon[0].toFixed(1)}</Badge>
                    </div>
                    <Slider
                      value={epsilon}
                      onValueChange={setEpsilon}
                      min={0.1}
                      max={10}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower values = more privacy, higher noise. Range: 0.1 (high privacy) to 10 (low privacy)
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Mechanism</Label>
                    <RadioGroup value={dpMechanism} onValueChange={setDpMechanism}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="laplace" id="laplace" />
                        <Label htmlFor="laplace" className="font-normal">Laplace Mechanism</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gaussian" id="gaussian" />
                        <Label htmlFor="gaussian" className="font-normal">Gaussian Mechanism</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              {selectedTechnique === "synthetic-data" && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Sample Size</Label>
                      <Badge variant="outline">{syntheticSize[0]}%</Badge>
                    </div>
                    <Slider
                      value={syntheticSize}
                      onValueChange={setSyntheticSize}
                      min={50}
                      max={200}
                      step={10}
                    />
                    <p className="text-xs text-muted-foreground">
                      Generate {syntheticSize[0]}% of the original dataset size
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Generation Method</Label>
                    <RadioGroup value={syntheticMethod} onValueChange={setSyntheticMethod}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="statistical" id="statistical" />
                        <Label htmlFor="statistical" className="font-normal">Statistical Sampling</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="copula" id="copula" />
                        <Label htmlFor="copula" className="font-normal">Copula-based</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              {processingProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={processingProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {processingProgress < 100 ? "Processing..." : "Complete!"}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={handleApply}
                  disabled={applyMutation.isPending || !selectedDataset || quasiIdentifiers.length === 0}
                  data-testid="button-apply-privacy"
                >
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Apply {techniques.find(t => t.id === selectedTechnique)?.name}
                    </>
                  )}
                </Button>

                {currentOperation && (
                  <Button variant="outline" onClick={handleDownload} data-testid="button-download-result">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
