import * as functions from "firebase-functions";
import * as FormData from "form-data";
import fetch from "node-fetch-commonjs";

export const send = (text: string, options: { png?: Buffer } = {}) => {
  const config = functions.config() as {
    telegram?: { token: string | undefined; chat_id: string | undefined };
  };
  const token = config.telegram?.token;
  const chatId = config.telegram?.chat_id;
  if (typeof token !== "string" || typeof chatId !== "string") {
    console.error("Telegram config is incomplete!");
    return;
  }

  const data = new FormData();
  data.append("chat_id", chatId);

  let action = "sendMessage";
  if (options.png === undefined) {
    data.append("text", text);
  } else {
    action = "sendPhoto";
    data.append("caption", text);
    data.append("photo", options.png, { filename: "photo.png" });
  }

  const url = `https://api.telegram.org/bot${token}/${action}`;
  return fetch(url, { body: data, method: "POST" });
};
