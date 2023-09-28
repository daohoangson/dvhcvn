import { describe, expect, it, vi } from "vitest";
import { getKey } from "./helpers/fs.mjs";
import { getData } from "./helpers/puppeteer.mjs";
import { generateScript } from "./planner.mjs";

let written = "";

const mocks = vi.hoisted(() => {
  return {
    /** @type {import("vitest").Mock<Parameters<typeof getData>, ReturnType<typeof getData>>} */
    getData: vi.fn(),
    /** @type {import("vitest").Mock<Parameters<typeof getKey>, ReturnType<typeof getKey>>} */
    getKey: vi.fn(),
    stdout: {
      write: (str) => (written = `${written}${str}`),
    },
  };
});

vi.mock("process", () => ({ stdout: mocks.stdout }));

vi.mock("./helpers/fs.mjs", () => ({ getKey: mocks.getKey }));
vi.mock("./helpers/puppeteer.mjs", () => ({ getData: mocks.getData }));

describe("generateScript", () => {
  it("should write data", async () => {
    mocks.getData.mockResolvedValueOnce({
      20230102: {
        date: { day: "02", month: "01", year: "2023" },
        docs: ["Document Foo", "Document Bar"],
      },
    });
    mocks.getKey.mockResolvedValueOnce("20230101");
    await generateScript();
    expect(written).toContain("Document Foo");
    expect(written).toContain("Document Bar");
  });

  it("should skip writing", async () => {
    mocks.getData.mockResolvedValueOnce({});
    mocks.getKey.mockResolvedValueOnce("20230101");
    await generateScript();
    expect(written).toMatch(
      /echo Latest date from \$_latestPath: \$_latestDate\n$/
    );
  });
});
