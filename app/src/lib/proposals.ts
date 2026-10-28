import type { ProposalStatus } from "../api/types";

export const proposalStatusKeys: Record<ProposalStatus, "statusSubmitted" | "statusShortlisted" | "statusRejected" | "statusWithdrawn" | "statusAccepted"> = {
  SUBMITTED: "statusSubmitted",
  SHORTLISTED: "statusShortlisted",
  REJECTED: "statusRejected",
  WITHDRAWN: "statusWithdrawn",
  ACCEPTED: "statusAccepted",
};
