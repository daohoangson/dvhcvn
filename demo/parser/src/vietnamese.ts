export const initials = (text: string) =>
  text
    .split(/\s+/)
    .map((word) => word.charAt(0))
    .join("");

const marks = ["`", "'", ".", "?", "~"];
const markString = `[${marks.map((mark) => "\\" + mark).join("")}]`;
const markOnlyRegExp = new RegExp(markString, "g");
const markInWordRegExp = new RegExp(`^(.*)(${markString})(.*)$`);
const reorderMark = (word: string) =>
  word.replace(markInWordRegExp, "$1$3$2") + "_";

const map = JSON.parse(
  '{"à":"a`","á":"a\'","ạ":"a.","ả":"a?","ã":"a~","â":"a^","ầ":"a^`","ấ":"a^\'","ậ":"a^.","ẩ":"a^?","ẫ":"a^~","ă":"a(","ằ":"a(`","ắ":"a(\'","ặ":"a(.","ẳ":"a(?","ẵ":"a(~","è":"e`","é":"e\'","ẹ":"e.","ẻ":"e?","ẽ":"e~","ê":"e^","ề":"e^`","ế":"e^\'","ệ":"e^.","ể":"e^?","ễ":"e^~","ì":"i`","í":"i\'","ị":"i.","ỉ":"i?","ĩ":"i~","ò":"o`","ó":"o\'","ọ":"o.","ỏ":"o?","õ":"o~","ô":"o^","ồ":"o^`","ố":"o^\'","ộ":"o^.","ổ":"o^?","ỗ":"o^~","ơ":"o*","ờ":"o*`","ớ":"o*\'","ợ":"o*.","ở":"o*?","ỡ":"o*~","ù":"u`","ú":"u\'","ụ":"u.","ủ":"u?","ũ":"u~","ư":"u*","ừ":"u*`","ứ":"u*\'","ự":"u*.","ử":"u*?","ữ":"u*~","ỳ":"y`","ý":"y\'","ỵ":"y.","ỷ":"y?","ỹ":"y~","đ":"d-","̉":"?","̣":".","̃":"~","̀":"`","́":"\'"}'
) as { [key: string]: string };
const normalizeRegExp = new RegExp(`[${Object.keys(map).join("")}]`, "g");
const normalizer = (str: string) => map[str];

type Typo = [RegExp, (substring: string, ...args: any[]) => string];
const typos: Typo[] = [
  // ch <-> tr
  [/ch/, () => "tr"],
  [/tr/, () => "ch"],
  // d <-> gi
  [/(^|\s)d(\w)/, (_, s1, s2) => `${s1}gi${s2}`],
  [/(^|\s)gi(\w)/, (_, s1, s2) => `${s1}d${s2}`],
  // i <-> y
  [/(\w)i(\s|$)/, (_, s1, s2) => `${s1}y${s2}`],
  [/(\w)y(\s|$)/, (_, s1, s2) => `${s1}i${s2}`],
  // l <-> n
  [/(^|\s)l(\w)/, (_, s1, s2) => `${s1}n${s2}`],
  [/(^|\s)n(\w)/, (_, s1, s2) => `${s1}l${s2}`],
  // s <-> x
  [/(^|\s)s(\w)/, (_, s1, s2) => `${s1}x${s2}`],
  [/(^|\s)x(\w)/, (_, s1, s2) => `${s1}s${s2}`],
  // roman numbers
  [/(^|\s)1(\s|$)/, (_, s1, s2) => `${s1}i${s2}`],
  [/(^|\s)i(\s|$)/, (_, s1, s2) => `${s1}1${s2}`],
  [/(^|\s)2(\s|$)/, (_, s1, s2) => `${s1}ii${s2}`],
  [/(^|\s)ii(\s|$)/, (_, s1, s2) => `${s1}2${s2}`],
  [/(^|\s)3(\s|$)/, (_, s1, s2) => `${s1}iii${s2}`],
  [/(^|\s)iii(\s|$)/, (_, s1, s2) => `${s1}3${s2}`],
  [/(^|\s)4(\s|$)/, (_, s1, s2) => `${s1}iv${s2}`],
  [/(^|\s)iv(\s|$)/, (_, s1, s2) => `${s1}4${s2}`],
  [/(^|\s)5(\s|$)/, (_, s1, s2) => `${s1}v${s2}`],
  [/(^|\s)v(\s|$)/, (_, s1, s2) => `${s1}5${s2}`],
  [/(^|\s)6(\s|$)/, (_, s1, s2) => `${s1}vi${s2}`],
  [/(^|\s)vi(\s|$)/, (_, s1, s2) => `${s1}6${s2}`],
  [/(^|\s)7(\s|$)/, (_, s1, s2) => `${s1}vii${s2}`],
  [/(^|\s)vii(\s|$)/, (_, s1, s2) => `${s1}7${s2}`],
  [/(^|\s)8(\s|$)/, (_, s1, s2) => `${s1}viii${s2}`],
  [/(^|\s)viii(\s|$)/, (_, s1, s2) => `${s1}8${s2}`],
  [/(^|\s)9(\s|$)/, (_, s1, s2) => `${s1}ix${s2}`],
  [/(^|\s)ix(\s|$)/, (_, s1, s2) => `${s1}9${s2}`],
  [/(^|\s)10(\s|$)/, (_, s1, s2) => `${s1}x${s2}`],
  [/(^|\s)x(\s|$)/, (_, s1, s2) => `${s1}10${s2}`],
  [/(^|\s)11(\s|$)/, (_, s1, s2) => `${s1}xi${s2}`],
  [/(^|\s)xi(\s|$)/, (_, s1, s2) => `${s1}11${s2}`],
  [/(^|\s)12(\s|$)/, (_, s1, s2) => `${s1}xii${s2}`],
  [/(^|\s)xii(\s|$)/, (_, s1, s2) => `${s1}12${s2}`],
  // nam <-> bac
  [/(^|\s)nam(\s|$)/, (_, s1, s2) => `${s1}bac${s2}`],
  [/(^|\s)bac(\s|$)/, (_, s1, s2) => `${s1}nam${s2}`],
];

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

function generateVariationsInternal(variations: string[], text: string) {
  for (const typo of typos) {
    const variation = text.replace(typo[0], typo[1]);
    if (!variations.includes(variation)) {
      variations.push(variation);
      generateVariationsInternal(variations, variation);
    }
  }
}

export const generateVariations = (text: string): string[] => {
  const variations: string[] = [text];
  generateVariationsInternal(variations, text);
  return variations;
};
