import { readFileSync } from "fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { main, processLevel1, processLevel2, processLevel3 } from "./generate";

let written = "";

const mocks = vi.hoisted(() => {
  return {
    readFileSync: vi.fn() satisfies typeof readFileSync,
    stdout: {
      write: (str: string) => (written = `${written}${str}`),
    },
  };
});

vi.mock("fs", () => ({
  readFileSync: mocks.readFileSync,
}));

vi.mock("process", () => ({
  stdout: mocks.stdout,
}));

describe("generate", () => {
  beforeEach(() => {
    written = "";
  });

  it("should process level 1", () => {
    processLevel1(0, {
      level1_id: "01",
      name: "Thành phố Hà Nội",
      type: "Thành phố Trung ương",
      level2s: [],
    });
    expect(written.trim()).toEqual(
      "new Level1('01', 'Thành phố Hà Nội', Type.tptw, [\n]),"
    );
  });

  it("should process level 2", () => {
    processLevel2(0, 0, {
      level2_id: "001",
      name: "Quận Ba Đình",
      type: "Quận",
      level3s: [],
    });
    expect(written.trim()).toEqual(
      "new Level2(0, '001', 'Quận Ba Đình', Type.quan, [\n]),"
    );
  });

  it("should process level 3", () => {
    processLevel3(0, 0, {
      level3_id: "00001",
      name: "Phường Phúc Xá",
      type: "Phường",
    });
    expect(written.trim()).toEqual(
      "new Level3(0, 0, '00001', 'Phường Phúc Xá', Type.phuong),"
    );
  });

  it("should process all levels", () => {
    mocks.readFileSync.mockReturnValueOnce(
      JSON.stringify({
        data: [
          {
            level1_id: "01",
            name: "Thành phố Hà Nội",
            type: "Thành phố Trung ương",
            level2s: [
              {
                level2_id: "001",
                name: "Quận Ba Đình",
                type: "Quận",
                level3s: [
                  {
                    level3_id: "00001",
                    name: "Phường Phúc Xá",
                    type: "Phường",
                  },
                ],
              },
            ],
          },
        ],
      })
    );

    main(["/path/to/file.json"]);

    expect(mocks.readFileSync).toHaveBeenCalledWith(
      "/path/to/file.json",
      expect.anything()
    );

    expect(written).toEqual(
      "import { Level1, Level2, Level3, Type } from './model';\n" +
        "\nexport const level1s = [" +
        "new Level1('01', 'Thành phố Hà Nội', Type.tptw, [\n" +
        "new Level2(0, '001', 'Quận Ba Đình', Type.quan, [\n" +
        "new Level3(0, 0, '00001', 'Phường Phúc Xá', Type.phuong),\n" +
        "]),\n" +
        "]),\n" +
        "];"
    );
  });

  it("should handle name with single quote", () => {
    processLevel1(0, {
      level1_id: "foo",
      name: "Tỉnh Foo's",
      type: "Tỉnh",
      level2s: [],
    });
    expect(written.trim()).toEqual(
      "new Level1('foo', \"Tỉnh Foo's\", Type.tinh, [\n]),"
    );
  });

  it("should handle name with double quote", () => {
    processLevel1(0, {
      level1_id: "foo",
      name: 'Tỉnh Foo"bar',
      type: "Tỉnh",
      level2s: [],
    });
    expect(written.trim()).toEqual(
      "new Level1('foo', 'Tỉnh Foo\"bar', Type.tinh, [\n]),"
    );
  });

  it("should handle name with single and double quotes", () => {
    processLevel1(0, {
      level1_id: "foo",
      name: "Tỉnh 'Foo\"bar",
      type: "Tỉnh",
      level2s: [],
    });
    expect(written.trim()).toEqual(
      "new Level1('foo', 'Tỉnh \\'Foo\"bar', Type.tinh, [\n]),"
    );
  });

  it("should handle invalid type", () => {
    const fn = () =>
      processLevel1(0, {
        level1_id: "foo",
        name: "Bar Foo",
        type: "Bar",
        level2s: [],
      });
    expect(fn).toThrowError("Type not found: Bar");
  });
});
