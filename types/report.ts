export type ReportStatus = "OPEN" | "RESOLVED";

export type Report = {
  id: string;
  reportedProfileId: string;
  reason: string;
  details?: string;
  status: ReportStatus;
  createdAt: string;
  reporterProfileId?: string; // optional
};
