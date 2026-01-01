const crypto = require('crypto');

const MAGIC_KEY = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const createAcceptValue = (key) => crypto.createHash('sha1').update(key + MAGIC_KEY).digest('base64');

const encodeFrame = (str, opcode = 0x1) => {
  const payload = Buffer.from(str);
  const len = payload.length;
  let header;

  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x80 | opcode;
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    const high = Math.floor(len / 2 ** 32);
    const low = len >>> 0;
    header.writeUInt32BE(high, 2);
    header.writeUInt32BE(low, 6);
  }

  return Buffer.concat([header, payload]);
};

const decodeFrame = (buffer) => {
  if (buffer.length < 2) return null;

  const first = buffer[0];
  const second = buffer[1];
  const opcode = first & 0x0f;
  const isMasked = (second & 0x80) === 0x80;
  let len = second & 0x7f;
  let offset = 2;

  if (len === 126) {
    if (buffer.length < 4) return null;
    len = buffer.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buffer.length < 10) return null;
    const high = buffer.readUInt32BE(2);
    const low = buffer.readUInt32BE(6);
    len = high * 2 ** 32 + low;
    offset = 10;
  }

  let maskingKey;
  if (isMasked) {
    maskingKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }

  let payload = buffer.slice(offset, offset + len);
  if (isMasked) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskingKey[i % 4];
    }
  }

  return { opcode, payload: payload.toString() };
};

module.exports = {
  createAcceptValue,
  encodeFrame,
  decodeFrame,
};
