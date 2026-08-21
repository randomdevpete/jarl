import { afterEach, describe, expect, it } from "vitest";
import { devPort, devPortBase, parseTaskId } from "../devPorts.mts";

describe("parseTaskId", () => {
  it("reads the ticket id out of a task branch name", () => {
    expect(parseTaskId("task-485-adopt-dev-servers-port-scheme")).toBe(485);
    expect(parseTaskId("task-9-fix-typo")).toBe(9);
  });

  it("maps the default branch to the reserved standing pseudo-id", () => {
    expect(parseTaskId("master")).toBe(-1);
  });

  it("falls back to the standing pseudo-id for anything unrecognised", () => {
    expect(parseTaskId("beta")).toBe(-1);
    expect(parseTaskId("some-stray-branch")).toBe(-1);
  });
});

describe("devPortBase", () => {
  it("derives a ticket's block from the formula, wrapping every 1000 ids", () => {
    expect(devPortBase(485)).toBe(14850);
    expect(devPortBase(1485)).toBe(14850);
    expect(devPortBase(0)).toBe(10000);
  });

  it("puts jarl's own master worktree on 9970-9979", () => {
    expect(devPortBase(-1)).toBe(9970);
    expect(devPortBase(parseTaskId("master")) + 9).toBe(9979);
  });

  it("leaves the second standing pseudo-id reserved below it", () => {
    expect(devPortBase(-2)).toBe(9960);
  });

  it("moves the standing block with the project ordinal, never the ticket block", () => {
    expect(devPortBase(-1, 1)).toBe(9990);
    expect(devPortBase(-1, 3)).toBe(9950);
    expect(devPortBase(485, 3)).toBe(14850);
  });
});

describe("devPort", () => {
  it("adds the offset onto the derived base", () => {
    expect(devPort(0, 485)).toBe(14850);
    expect(devPort(6, 485)).toBe(14856);
  });

  it("throws for an offset outside a block's ten ports", () => {
    expect(() => devPort(-1, 485)).toThrow(/offset/);
    expect(() => devPort(10, 485)).toThrow(/offset/);
  });
});

describe("DEV_PORT_BASE", () => {
  afterEach(() => {
    delete process.env["DEV_PORT_BASE"];
  });

  it("overrides the derivation entirely", () => {
    process.env["DEV_PORT_BASE"] = "12340";
    expect(devPortBase(485)).toBe(12340);
    expect(devPort(6, 485)).toBe(12346);
  });
});
