"use client";

import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Storage Type</p>
                <p className="text-sm text-muted-foreground">Currently using in-memory storage</p>
              </div>
              <Badge variant="outline">Memory</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export & Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Export or back up your data (coming soon).
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

