"use client";

import { useState, useEffect } from "react";
import debounce from "lodash/debounce";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { appsService } from "@/lib/services/apps";
import { osService } from "@/lib/services/os";
import type { AppResponseDto } from "@/lib/services/apps";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft, Star } from "lucide-react";

interface OSAppConfig {
  appId: number;
  appName: string;
  isStandard: boolean;
  isWelcome: boolean;
}

export default function OSAppManagerPage() {
  const router = useRouter();
  const params = useParams();
  const osId = parseInt(params.id as string, 10);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [osName, setOsName] = useState("");
  const [appConfigs, setAppConfigs] = useState<OSAppConfig[]>([]);
  const [allApps, setAllApps] = useState<AppResponseDto[]>([]);

  useEffect(() => {
    loadData();
  }, [osId]);

  const loadData = debounce(async () => {
    try {
      setLoadingData(true);
      const [os, osApps, allAppsList] = await Promise.all([
        osService.getOSById(osId),
        appsService.getAppsByOS(osId),
        appsService.getAllApps(),
      ]);

      setOsName(os.name);
      setAllApps(allAppsList);

      // Create configs from OS apps
      const configs: OSAppConfig[] = osApps.map((app) => {
        const osApp = app.osApps?.find((oa) => oa.osId === osId);
        return {
          appId: app.id,
          appName: app.name,
          isStandard: osApp?.isStandard || false,
          isWelcome: osApp?.isWelcome || false,
        };
      });

      setAppConfigs(configs);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error.message || "Failed to load data");
      router.push("/admin/os");
    } finally {
      setLoadingData(false);
    }
  }, 750);

  const handleToggleStandard = (appId: number) => {
    setAppConfigs((prev) =>
      prev.map((config) =>
        config.appId === appId
          ? { ...config, isStandard: !config.isStandard }
          : config
      )
    );
  };

  const handleToggleWelcome = (appId: number) => {
    setAppConfigs((prev) => {
      // If setting this app as welcome, unset all others
      const newConfigs = prev.map((config) => ({
        ...config,
        isWelcome: config.appId === appId ? !config.isWelcome : false,
      }));
      return newConfigs;
    });
  };

  const handleAddApp = (appId: number) => {
    // Check if app is already in the list
    if (appConfigs.find((c) => c.appId === appId)) {
      toast.error("App is already added to this OS");
      return;
    }

    const app = allApps.find((a) => a.id === appId);
    if (!app) return;

    // Add app to local state only (will be saved when user clicks Save)
    setAppConfigs((prev) => [
      ...prev,
      {
        appId: app.id,
        appName: app.name,
        isStandard: false,
        isWelcome: false,
      },
    ]);
  };

  const handleRemoveApp = (appId: number) => {
    // Remove app from local state only (will be saved when user clicks Save)
    setAppConfigs((prev) => prev.filter((config) => config.appId !== appId));
  };

  const handleSave = debounce(async () => {
    setLoading(true);
    try {
      await appsService.addAppsToOS(osId, {
        apps: appConfigs.map((config) => ({
          appId: Number(config.appId),
          isStandard: config.isStandard,
          isWelcome: config.isWelcome,
        })),
      });

      toast.success("OS-App configurations saved successfully");
      router.push("/admin/os");
    } catch (error: any) {
      console.error("Failed to save configurations:", error);
      toast.error(error.message || "Failed to save configurations");
    } finally {
      setLoading(false);
    }
  }, 750);

  if (loadingData) {
    return (
      <div className="min-h-screen bg-black p-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  const availableApps = allApps.filter(
    (app) => !appConfigs.find((c) => c.appId === app.id)
  );

  return (
    <div className="min-h-screen bg-black p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/os")}
                className="border-slate-700/80 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-white">OS-App Manager</h1>
            <p className="text-slate-400 mt-2">
              Manage apps for: <span className="text-white font-semibold">{osName}</span>
            </p>
          </div>
        </div>

        <div className="border border-slate-700 rounded-xl bg-slate-900/30 p-6 space-y-6">
          {/* Current Apps */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Connected Apps</h2>
            {appConfigs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-700 rounded-lg">
                <p>No apps connected to this OS</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appConfigs.map((config) => (
                  <div
                    key={config.appId}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{config.appName}</h3>
                        {config.isWelcome && (
                          <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                            <Star className="h-3 w-3 fill-yellow-400" />
                            Welcome App
                          </span>
                        )}
                        {config.isStandard && (
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                            Standard
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`standard-${config.appId}`}
                          checked={config.isStandard}
                          onCheckedChange={() => handleToggleStandard(config.appId)}
                        />
                        <Label
                          htmlFor={`standard-${config.appId}`}
                          className="text-white cursor-pointer text-sm"
                        >
                          Standard
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`welcome-${config.appId}`}
                          checked={config.isWelcome}
                          onCheckedChange={() => handleToggleWelcome(config.appId)}
                        />
                        <Label
                          htmlFor={`welcome-${config.appId}`}
                          className="text-white cursor-pointer text-sm"
                        >
                          Welcome
                        </Label>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveApp(config.appId)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Apps to Add */}
          {availableApps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Available Apps</h2>
              <div className="space-y-2">
                {availableApps.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{app.name}</h3>
                      {app.description && (
                        <p className="text-xs text-slate-400 mt-1">{app.description}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddApp(app.id)}
                      className="border-slate-600"
                    >
                      Add to OS
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
