import { normalize } from "./vietnamese";
import { expect } from "chai";

describe("normalize", () => {
  const map = {
    "con lươn nó luồn qua lườn em":
      "con_ lu*o*n_ no'_ luo^n`_ qua_ lu*o*n`_ em_",
    "lính lệ leo lên lầu lấy lưỡi lê lấy lộn lại leo lên lấy lại":
      "linh'_ le^._ leo_ le^n_ la^u`_ la^y'_ lu*o*i~_ le^_ la^y'_ lo^n._ lai._ leo_ le^n_ la^y'_ lai._",
    "phụ nữ việt nam thường lên núi lấy lá non về làm nón":
      "phu._ nu*~_ vie^t._ nam_ thu*o*ng`_ le^n_ nui'_ la^y'_ la'_ non_ ve^`_ lam`_ non'_",
    "lúc nào lên núi lấy nữa về làm lán nên lưu ý nước lũ":
      "luc'_ nao`_ le^n_ nui'_ la^y'_ nu*a~_ ve^`_ lam`_ lan'_ ne^n_ lu*u_ y'_ nu*o*c'_ lu~_",
    "lúa nếp là lúa nếp làng lúa lên lớp lớp lòng nàng lâng lâng":
      "lua'_ ne^p'_ la`_ lua'_ ne^p'_ lang`_ lua'_ le^n_ lo*p'_ lo*p'_ long`_ nang`_ la^ng_ la^ng_",
    "năm nay lũ lớn liên tiếp về làm năng suất lúa nếp của bà con nông dân thấp lắm":
      "na(m_ nay_ lu~_ lo*n'_ lie^n_ tie^p'_ ve^`_ lam`_ na(ng_ sua^t'_ lua'_ ne^p'_ cua?_ ba`_ con_ no^ng_ da^n_ tha^p'_ la(m'_",
    "nói năng nên luyện luôn luôn lời nói lưu loát luyện luôn lúc này lẽ nào nao núng lung lay lên lớp lú lẫn lại hay nói lầm":
      "noi'_ na(ng_ ne^n_ luye^n._ luo^n_ luo^n_ lo*i`_ noi'_ lu*u_ loat'_ luye^n._ luo^n_ luc'_ nay`_ le~_ nao`_ nao_ nung'_ lung_ lay_ le^n_ lo*p'_ lu'_ la^n~_ lai._ hay_ noi'_ la^m`_",
    "làng nành lợn nái năm nay lọt lòng lúa non nắng lửa nản lòng lão nông nức nở lấy nong nia về":
      "lang`_ nanh`_ lo*n._ nai'_ na(m_ nay_ lot._ long`_ lua'_ non_ na(ng'_ lu*a?_ nan?_ long`_ lao~_ no^ng_ nu*c'_ no*?_ la^y'_ nong_ nia_ ve^`_",
    "luộc hột vịt lộn luộc lộn hột vịt lạc ăn lộn hột vịt lạc luộc lại hột vịt lộn lại lộn hột vịt lạc":
      "luo^c._ ho^t._ vit._ lo^n._ luo^c._ lo^n._ ho^t._ vit._ lac._ a(n_ lo^n._ ho^t._ vit._ lac._ luo^c._ lai._ ho^t._ vit._ lo^n._ lai._ lo^n._ ho^t._ vit._ lac._",
    "nếu nói lầm lẫn lần này thì lại nói lại nói lầm lẫn lần nữa thì lại nói lại nói cho đến lúc luôn luôn lưu loát hết lầm lẫn mới thôi":
      "ne^u'_ noi'_ la^m`_ la^n~_ la^n`_ nay`_ thi`_ lai._ noi'_ lai._ noi'_ la^m`_ la^n~_ la^n`_ nu*a~_ thi`_ lai._ noi'_ lai._ noi'_ cho_ d-e^n'_ luc'_ luo^n_ luo^n_ lu*u_ loat'_ he^t'_ la^m`_ la^n~_ mo*i'_ tho^i_"
  };

  Object.keys(map).forEach(input =>
    it(input, () => {
      const result = normalize(input);
      expect(result).to.equal(map[input]);
    })
  );
});
