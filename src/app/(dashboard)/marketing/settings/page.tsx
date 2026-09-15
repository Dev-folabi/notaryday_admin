"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { useMarketingSettings, useMarketingSettingsMutation } from "@/hooks/useMarketing";
import { useToastStore } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";

export default function MarketingSettingsPage() {
  const toast = useToastStore((s) => s.push);
  const { data: settings, isLoading, isError } = useMarketingSettings();
  const updateSettings = useMarketingSettingsMutation();

  const [pixelTrackingUrl, setPixelTrackingUrl] = useState(settings?.pixelTrackingUrl ?? "");
  const [pixelTrackingEnabled, setPixelTrackingEnabled] = useState(settings?.pixelTrackingEnabled ?? true);
  const [physicalAddress, setPhysicalAddress] = useState(settings?.physicalAddress ?? "");

  // Sync local state when query loads (handles initial fetch)
  const loaded = !!settings && pixelTrackingUrl === "" && physicalAddress === "";
  if (loaded) {
    setPixelTrackingUrl(settings.pixelTrackingUrl ?? "");
    setPixelTrackingEnabled(settings.pixelTrackingEnabled ?? true);
    setPhysicalAddress(settings.physicalAddress ?? "");
  }

  const save = () => {
    updateSettings.mutate(
      {
        pixelTrackingUrl: pixelTrackingUrl.trim(),
        pixelTrackingEnabled,
        physicalAddress: physicalAddress.trim(),
      },
      {
        onSuccess: () => toast("Settings saved", "success"),
        onError: (error) =>
          toast((error as { message?: string })?.message ?? "Save failed", "error"),
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Marketing settings</h1>
        <p className="mt-1 text-sm text-slate-soft">
          Configure tracking, physical address, and other campaign defaults.
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p className="py-8 text-center text-sm text-red">
          Failed to load settings.
        </p>
      ) : (
        <Card className="max-w-2xl">
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-soft">
                Open / click tracking pixel
              </h2>
              <label className="flex items-center gap-2 text-sm text-slate-body">
                <input
                  type="checkbox"
                  checked={pixelTrackingEnabled}
                  onChange={(e) => setPixelTrackingEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Enable tracking pixel in campaign emails
              </label>
              <p className="mt-1 text-xs text-slate-soft">
                When enabled, a 1x1 transparent pixel image is embedded in
                outgoing emails to track open rates. Disable this if your
                recipients&apos; mail client blocks images or if you prefer not
                to track opens.
              </p>
            </div>

            <Input
              label="Tracking base URL"
              value={pixelTrackingUrl}
              onChange={(e) => setPixelTrackingUrl(e.target.value)}
              placeholder="https://api.notaryday.app"
              disabled={!pixelTrackingEnabled}
            />
            <p className="-mt-3 text-xs text-slate-soft">
              The public URL used for the tracking pixel, click-wrap links, and
              unsubscribe page. Must be reachable from the recipient&apos;s mail
              client.
            </p>

            <div className="border-t border-border/60 pt-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-soft">
                Physical address (CAN-SPAM)
              </h2>
              <Input
                label="Mailing address"
                value={physicalAddress}
                onChange={(e) => setPhysicalAddress(e.target.value)}
                placeholder="123 Main St, Dallas, TX 75201"
              />
              <p className="mt-1 text-xs text-slate-soft">
                Shown in the email footer. Required by CAN-SPAM for marketing
                emails.
              </p>
            </div>

            <div className="flex justify-end border-t border-border/60 pt-4">
              <Button
                loading={updateSettings.isPending}
                onClick={save}
              >
                <Save className="h-3.5 w-3.5" /> Save settings
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
