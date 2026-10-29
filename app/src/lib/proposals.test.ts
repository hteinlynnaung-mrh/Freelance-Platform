import { describe, expect, it } from "vitest";
import { proposalStatusKeys } from "./proposals";
import type { ProposalStatus } from "../api/types";

describe("Proposal status key mapping", () => {
  it("maps all proposal statuses to their respective translation keys", () => {
    const statuses: ProposalStatus[] = ["SUBMITTED", "SHORTLISTED", "REJECTED", "WITHDRAWN", "ACCEPTED"];
    for (const status of statuses) {
      expect(proposalStatusKeys[status]).toBeDefined();
      expect(typeof proposalStatusKeys[status]).toBe("string");
    }
    expect(proposalStatusKeys.SUBMITTED).toBe("statusSubmitted");
    expect(proposalStatusKeys.ACCEPTED).toBe("statusAccepted");
  });
});

