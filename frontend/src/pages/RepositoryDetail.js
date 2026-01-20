import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, GitBranch, FileCode, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { api } from '../services/api';
import { toast } from 'sonner';

const RepositoryDetail = () => {
  const { id } = useParams();
  const [repo, setRepo] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = useCallback(async () => {
    try {
      const [repoData, vulnData, prData, patternData] = await Promise.all([
        api.getRepository(id),
        api.getVulnerabilities({ repository_id: id }),
        api.getPullRequests(id),
        api.getAIPatterns(id)
      ]);
      setRepo(repoData);
      setVulnerabilities(vulnData);
      setPullRequests(prData);
      setPatterns(patternData);
    } catch (error) {
      toast.error('Failed to load repository details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleStartScan = async () => {
    try {
      setScanning(true);
      setScanProgress(10);
      const scanResult = await api.startScan(id);
      toast.success('Scan started!');

      // Poll for scan status
      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getScanStatus(scanResult.scan_id);
          setScanProgress(status.progress);

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            setScanning(false);
            toast.success('Scan completed!');
            fetchData();
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setScanning(false);
            toast.error('Scan failed');
          }
        } catch (error) {
          clearInterval(pollInterval);
          setScanning(false);
          toast.error('Failed to get scan status');
        }
      }, 2000);
    } catch (error) {
      setScanning(false);
      toast.error('Failed to start scan');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
      info: 'outline'
    };
    return colors[severity] || 'default';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="repository-detail">
        {/* Header */}
        <div>
          <Link to="/repositories" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Repositories
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{repo?.name}</h1>
              <p className="text-muted-foreground text-lg">{repo?.full_name}</p>
            </div>
            <Button
              onClick={handleStartScan}
              disabled={scanning}
              className="bg-primary hover:bg-primary/90"
              data-testid="start-scan-button"
            >
              <Play className="w-4 h-4 mr-2" />
              {scanning ? 'Scanning...' : 'Start Scan'}
            </Button>
          </div>
        </div>

        {/* Scan Progress */}
        {scanning && (
          <Card className="glass-card border-primary/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Scanning in progress...</span>
                  <span className="text-muted-foreground">{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card data-testid="risk-score-stat">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">Risk Score</div>
              <div className="text-3xl font-bold">{repo?.risk_score || 'N/A'}</div>
            </CardContent>
          </Card>
          <Card data-testid="vulnerabilities-stat">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">Vulnerabilities</div>
              <div className="text-3xl font-bold text-destructive">{vulnerabilities.length}</div>
            </CardContent>
          </Card>
          <Card data-testid="patterns-stat">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">AI Patterns</div>
              <div className="text-3xl font-bold text-primary">{patterns.length}</div>
            </CardContent>
          </Card>
          <Card data-testid="prs-stat">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">Pull Requests</div>
              <div className="text-3xl font-bold text-accent">{pullRequests.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="vulnerabilities" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 gap-4">
            <TabsTrigger value="vulnerabilities" data-testid="tab-vulnerabilities">
              Vulnerabilities
            </TabsTrigger>
            <TabsTrigger value="pull-requests" data-testid="tab-prs">
              Pull Requests
            </TabsTrigger>
            <TabsTrigger value="ai-patterns" data-testid="tab-patterns">
              AI Patterns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vulnerabilities" className="space-y-4">
            {vulnerabilities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No vulnerabilities found</p>
                </CardContent>
              </Card>
            ) : (
              vulnerabilities.map((vuln, index) => (
                <motion.div
                  key={vuln.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:border-primary/30 transition-all" data-testid={`vuln-${index}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{vuln.title}</CardTitle>
                          <CardDescription>{vuln.file_path}:{vuln.line_number}</CardDescription>
                        </div>
                        <Badge variant={getSeverityColor(vuln.severity)}>
                          {vuln.severity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{vuln.description}</p>
                      {vuln.code_snippet && (
                        <pre className="bg-black/50 p-4 rounded-md text-xs font-mono overflow-x-auto mb-4">
                          <code>{vuln.code_snippet}</code>
                        </pre>
                      )}
                      {vuln.ai_reasoning && (
                        <div className="bg-primary/10 border border-primary/20 p-3 rounded-md">
                          <p className="text-sm">
                            <span className="font-semibold text-primary">AI Analysis: </span>
                            {vuln.ai_reasoning}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Confidence: {(vuln.ai_confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="pull-requests">
            {pullRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No pull requests yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pullRequests.map((pr) => (
                  <Card key={pr.id}>
                    <CardHeader>
                      <CardTitle>{pr.title}</CardTitle>
                      <CardDescription>{pr.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Badge>{pr.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ai-patterns">
            {patterns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No AI patterns discovered yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Run a scan to discover patterns</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {patterns.map((pattern) => (
                  <Card key={pattern.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{pattern.pattern_name}</CardTitle>
                        <Badge variant="outline">{pattern.pattern_type}</Badge>
                      </div>
                      <CardDescription>{pattern.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {(pattern.confidence * 100).toFixed(0)}%
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RepositoryDetail;
