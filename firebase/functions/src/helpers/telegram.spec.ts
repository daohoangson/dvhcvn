import { beforeEach, describe, expect, it, vi } from "vitest";
import { send } from "./telegram";

const hoisted = vi.hoisted(() => ({
  telegramToken: "",
}));

vi.mock("firebase-functions/params", () => {
  return {
    defineSecret: () => ({
      value: () => hoisted.telegramToken,
    }),
    defineString: () => ({
      value: () => "552046506", // bot chat with @daohoangson
    }),
  };
});

describe("telegram/send", () => {
  beforeEach(() => {
    hoisted.telegramToken = "";
  });

  const token = process.env.TELEGRAM_TOKEN ?? "";
  const testIfHasToken = token.length > 0 ? it : it.skip;
  testIfHasToken("should return true", async () => {
    hoisted.telegramToken = token;
    const actual = await send(`[${new Date().toISOString()}] ${__filename}`);
    expect(actual).toBeTruthy();
  });

  it("should return false with invalid token", async () => {
    hoisted.telegramToken = "foo";
    const actual = await send("Oops");
    expect(actual).toBeFalsy();
  });

  it("should throw with bad config", async () => {
    expect(send("Oops")).rejects.toThrow("Telegram config is incomplete!");
  });
});
