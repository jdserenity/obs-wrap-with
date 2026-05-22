import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const script = readFileSync(join(__dirname, "..", "push_to_prod"), "utf8");

describe("push_to_prod", () => {
  it("deploys to desktop vault", () => {
    expect(script).toContain("obsidian vault (root)/.obsidian/plugins/wrap-with");
  });
  it("deploys to mobile iCloud vault", () => {
    expect(script).toContain("obsidian vault (ios)/.obsidian/plugins/wrap-with");
  });
});
