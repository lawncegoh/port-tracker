"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ExternalLink, CheckCircle, AlertCircle, Info, Key, FileText } from "lucide-react";

export function IBKRSetupGuide() {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Enable Flex Queries in IBKR",
      description: "Log into your Interactive Brokers Web Portal and enable Flex Queries",
      details: [
        "Go to Performance & Reports → Flex Queries",
        "Ensure Flex Queries are enabled for your account",
        "Note: This may require approval from IBKR (24-48 hours)"
      ],
      status: "pending"
    },
    {
      id: 2,
      title: "Create Flex Query",
      description: "Set up a Flex Query to generate your Activity Flex Query ID",
      details: [
        "In Flex Queries section, click 'Create New Query'",
        "Select 'Activity' as the query type",
        "Configure the query to include trades, positions, and account info",
        "Set the activation period to at least one year",
        "Save the query and note the generated ID"
      ],
      status: "pending"
    },
    {
      id: 3,
      title: "Generate Flex Token",
      description: "Create a Flex Token for secure API access",
      details: [
        "In Flex Queries section, go to 'Tokens' tab",
        "Click 'Generate New Token'",
        "Set token permissions to 'Read Only'",
        "Set expiration to at least one year",
        "Copy the generated token (you'll need this)"
      ],
      status: "pending"
    },
    {
      id: 4,
      title: "Configure Portfolio Tracker",
      description: "Enter your Flex Token and Activity Flex Query ID in the app",
      details: [
        "Go to Settings → IBKR Integration",
        "Enter your Flex Token",
        "Enter your Activity Flex Query ID",
        "Click 'Test Connection' to verify",
        "Start syncing your portfolio data"
      ],
      status: "pending"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-600">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          IBKR Flex Token Setup Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Follow these steps to connect your Interactive Brokers account using Flex Token and Activity Flex Query ID.
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Important:</p>
              <p>Make sure to input Flex Token and Activity Flex Query ID in the correct respective fields.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{step.title}</h4>
                      {getStatusBadge(step.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {step.description}
                    </p>
                    {isExpanded && (
                      <ul className="text-sm space-y-1 ml-4">
                        {step.details.map((detail, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            size="sm"
          >
            {isExpanded ? 'Show Less' : 'Show Details'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://intercom.help/tradezella-4066d388d93c/en/articles/6063403-interactive-broker-how-to-sync-your-interactive-broker-ibkr-account-with-tradezella', '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Full TradeZella Guide
          </Button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Key Benefits of Flex Token Approach:</p>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Secure:</strong> No direct access to your broker credentials</li>
                <li>• <strong>Read-Only:</strong> Can only view data, never execute trades</li>
                <li>• <strong>Flexible:</strong> Set custom permissions and expiration dates</li>
                <li>• <strong>Reliable:</strong> Uses IBKR&rsquo;s official Flex Query system</li>
                <li>• <strong>Safe:</strong> Portfolio tracker never touches your money or assets</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800 dark:text-green-200">
              <p className="font-medium mb-1">What You&rsquo;ll Need:</p>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Flex Token:</strong> Your secure access token</li>
                <li>• <strong>Activity Flex Query ID:</strong> Your portfolio data query identifier</li>
                <li>• <strong>IBKR Account:</strong> Active Interactive Brokers account</li>
                <li>• <strong>Flex Queries Access:</strong> Enabled in your IBKR account</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">New: Real-Time Data Fetching</p>
              <p>Once configured, you can now fetch portfolio data directly from IBKR using the official Flex Web Service API at <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">ndcdyn.interactivebrokers.com/AccountManagement/FlexWebService</code>. No more manual CSV uploads needed!</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
