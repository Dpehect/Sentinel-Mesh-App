import {describe, expect, it} from "vitest";
import {executePlaybooks} from "./index.js";

describe("SOAR engine", () => {
  it("matches alerts and flags destructive actions for approval", () => {
    const decision = executePlaybooks(
      {severity:"critical", type:"credential-compromise"},
      [{
        name:"Credential response",
        matches:["credential-compromise"],
        actions:["revoke-token","notify-security-team"]
      }]
    );

    expect(decision.playbook).toBe("Credential response");
    expect(decision.requiresApproval).toBe(true);
  });

  it("falls back to notification", () => {
    expect(executePlaybooks(
      {severity:"low", type:"unknown"}, []
    ).actions).toEqual(["notify-security-team"]);
  });
});
