import { deflateRawSync, inflateRawSync } from "node:zlib";
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export function zip(entries) {
  const local = [],
    central = [];
  let offset = 0;
  for (const [path, text] of Object.entries(entries)) {
    const name = Buffer.from(path),
      data = Buffer.from(text),
      compressed = deflateRawSync(data),
      crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(33, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(name.length, 26);
    local.push(header, name, compressed);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(8, 10);
    record.writeUInt16LE(33, 14);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(compressed.length, 20);
    record.writeUInt32LE(data.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(offset, 42);
    central.push(record, name);
    offset += header.length + name.length + compressed.length;
  }
  const directory = Buffer.concat(central),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50);
  end.writeUInt16LE(Object.keys(entries).length, 8);
  end.writeUInt16LE(Object.keys(entries).length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}
export function unzip(data) {
  let end = data.length - 22;
  while (
    end >= Math.max(0, data.length - 65557) &&
    data.readUInt32LE(end) !== 0x06054b50
  )
    end--;
  if (end < 0) throw Error("Invalid XLSX ZIP");
  let cursor = data.readUInt32LE(end + 16);
  const entries = {};
  for (let i = 0; i < data.readUInt16LE(end + 10); i++) {
    if (data.readUInt32LE(cursor) !== 0x02014b50)
      throw Error("Invalid ZIP directory");
    const method = data.readUInt16LE(cursor + 10),
      size = data.readUInt32LE(cursor + 20),
      nameLength = data.readUInt16LE(cursor + 28),
      extra = data.readUInt16LE(cursor + 30),
      comment = data.readUInt16LE(cursor + 32),
      position = data.readUInt32LE(cursor + 42);
    const name = data
      .subarray(cursor + 46, cursor + 46 + nameLength)
      .toString();
    const start =
      position +
      30 +
      data.readUInt16LE(position + 26) +
      data.readUInt16LE(position + 28);
    const compressed = data.subarray(start, start + size);
    const value =
      method === 8
        ? inflateRawSync(compressed, { maxOutputLength: 8 * 1024 * 1024 })
        : method === 0
          ? compressed
          : null;
    if (!value || crc32(value) !== data.readUInt32LE(cursor + 16))
      throw Error("Unsupported or damaged workbook");
    entries[name] = value.toString("utf8");
    cursor += 46 + nameLength + extra + comment;
  }
  return entries;
}
export const column = (index) => {
  let n = index + 1,
    result = "";
  while (n) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
};
const xml = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
export function worksheet(rows) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane xSplit="1" ySplit="4" topLeftCell="B5" activePane="bottomRight" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="200" width="13" customWidth="1"/></cols><sheetData>${rows.map((cells, r) => `<row r="${r + 1}">${cells.map((value, c) => (typeof value === "number" ? `<c r="${column(c)}${r + 1}" s="${r >= 4 && c > 0 ? 1 : 0}"><v>${value}</v></c>` : `<c r="${column(c)}${r + 1}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`)).join("")}</row>`).join("")}</sheetData></worksheet>`;
}
export function workbook(sheets) {
  const entries = {
    "[Content_Types].xml": `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    "_rels/.rels":
      '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="styles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml":
      '<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf fontId="0" fillId="0" borderId="0"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
  };
  sheets.forEach(
    (s, i) => (entries[`xl/worksheets/sheet${i + 1}.xml`] = worksheet(s.rows)),
  );
  return zip(entries);
}
export function numericCells(xml) {
  const cells = {};
  for (const match of xml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const ref = /\br="([A-Z]+\d+)"/.exec(match[1])?.[1],
      type = /\bt="([^"]+)"/.exec(match[1])?.[1];
    if (!ref || (type && type !== "n")) continue;
    const value = /<v>([^<]+)<\/v>/.exec(match[2] ?? "")?.[1];
    if (value !== undefined && Number.isFinite(Number(value)))
      cells[ref] = Number(value);
  }
  return cells;
}
