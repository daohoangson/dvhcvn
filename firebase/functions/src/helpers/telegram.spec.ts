import { describe, expect, it, vi } from "vitest";
import { send } from "./telegram";
import { config } from "firebase-functions/v1";

const mocks = vi.hoisted(() => {
  return {
    config: vi.fn() satisfies typeof config,
  };
});

vi.mock("firebase-functions", () => ({
  config: mocks.config,
}));

describe("telegram/send", () => {
  const token = process.env.TELEGRAM_TOKEN ?? "";
  const testIfHasToken = token.length > 0 ? it : it.skip;
  testIfHasToken("should return true", async () => {
    mocks.config.mockReturnValueOnce({
      telegram: {
        token,
        chat_id: "552046506", // bot chat with @daohoangson
      },
    });

    const actual = await send("Hello");
    expect(actual).toBeTruthy();
  });

  it("should return false with invalid token", async () => {
    mocks.config.mockReturnValueOnce({
      telegram: { token: "foo", chat_id: "bar" },
    });

    const actual = await send("Oops");
    expect(actual).toBeFalsy();
  });

  it("should throw with bad config", async () => {
    mocks.config.mockReturnValueOnce({});
    expect(send("Oops")).rejects.toThrow("Telegram config is incomplete!");
  });
});
