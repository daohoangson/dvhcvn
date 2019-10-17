import axios from 'axios';
import * as FormData from 'form-data';
import * as functions from 'firebase-functions';

export const sendMessage = (text: string) => {
  const config = functions.config() as { telegram: { token: string | undefined, chat_id: string | undefined } };
  if (!config.telegram || !config.telegram.token || !config.telegram.chat_id) {
    console.error('Telegram config is incomplete!');
    return;
  }

  const { telegram: { token, chat_id: chatId } } = config;
  const data = new FormData();
  data.append('text', text);
  data.append('chat_id', chatId);
  const headers = { 'Content-Type': `multipart/form-data; boundary=${data.getBoundary()}` };
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  return axios.post(url, data, { headers });
}
