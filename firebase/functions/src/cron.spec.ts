import { getDateFromRepo } from "./helpers/github";
import { getDateFromSource } from "./helpers/puppeteer";
import { send as sendTelegram } from "./helpers/telegram";
import { compareDateValuesBetweenSourceAndRepo } from "./cron";
import { describe, expect, it, vi } from "vitest";

vi.mock("./helpers/github");
vi.mock("./helpers/puppeteer");
vi.mock("./helpers/telegram");

const mockedConsoleLog = vi
  .spyOn(console, "log")
  .mockImplementation(() => undefined);

describe("compareDateValuesBetweenSourceAndRepo", () => {
  it("should send Telegram with errors", async () => {
    vi.mocked(getDateFromSource).mockRejectedValueOnce(new Error("source"));
    vi.mocked(getDateFromRepo).mockRejectedValueOnce(new Error("repo"));
    await compareDateValuesBetweenSourceAndRepo();

    expect(vi.mocked(sendTelegram)).toHaveBeenCalledWith(
      "❌❌❌\n[getDateFromSource] Error: source\n[getDateFromRepo] Error: repo",
      expect.anything()
    );
  });

  it("should send Telegram with a warning if the dates are different", async () => {
    vi.mocked(getDateFromSource).mockResolvedValueOnce({
      date: "2023-01-01",
      error: undefined,
      png: Buffer.from(""),
    });
    vi.mocked(getDateFromRepo).mockResolvedValueOnce({
      date: "2023-01-02",
      error: undefined,
    });
    await compareDateValuesBetweenSourceAndRepo();

    expect(vi.mocked(sendTelegram)).toHaveBeenCalledWith(
      "2023-01-01 ❌ 2023-01-02",
      expect.anything()
    );
  });

  it("should log a message if the dates are the same", async () => {
    vi.mocked(getDateFromSource).mockResolvedValueOnce({
      date: "2023-01-01",
      error: undefined,
      png: Buffer.from(""),
    });
    vi.mocked(getDateFromRepo).mockResolvedValueOnce({
      date: "2023-01-01",
      error: undefined,
    });
    await compareDateValuesBetweenSourceAndRepo();

    expect(mockedConsoleLog).toHaveBeenCalledWith("✅ 2023-01-01");
  });
});
