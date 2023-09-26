import { readFile } from "fs";
import { describe, expect, it, vi } from "vitest";
import { getKey } from "./fs.mjs";

const mocks = vi.hoisted(() => {
  return {
    /** @type {import("vitest").Mock<Parameters<typeof readFile>, ReturnType<typeof readFile>>} */
    readFile: vi.fn(),
  };
});

vi.mock("fs", () => ({ readFile: mocks.readFile }));

describe("getKey", () => {
  it("should return empty string on error", async () => {
    mocks.readFile.mockImplementationOnce((_, __, cb) => cb(new Error("foo")));
    const key = await getKey();
    expect(key).toBe("");
  });

  it("should return file contents", async () => {
    mocks.readFile.mockImplementationOnce((_, __, cb) => cb(null, "foo"));
    const key = await getKey();
    expect(key).toBe("foo");
  });
});
