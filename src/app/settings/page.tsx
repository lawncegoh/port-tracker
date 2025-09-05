"use client";

import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Save, TestTube, Key, FileText, Settings } from "lucide-react";

export default function SettingsPage() {
  const [flexToken, setFlexToken] = useState('');
  const [flexQueryId, setFlexQueryId] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [lastTestResult, setLastTestResult] = useState<string>('');

  const handleSaveCredentials = async () => {
    if (!flexToken || !flexQueryId) {
      alert('Please enter both Flex Token and Activity Flex Query ID');
      return;
    }

    setIsSaving(true);
    
    // Simulate saving credentials
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would save to environment variables or secure storage
    localStorage.setItem('ibkr_flex_token', flexToken);
    localStorage.setItem('ibkr_flex_query_id', flexQueryId);
    
    setIsSaving(false);
    alert('Credentials saved successfully!');
  };

  const handleTestConnection = async () => {
    if (!flexToken || !flexQueryId) {
      alert('Please enter both Flex Token and Activity Flex Query ID');
      return;
    }

    setIsTesting(true);
    setConnectionStatus('testing');

    try {
      // In a real app, this would test the actual IBKR Flex Query connection
      const response = await fetch('/api/ibkr/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flexToken,
          flexQueryId,
        }),
      });

      if (response.ok) {
        setConnectionStatus('success');
        setLastTestResult('Connection successful! IBKR Flex Query is working.');
      } else {
        setConnectionStatus('error');
        setLastTestResult('Connection failed. Please check your credentials.');
      }
    } catch (error) {
      setConnectionStatus('error');
      setLastTestResult('Connection error. Please try again.');
    }

    setIsTesting(false);
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'success':
        return <Badge variant="default" className="bg-green-600">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Connection Failed</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>;
      default:
        return <Badge variant="outline">Not Tested</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>

          {/* IBKR Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                IBKR Integration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Configure your Interactive Brokers connection using Flex Token and Activity Flex Query ID.
                This provides secure, read-only access to your portfolio data.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flexToken">Flex Token</Label>
                  <Input
                    id="flexToken"
                    type="password"
                    placeholder="Enter your IBKR Flex Token"
                    value={flexToken}
                    onChange={(e) => setFlexToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your secure access token from IBKR Flex Queries
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="flexQueryId">Activity Flex Query ID</Label>
                  <Input
                    id="flexQueryId"
                    placeholder="Enter your Activity Flex Query ID"
                    value={flexQueryId}
                    onChange={(e) => setFlexQueryId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The ID of your portfolio data query
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Connection Status:</span>
                  {getConnectionStatusBadge()}
                </div>
              </div>

              {lastTestResult && (
                <div className={`p-3 rounded-lg ${
                  connectionStatus === 'success' 
                    ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                }`}>
                  <p className={`text-sm ${
                    connectionStatus === 'success' 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-red-800 dark:text-red-200'
                  }`}>
                    {lastTestResult}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting || !flexToken || !flexQueryId}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </Button>

                <Button
                  onClick={handleSaveCredentials}
                  disabled={isSaving || !flexToken || !flexQueryId}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Credentials'}
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Need Help?</p>
                    <p>Follow the setup guide on the dashboard to learn how to obtain your Flex Token and Activity Flex Query ID from Interactive Brokers.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Storage Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Data Storage Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Configure how your portfolio data is stored and managed.
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Storage Type</p>
                  <p className="text-sm text-muted-foreground">Currently using in-memory storage</p>
                </div>
                <Badge variant="outline">Memory</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Data Retention</p>
                  <p className="text-sm text-muted-foreground">Portfolio snapshots and historical data</p>
                </div>
                <Badge variant="outline">30 Days</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Export & Backup */}
          <Card>
            <CardHeader>
              <CardTitle>Export & Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Export your portfolio data or create backups.
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Export to CSV
                </Button>
                <Button variant="outline" size="sm">
                  Export to PDF
                </Button>
                <Button variant="outline" size="sm">
                  Backup Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
