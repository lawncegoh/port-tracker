"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIBKRConnection } from "@/hooks/use-ibkr-connection";
import { RefreshCw } from "lucide-react";

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabChange = (value: string) => {
    if (value === "dashboard") {
      router.push("/");
    } else {
      router.push(`/${value}`);
    }
  };

  const getCurrentTab = () => {
    if (pathname === "/") return "dashboard";
    const segment = pathname.split("/")[1];
    return segment || "dashboard";
  };

  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Portfolio Tracker</h1>
          
          <div className="flex items-center gap-4">
            <Tabs value={getCurrentTab()} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="brokerage">Brokerage</TabsTrigger>
                <TabsTrigger value="real-estate">Real Estate</TabsTrigger>
                <TabsTrigger value="others">Others</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <ConnectionStatus />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectionStatus() {
  const { isConnected, lastSyncText, syncData, isSyncing } = useIBKRConnection();
  
  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-xs text-muted-foreground">Last sync</div>
        <div className="text-sm font-medium">{lastSyncText}</div>
      </div>
      
      <Button
        onClick={syncData}
        disabled={isSyncing}
        size="sm"
        variant="outline"
        className="flex items-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing...' : 'Sync'}
      </Button>
      
      <Badge variant={isConnected ? "default" : "destructive"}>
        {isConnected ? "IBKR Connected" : "IBKR Disconnected"}
      </Badge>
    </div>
  );
}
