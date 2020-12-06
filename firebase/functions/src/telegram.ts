import axios from 'axios';
import * as FormData from 'form-data';
import * as functions from 'firebase-functions';

export const send = (text: string, options: { png?: Buffer } = {}) => {
  const config = functions.config() as { telegram: { token: string | undefined, chat_id: string | undefined } };
  if (!config.telegram || !config.telegram.token || !config.telegram.chat_id) {
    console.error('Telegram config is incomplete!');
    return;
  }

  const { telegram: { token, chat_id: chatId } } = config;
  const data = new FormData();
  data.append('chat_id', chatId);

  let action = 'sendMessage';
  if (options.png === undefined) {
    data.append('text', text);
  } else {
    action = 'sendPhoto';
    data.append('caption', text);
    data.append('photo', options.png, { filename: 'photo.png' });
  }

  const headers = { 'Content-Type': `multipart/form-data; boundary=${data.getBoundary()}` };
  const url = `https://api.telegram.org/bot${token}/${action}`;

  return axios.post(url, data, { headers });
}
