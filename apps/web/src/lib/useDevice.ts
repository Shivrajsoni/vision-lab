"use client";

import { probeDevice } from "@visionlab/inference";
import type { DeviceProfile } from "@visionlab/inference";
import { useEffect, useState } from "react";

/** The visitor's device capabilities, or null while the browser is still being asked. */
export function useDevice(): DeviceProfile | null {
  const [device, setDevice] = useState<DeviceProfile | null>(null);

  useEffect(() => {
    let current = true;
    probeDevice().then((profile) => {
      if (current) setDevice(profile);
    });
    return () => {
      current = false;
    };
  }, []);

  return device;
}
