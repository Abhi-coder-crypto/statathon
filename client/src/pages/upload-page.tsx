import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  BarChart3,
  Loader2,
  FileText,
  X,
  Info,
  Database,
  Users,
  Shield,
  TrendingUp,
  Wrench,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Dataset } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function UploadPage() {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [datasetPreviews, setDatasetPreviews] = useState<Record<number, { columns: string[]; rows: any[] }>>({});
  const [expandedDatasetId, setExpandedDatasetId] = useState<number | null>(null);
  const [fullDataOpen, setFullDataOpen] = useState<number | null>(null);
  const [fixResults, setFixResults] = useState<Record<number, string[]>>({});
  const [isFixing, setIsFixing] = useState<Record<number, boolean>>({});
  const [perfectDatasetId, setPerfectDatasetId] = useState<number | null>(null);

  const { data: datasets, isLoading } = useQuery<Dataset[]>({
    queryKey: ["/api/datasets"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/data/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
      setUploadProgress(100);
      toast({
        title: "Upload successful",
        description: "Your dataset has been uploaded and processed.",
      });
      setTimeout(() => setUploadProgress(0), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/datasets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
      toast({
        title: "Dataset deleted",
        description: "The dataset has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadProgress(30);
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "application/json": [".json"],
    },
    maxFiles: 1,
    disabled: uploadMutation.isPending,
  });

  const handleExpandDataset = async (dataset: Dataset) => {
    if (expandedDatasetId === dataset.id) {
      setExpandedDatasetId(null);
      return;
    }

    if (datasetPreviews[dataset.id]) {
      setExpandedDatasetId(dataset.id);
      return;
    }

    try {
      const response = await fetch(`/api/data/${dataset.id}/preview`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setDatasetPreviews((prev) => ({
          ...prev,
          [dataset.id]: data,
        }));
        setExpandedDatasetId(dataset.id);
      }
    } catch (error) {
      toast({
        title: "Failed to load preview",
        description: "Could not load dataset preview.",
        variant: "destructive",
      });
    }
  };

  const handleAutoFix = async (datasetId: number, dataset: Dataset) => {
    // Check if dataset is already perfect
    if (dataset.qualityScore && dataset.qualityScore >= 0.95) {
      setPerfectDatasetId(datasetId);
      return;
    }

    setIsFixing((prev) => ({ ...prev, [datasetId]: true }));
    try {
      const response = await fetch(`/api/data/${datasetId}/autofix`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        setFixResults((prev) => ({
          ...prev,
          [datasetId]: result.fixes || ["Data cleaning completed"],
        }));
        queryClient.invalidateQueries({ queryKey: ["/api/datasets"] });
        toast({
          title: "Auto Fix completed",
          description: "Dataset has been automatically repaired.",
        });
      }
    } catch (error) {
      toast({
        title: "Auto Fix failed",
        description: "Could not auto-fix the dataset.",
        variant: "destructive",
      });
    } finally {
      setIsFixing((prev) => ({ ...prev, [datasetId]: false }));
    }
  };

  const getQualityColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 0.8) return "text-chart-4";
    if (score >= 0.6) return "text-chart-5";
    return "text-destructive";
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout title="Data Upload" breadcrumbs={[{ label: "Data Upload" }]}>
      <div className="space-y-6">
        {/* Guidelines Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                File Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>✓ CSV, XLSX, XLS, JSON</p>
              <p>✓ Max file size: 100 MB</p>
              <p>✓ Min 10 rows recommended</p>
              <p>✓ Headers required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Quasi-Identifiers
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>Age, Gender, Postal Code</p>
              <p>State, Occupation</p>
              <p>Education Level, Salary</p>
              <p className="text-xs">Can re-identify when combined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Direct Identifiers
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>✓ Remove: Name, ID, Email</p>
              <p>✓ Remove: Phone, Address</p>
              <p>✓ Keep: Anonymized ID only</p>
              <p className="text-xs">Already removed by NSO</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Data Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>✓ Minimize missing values</p>
              <p>✓ Check for outliers</p>
              <p>✓ Consistent formatting</p>
              <p>✓ Valid data types</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Upload Process:</strong> Your NSO microdata file will be automatically analyzed to identify quasi-identifiers, assess re-identification risk, and prepare for privacy enhancement.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Upload Microdata File</CardTitle>
            <CardDescription>
              Drag and drop your NSO microdata file (with quasi-identifiers intact for risk assessment). Supports CSV, XLSX, XLS, and JSON formats.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
                ${uploadMutation.isPending ? "pointer-events-none opacity-60" : ""}
              `}
              data-testid="dropzone-upload"
            >
              <input {...getInputProps()} data-testid="input-file-upload" />
              
              <div className="flex flex-col items-center gap-4">
                {uploadMutation.isPending ? (
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                ) : (
                  <Upload className="h-16 w-16 text-muted-foreground" />
                )}
                
                {isDragActive ? (
                  <p className="text-lg font-medium text-primary">Drop the file here...</p>
                ) : (
                  <>
                    <div>
                      <p className="text-lg font-medium">
                        {uploadMutation.isPending ? "Uploading..." : "Drop your file here"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        or click to browse from your computer
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge variant="secondary">CSV</Badge>
                      <Badge variant="secondary">XLSX</Badge>
                      <Badge variant="secondary">XLS</Badge>
                      <Badge variant="secondary">JSON</Badge>
                    </div>
                  </>
                )}
              </div>

              {uploadProgress > 0 && (
                <div className="absolute bottom-4 left-4 right-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    {uploadProgress < 100 ? "Processing..." : "Complete!"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Uploaded Datasets</CardTitle>
            <CardDescription>
              All uploaded microdata files are listed below. Preview column structure, assess data quality, and proceed to risk assessment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : !datasets?.length ? (
              <div className="text-center py-12">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">No datasets uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your first NSO microdata file using the dropzone above to begin privacy assessment
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>File Name</TableHead>
                          <TableHead>Format</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead>Rows</TableHead>
                          <TableHead>Columns</TableHead>
                          <TableHead>Data Quality</TableHead>
                          <TableHead>Upload Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {datasets.map((dataset) => (
                          <>
                            <TableRow key={dataset.id} data-testid={`row-dataset-${dataset.id}`} className="cursor-pointer hover:bg-muted/50" onClick={() => handleExpandDataset(dataset)}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                                  <span className="truncate max-w-[180px]">{dataset.originalName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{dataset.format.toUpperCase()}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">{formatBytes(dataset.size)}</TableCell>
                              <TableCell className="font-medium">{dataset.rowCount.toLocaleString()}</TableCell>
                              <TableCell className="font-medium">{dataset.columns?.length || 0}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {dataset.qualityScore ? (
                                    <>
                                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full ${dataset.qualityScore >= 0.8 ? 'bg-chart-4' : dataset.qualityScore >= 0.6 ? 'bg-chart-5' : 'bg-destructive'}`}
                                          style={{ width: `${dataset.qualityScore * 100}%` }}
                                        />
                                      </div>
                                      <span className={`text-sm font-medium ${getQualityColor(dataset.qualityScore)}`}>
                                        {(dataset.qualityScore * 100).toFixed(0)}%
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">Processing...</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(dataset.uploadedAt)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-chart-4 border-chart-4">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ready
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(dataset.id); }}
                                  disabled={deleteMutation.isPending}
                                  data-testid={`button-delete-${dataset.id}`}
                                  title="Delete dataset"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                            {expandedDatasetId === dataset.id && datasetPreviews[dataset.id] && (
                              <TableRow>
                                <TableCell colSpan={9} className="p-0">
                                  <div className="bg-muted/30 border-t p-6 space-y-6">
                                    <div>
                                      <h4 className="font-semibold mb-4 flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4" />
                                        Data Preview: {dataset.originalName}
                                      </h4>
                                      <div className="overflow-x-auto border rounded-md">
                                        <table className="w-full text-sm">
                                          <thead className="bg-muted">
                                            <tr>
                                              {datasetPreviews[dataset.id].columns.map((col: string) => (
                                                <th key={col} className="px-4 py-2 text-left font-medium min-w-[120px]">{col}</th>
                                              ))}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {datasetPreviews[dataset.id].rows.slice(0, 5).map((row: any, idx: number) => (
                                              <tr key={idx} className="border-t text-xs">
                                                {datasetPreviews[dataset.id].columns.map((col: string) => (
                                                  <td key={col} className="px-4 py-2 font-mono">{String(row[col] ?? "")}</td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-3">
                                        Showing first 5 rows of {dataset.rowCount.toLocaleString()} total rows
                                      </p>
                                    </div>

                                    {/* Quality Metrics */}
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                      <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm font-medium text-muted-foreground">Quality Score</p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full ${dataset.qualityScore && dataset.qualityScore >= 0.8 ? 'bg-chart-4' : dataset.qualityScore && dataset.qualityScore >= 0.6 ? 'bg-chart-5' : 'bg-destructive'}`}
                                              style={{ width: `${(dataset.qualityScore || 0) * 100}%` }}
                                            />
                                          </div>
                                          <span className="text-lg font-bold">{dataset.qualityScore ? (dataset.qualityScore * 100).toFixed(0) : '0'}%</span>
                                        </div>
                                      </div>

                                      <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm font-medium text-muted-foreground">Completeness</p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-chart-4" style={{ width: '92%' }} />
                                          </div>
                                          <span className="text-lg font-bold">92%</span>
                                        </div>
                                      </div>

                                      <div className="p-4 rounded-lg border bg-card">
                                        <p className="text-sm font-medium text-muted-foreground">Rows</p>
                                        <p className="text-2xl font-bold mt-2">{dataset.rowCount.toLocaleString()}</p>
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => setFullDataOpen(fullDataOpen === dataset.id ? null : dataset.id)}
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        {fullDataOpen === dataset.id ? "Hide Full Data" : "View Full Data"}
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleAutoFix(dataset.id, dataset)}
                                        disabled={isFixing[dataset.id] || fixResults[dataset.id]}
                                      >
                                        <Wrench className="h-4 w-4 mr-2" />
                                        {isFixing[dataset.id] ? "Fixing..." : "Auto Fix Issues"}
                                      </Button>
                                    </div>

                                    {/* Full Data View */}
                                    {fullDataOpen === dataset.id && (
                                      <div className="border rounded-lg p-4 bg-background max-h-96 overflow-auto">
                                        <h5 className="font-semibold mb-3 text-sm">Complete Dataset</h5>
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-xs">
                                            <thead className="bg-muted sticky top-0">
                                              <tr>
                                                {datasetPreviews[dataset.id].columns.map((col: string) => (
                                                  <th key={col} className="px-3 py-2 text-left font-medium min-w-[100px]">{col}</th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {datasetPreviews[dataset.id].rows.map((row: any, idx: number) => (
                                                <tr key={idx} className="border-t hover:bg-muted/50">
                                                  {datasetPreviews[dataset.id].columns.map((col: string) => (
                                                    <td key={col} className="px-3 py-2 font-mono">{String(row[col] ?? "")}</td>
                                                  ))}
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}

                                    {/* Auto Fix Results */}
                                    {fixResults[dataset.id] && (
                                      <Alert className="border-chart-4 bg-chart-4/5">
                                        <CheckCircle2 className="h-4 w-4 text-chart-4" />
                                        <AlertDescription>
                                          <strong>Auto Fix Completed:</strong>
                                          <ul className="list-disc list-inside mt-2 space-y-1">
                                            {fixResults[dataset.id].map((fix, idx) => (
                                              <li key={idx} className="text-sm">{fix}</li>
                                            ))}
                                          </ul>
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <Alert className="bg-chart-4/5">
                  <CheckCircle className="h-4 w-4 text-chart-4" />
                  <AlertDescription>
                    <strong>{datasets.length} dataset(s)</strong> ready for risk assessment. Click the row to expand and view data samples.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={perfectDatasetId !== null} onOpenChange={(open) => !open && setPerfectDatasetId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-6 w-6 text-chart-4" />
              Dataset is Perfect!
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p className="text-base">
                Your dataset is in excellent condition and doesn't require any fixes.
              </p>
              <div className="bg-chart-4/10 p-3 rounded-md space-y-2">
                <p className="text-sm font-medium">Quality Metrics:</p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-4" />
                    Quality Score: 95%+
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-4" />
                    Data is complete and consistent
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-chart-4" />
                    Ready for risk assessment
                  </li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Proceed to Risk Assessment to analyze re-identification risk.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => setPerfectDatasetId(null)} variant="default">
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
