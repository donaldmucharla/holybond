export type InterestStatus = "SENT" | "ACCEPTED" | "REJECTED";

export type Interest = {
  id: string;
  fromProfileId: string;
  toProfileId: string;
  message?: string;
  status: InterestStatus;
  createdAt: string;
};
