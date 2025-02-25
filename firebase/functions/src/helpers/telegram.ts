import { defineSecret, defineString } from "firebase-functions/params";
import { boolean, object, safeParse } from "valibot";

export const telegramToken = defineSecret("TELEGRAM_TOKEN");
const telegramChatId = defineString("TELEGRAM_CHAT_ID");

const ResponseSchema = object({ ok: boolean() });

export async function send(text: string, options: { png?: Uint8Array } = {}) {
  const token = telegramToken.value();
  const chatId = telegramChatId.value();
  if (token.length === 0 || chatId.length === 0) {
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
  const json = (await response.json()) as unknown;
  const { output, success } = safeParse(ResponseSchema, json);
  if (!success) {
    throw new Error(
      `Unexpected response from Telegram: ${JSON.stringify(json)})}`
    );
  }

  const ok = output.ok;
  if (!ok) {
    console.log({ text, json });
  }
  return ok;
}
