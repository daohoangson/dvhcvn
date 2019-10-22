import { getAsciiAccent } from './vietnamese';
import { expect } from 'chai';

describe('getAsciiAccent', () => {
  const map = {
    'con lươn nó luồn qua lườn em':
      'con lu*o*n no\' luo^n` qua lu*o*n` em',
    'lính lệ leo lên lầu lấy lưỡi lê lấy lộn lại leo lên lấy lại':
      'linh\' le^. leo le^n la^u` la^y\' lu*o*i~ le^ la^y\' lo^n. lai. leo le^n la^y\' lai.',
    'phụ nữ việt nam thường lên núi lấy lá non về làm nón':
      'phu. nu*~ vie^t. nam thu*o*ng` le^n nui\' la^y\' la\' non ve^` lam` non\'',
    'lúc nào lên núi lấy nữa về làm lán nên lưu ý nước lũ':
      'luc\' nao` le^n nui\' la^y\' nu*a~ ve^` lam` lan\' ne^n lu*u y\' nu*o*c\' lu~',
    'lúa nếp là lúa nếp làng lúa lên lớp lớp lòng nàng lâng lâng':
      'lua\' ne^p\' la` lua\' ne^p\' lang` lua\' le^n lo*p\' lo*p\' long` nang` la^ng la^ng',
    'năm nay lũ lớn liên tiếp về làm năng suất lúa nếp của bà con nông dân thấp lắm':
      'na(m nay lu~ lo*n\' lie^n tie^p\' ve^` lam` na(ng sua^t\' lua\' ne^p\' cua? ba` con no^ng da^n tha^p\' la(m\'',
    'nói năng nên luyện luôn luôn lời nói lưu loát luyện luôn lúc này lẽ nào nao núng lung lay lên lớp lú lẫn lại hay nói lầm':
      'noi\' na(ng ne^n luye^n. luo^n luo^n lo*i` noi\' lu*u loat\' luye^n. luo^n luc\' nay` le~ nao` nao nung\' lung lay le^n lo*p\' lu\' la^n~ lai. hay noi\' la^m`',
    'làng nành lợn nái năm nay lọt lòng lúa non nắng lửa nản lòng lão nông nức nở lấy nong nia về':
      'lang` nanh` lo*n. nai\' na(m nay lot. long` lua\' non na(ng\' lu*a? nan? long` lao~ no^ng nu*c\' no*? la^y\' nong nia ve^`',
    'luộc hột vịt lộn luộc lộn hột vịt lạc ăn lộn hột vịt lạc luộc lại hột vịt lộn lại lộn hột vịt lạc':
      'luo^c. ho^t. vit. lo^n. luo^c. lo^n. ho^t. vit. lac. a(n lo^n. ho^t. vit. lac. luo^c. lai. ho^t. vit. lo^n. lai. lo^n. ho^t. vit. lac.',
    'nếu nói lầm lẫn lần này thì lại nói lại nói lầm lẫn lần nữa thì lại nói lại nói cho đến lúc luôn luôn lưu loát hết lầm lẫn mới thôi':
      'ne^u\' noi\' la^m` la^n~ la^n` nay` thi` lai. noi\' lai. noi\' la^m` la^n~ la^n` nu*a~ thi` lai. noi\' lai. noi\' cho d-e^n\' luc\' luo^n luo^n lu*u loat\' he^t\' la^m` la^n~ mo*i\' tho^i',
  };

  Object.keys(map).forEach(input => it(input, () => {
    const result = getAsciiAccent(input);
    expect(result).to.equal(map[input]);
  }));
});
