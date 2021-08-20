import * as dvhcvn from '../index'

test('level1s is not empty', () => {
  expect(dvhcvn.level1s.length).toBeGreaterThan(0)
})

test('findLevel1ById returns', () => {
  const level1 = dvhcvn.findLevel1ById('01')
  expect(level1?.name).toBe('Thành phố Hà Nội')
})

test('findLevel1ByName returns', () => {
  const level1 = dvhcvn.findLevel1ByName('Thành phố Hà Nội')
  expect(level1?.id).toBe('01')
})

describe('Entity', () => {
  describe('typeAsString', () => {
    test('returns Type.huyen', () => {
      const haNoi = dvhcvn.findLevel1ById('01')
      const socSon = haNoi?.findLevel2ById('016')
      expect(socSon?.typeAsString).toBe('Huyện')
    })

    test('returns Type.quan', () => {
      const haNoi = dvhcvn.findLevel1ById('01')
      const baDinh = haNoi?.findLevel2ById('001')
      expect(baDinh?.typeAsString).toBe('Quận')
    })

    test('returns Type.phuong', () => {
      const haNoi = dvhcvn.findLevel1ById('01')
      const baDinh = haNoi?.findLevel2ById('001')
      const phucXa = baDinh?.findLevel3ById('00001')
      expect(phucXa?.typeAsString).toBe('Phường')
    })

    test('returns Type.thi_tran', () => {
      const haNoi = dvhcvn.findLevel1ById('01')
      const socSon = haNoi?.findLevel2ById('016')
      const thiTran = socSon?.findLevel3ById('00376')
      expect(thiTran?.typeAsString).toBe('Thị trấn')
    })

    test('returns Type.thi_xa', () => {
      const haNoi = dvhcvn.findLevel1ById('01')
      const sonTay = haNoi?.findLevel2ById('269')
      expect(sonTay?.typeAsString).toBe('Thị xã')
    })

    test('returns Type.tinh', () => {
      const haGiang = dvhcvn.findLevel1ById('02')
      expect(haGiang?.typeAsString).toBe('Tỉnh')
    })

    test('returns Type.tp', () => {
      const haGiang = dvhcvn.findLevel1ById('02')
      const tp = haGiang?.findLevel2ById('024')
      expect(tp?.typeAsString).toBe('Thành phố')
    })

    test('returns Type.tptw', () => {
      const haNoi = dvhcvn.findLevel1ById('01')
      expect(haNoi?.typeAsString).toBe('Thành phố trực thuộc Trung ương')
    })

    test('returns Type.xa', () => {
      const haNoi = dvhcvn.findLevel1ById('01')
      const socSon = haNoi?.findLevel2ById('016')
      const bacSon = socSon?.findLevel3ById('00379')
      expect(bacSon?.typeAsString).toBe('Xã')
    })
  })

  describe('toString', () => {
    test('Level1', () => {
      const haNoi = dvhcvn.findLevel1ById('01')
      const str = haNoi?.toString()
      expect(str).toEqual('Thành phố Hà Nội')
    })

    test('Level2', () => {
      const haNoi = dvhcvn.findLevel1ById('01')
      const baDinh = haNoi?.findLevel2ById('001')
      const str = baDinh?.toString()
      expect(str).toBe('Thành phố Hà Nội > Quận Ba Đình')
    })

    test('Level3', () => {
      const haNoi = dvhcvn.findLevel1ById('01')
      const baDinh = haNoi?.findLevel2ById('001')
      const phucXa = baDinh?.findLevel3ById('00001')
      const str = phucXa?.toString()
      expect(str).toBe('Thành phố Hà Nội > Quận Ba Đình > Phường Phúc Xá')
    })
  })
})

describe('Level1', () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const haNoi = dvhcvn.findLevel1ById('01')!

  test('parent returns null', () => {
    expect(haNoi.parent).toBeUndefined()
  })

  test('findLevel2ById returns', () => {
    const level2 = haNoi.findLevel2ById('001')
    expect(level2?.name).toBe('Quận Ba Đình')
  })

  test('findLevel2ByName returns', () => {
    const level2 = haNoi.findLevel2ByName('Quận Ba Đình')
    expect(level2?.id).toBe('001')
  })
})

describe('Level2', () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const haNoi = dvhcvn.findLevel1ById('01')!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const baDinh = haNoi.findLevel2ById('001')!

  test('parent returns', () => expect(baDinh.parent).toBe(haNoi))

  test('findLevel3ById returns', () => {
    const level3 = baDinh.findLevel3ById('00001')
    expect(level3?.name).toBe('Phường Phúc Xá')
  })

  test('findLevel3ByName returns', () => {
    const level3 = baDinh.findLevel3ByName('Phường Phúc Xá')
    expect(level3?.id).toBe('00001')
  })
})

describe('Level3', () => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const haNoi = dvhcvn.findLevel1ById('01')!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const baDinh = haNoi.findLevel2ById('001')!
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const phucXa = baDinh.findLevel3ById('00001')!

  test('parent returns', () => expect(phucXa.parent).toBe(baDinh))
})
