import * as functions from "firebase-functions";
import { Blob, FormData } from "formdata-node";
import fetch from "node-fetch-commonjs";

export async function send(text: string, options: { png?: Buffer } = {}) {
  const config = functions.config() as {
    telegram?: { token: string | undefined; chat_id: string | undefined };
  };
  const token = config.telegram?.token;
  const chatId = config.telegram?.chat_id;
  if (typeof token !== "string" || typeof chatId !== "string") {
    throw new Error("Telegram config is incomplete!");
  }

  const data = new FormData();
  data.append("chat_id", chatId);

  let action = "sendMessage";
  if (options.png === undefined) {
    data.append("text", text);
  } else {
    action = "sendPhoto";
    data.append("caption", text);
    data.append(
      "photo",
      new Blob([options.png], { type: "image/png" }),
      "photo.png"
    );
  }

  const url = `https://api.telegram.org/bot${token}/${action}`;
  const response = await fetch(url, { body: data, method: "POST" });
  const json = (await response.json()) as any;
  const ok = json?.ok;
  if (typeof ok !== "boolean") {
    throw new Error(
      `Unexpected response from Telegram: ${JSON.stringify(json)})}`
    );
  }

  if (!ok) {
    console.log({ text, json });
  }
  return ok;
}
