const asciiAccentMap = {
  'à': 'a`', 'á': "a'", 'ạ': 'a.', 'ả': 'a?', 'ã': 'a~',
  'â': 'a^', 'ầ': 'a^`', 'ấ': "a^'", 'ậ': 'a^.', 'ẩ': 'a^?', 'ẫ': 'a^~',
  'ă': 'a(', 'ằ': 'a(`', 'ắ': "a('", 'ặ': 'a(.', 'ẳ': 'a(?', 'ẵ': 'a(~',
  'è': 'e`', 'é': "e'", 'ẹ': 'e.', 'ẻ': 'e?', 'ẽ': 'e~',
  'ê': 'e^', 'ề': 'e^`', 'ế': "e^'", 'ệ': 'e^.', 'ể': 'e^?', 'ễ': 'e^~',
  'ì': 'i`', 'í': "i'", 'ị': 'i.', 'ỉ': 'i?', 'ĩ': 'i~',
  'ò': 'o`', 'ó': "o'", 'ọ': 'o.', 'ỏ': 'o?', 'õ': 'o~',
  'ô': 'o^', 'ồ': 'o^`', 'ố': "o^'", 'ộ': 'o^.', 'ổ': 'o^?', 'ỗ': 'o^~',
  'ơ': 'o*', 'ờ': 'o*`', 'ớ': "o*'", 'ợ': 'o*.', 'ở': 'o*?', 'ỡ': 'o*~',
  'ù': 'u`', 'ú': "u'", 'ụ': 'u.', 'ủ': 'u?', 'ũ': 'u~',
  'ư': 'u*', 'ừ': 'u*`', 'ứ': "u*'", 'ự': 'u*.', 'ử': 'u*?', 'ữ': 'u*~',
  'ỳ': 'y`', 'ý': "y'", 'ỵ': 'y.', 'ỷ': 'y?', 'ỹ': 'y~',
  'đ': 'd-',
  '̉': '?', '̣': '.', '̃': '~', '̀': '`', '́': "'",
}

const asciiAccentRegExp = new RegExp(`[${Object.keys(asciiAccentMap).join('')}]`, 'g');
const asciiAccentReplacer = (m: string): string => asciiAccentMap[m];

const asciiMarks = ['`', "'", '.', '?', '~'];
const asciiMarkRegExp = new RegExp(`^(.*)([${asciiMarks.map(m => `\\${m}`).join('')}])(.*)$`);
const asciiMarkCallback = (w: string): string => w.replace(asciiMarkRegExp, '$1$3$2');

export const getAsciiAccent = (text: string): string => {
  const ascii = text.replace(asciiAccentRegExp, asciiAccentReplacer);
  const reorderedMark = ascii.split(/\s+/).map(asciiMarkCallback).join(' ');
  return reorderedMark;
}