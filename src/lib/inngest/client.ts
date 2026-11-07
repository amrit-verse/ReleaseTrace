import { Inngest } from "inngest";
import { DeploymentEvent } from "@/contracts";

export type ReleaseTraceEvents = {
  "releasetrace/deployment.received": {
    data: {
      event: DeploymentEvent;
      correlatedVercelUrl?: string;
      correlatedVercelId?: string;
    };
  };
  "releasetrace/resolution.confirmed": {
    data: {
      projectId?: string;
      assessmentId: string;
      deploymentId: string;
      engineerName: string;
      confirmedRootCause: string;
      appliedFix: string;
      preventionGuideline: string;
      outcome: string;
      retainToHindsight: boolean;
      tags: string[];
    };
  };
};

export const inngest = new Inngest({
  id: "releasetrace",
  eventKey: process.env.INNGEST_EVENT_KEY || "local",
});
