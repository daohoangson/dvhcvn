import { getDateFromRepo } from "./helpers/github";
import { getDateFromSource } from "./helpers/puppeteer";
import { send } from "./helpers/telegram";
import { compareDateValuesBetweenSourceAndRepo } from "./cron";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    getDateFromRepo: vi.fn() satisfies typeof getDateFromRepo,
    getDateFromSource: vi.fn() satisfies typeof getDateFromSource,
    sendTelegram: vi.fn() satisfies typeof send,
  };
});

vi.mock("./helpers/github", () => ({
  getDateFromRepo: mocks.getDateFromRepo,
}));
vi.mock("./helpers/puppeteer", () => ({
  getDateFromSource: mocks.getDateFromSource,
}));
vi.mock("./helpers/telegram", () => ({
  send: mocks.sendTelegram,
}));

const mockedConsoleLog = vi
  .spyOn(console, "log")
  .mockImplementation(() => undefined);

describe("compareDateValuesBetweenSourceAndRepo", () => {
  it("should send Telegram with errors", async () => {
    mocks.getDateFromSource.mockRejectedValueOnce(new Error("source"));
    mocks.getDateFromRepo.mockRejectedValueOnce(new Error("repo"));
    await compareDateValuesBetweenSourceAndRepo();

    expect(mocks.sendTelegram).toHaveBeenCalledWith(
      "❌❌❌\n[getDateFromSource] Error: source\n[getDateFromRepo] Error: repo",
      expect.anything()
    );
  });

  it("should send Telegram with a warning if the dates are different", async () => {
    mocks.getDateFromSource.mockResolvedValueOnce({
      date: "2023-01-01",
      error: undefined,
      png: Buffer.from(""),
    });
    mocks.getDateFromRepo.mockResolvedValueOnce({
      date: "2023-01-02",
      error: undefined,
    });
    await compareDateValuesBetweenSourceAndRepo();

    expect(mocks.sendTelegram).toHaveBeenCalledWith(
      "2023-01-01 ❌ 2023-01-02",
      expect.anything()
    );
  });

  it("should log a message if the dates are the same", async () => {
    mocks.getDateFromSource.mockResolvedValueOnce({
      date: "2023-01-01",
      error: undefined,
      png: Buffer.from(""),
    });
    mocks.getDateFromRepo.mockResolvedValueOnce({
      date: "2023-01-01",
      error: undefined,
    });
    await compareDateValuesBetweenSourceAndRepo();

    expect(mockedConsoleLog).toHaveBeenCalledWith("✅ 2023-01-01");
  });
});
