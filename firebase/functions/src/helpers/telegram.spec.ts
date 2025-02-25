import { describe, expect, it, vi } from "vitest";
import { send } from "./telegram";
import { config } from "firebase-functions/v1";

vi.mock("firebase-functions/v1", async (importActual) => {
  const actual = await importActual<typeof import("firebase-functions")>();
  return { ...actual, config: vi.fn() };
});

describe("telegram/send", () => {
  const token = process.env.TELEGRAM_TOKEN ?? "";
  const testIfHasToken = token.length > 0 ? it : it.skip;
  testIfHasToken("should return true", async () => {
    vi.mocked(config).mockReturnValueOnce({
      telegram: {
        token,
        chat_id: "552046506", // bot chat with @daohoangson
      },
    });

    const actual = await send(`[${new Date().toISOString()}] ${__filename}`);
    expect(actual).toBeTruthy();
  });

  it("should return false with invalid token", async () => {
    vi.mocked(config).mockReturnValueOnce({
      telegram: { token: "foo", chat_id: "bar" },
    });

    const actual = await send("Oops");
    expect(actual).toBeFalsy();
  });

  it("should throw with bad config", async () => {
    vi.mocked(config).mockReturnValueOnce({});
    expect(send("Oops")).rejects.toThrow("Telegram config is incomplete!");
  });
});
