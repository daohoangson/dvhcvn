export const initials = (text: string) =>
  text
    .split(/\s+/)
    .map(word => word.charAt(0))
    .join("");

const marks = ["`", "'", ".", "?", "~"];
const markString = `[${marks.map(mark => `\\${mark}`).join("")}]`;
const markOnlyRegExp = new RegExp(markString, "g");
const markInWordRegExp = new RegExp(`^(.*)(${markString})(.*)$`);
const reorderMark = (word: string) =>
  word.replace(markInWordRegExp, "$1$3$2") + "_";

const map = JSON.parse(
  '{"à":"a`","á":"a\'","ạ":"a.","ả":"a?","ã":"a~","â":"a^","ầ":"a^`","ấ":"a^\'","ậ":"a^.","ẩ":"a^?","ẫ":"a^~","ă":"a(","ằ":"a(`","ắ":"a(\'","ặ":"a(.","ẳ":"a(?","ẵ":"a(~","è":"e`","é":"e\'","ẹ":"e.","ẻ":"e?","ẽ":"e~","ê":"e^","ề":"e^`","ế":"e^\'","ệ":"e^.","ể":"e^?","ễ":"e^~","ì":"i`","í":"i\'","ị":"i.","ỉ":"i?","ĩ":"i~","ò":"o`","ó":"o\'","ọ":"o.","ỏ":"o?","õ":"o~","ô":"o^","ồ":"o^`","ố":"o^\'","ộ":"o^.","ổ":"o^?","ỗ":"o^~","ơ":"o*","ờ":"o*`","ớ":"o*\'","ợ":"o*.","ở":"o*?","ỡ":"o*~","ù":"u`","ú":"u\'","ụ":"u.","ủ":"u?","ũ":"u~","ư":"u*","ừ":"u*`","ứ":"u*\'","ự":"u*.","ử":"u*?","ữ":"u*~","ỳ":"y`","ý":"y\'","ỵ":"y.","ỷ":"y?","ỹ":"y~","đ":"d-","̉":"?","̣":".","̃":"~","̀":"`","́":"\'"}'
) as { [key: string]: string };
const normalizeRegExp = new RegExp(`[${Object.keys(map).join("")}]`, "g");
const normalizer = (str: string) => map[str];

export const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(markOnlyRegExp, " ")
    .replace(normalizeRegExp, normalizer)
    .split(/\s+/)
    .map(reorderMark)
    .join(" ");

const deaccentRegExp = new RegExp(/[^a-z0-9 ]/g);
const deaccentReplacer = (str: string) => map[str].replace(deaccentRegExp, "");
export const deaccent = (text: string) =>
  text.toLowerCase().replace(normalizeRegExp, deaccentReplacer);
