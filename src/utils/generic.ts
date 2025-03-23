/**
 * Converts a vector to a string representation
 * 
 * @param values 			 The actual vector with values 
 * @param x_dim 			 The total number of values in a single row
 * @param line_prefix  A prefix that preceed each row
 * 
 * @returns The vector string representation
 */
export const VectorToString = (values: number[], x_dim: number, line_prefix: string): string => 
{
  let string_result = '[';
  for (let index = 0; index < values.length; index++) {
    if (index % x_dim == 0 && index > 0) {
      string_result = string_result + `\n${line_prefix}`;
    }

    if (index < values.length - 1) {
      string_result += `${values[index]}, `;
      continue;
    }

    string_result += `${values[index]}`;
  }

  return string_result + ']';
}

/**
 * Split the input value into two numbers. This is useful when splitting a single byte
 * into two 4-bits value, or a single 2-byte value into two bytes. That is given a
 * value X it will generate Y, Z such that Y is composed of N MSB while Z by the
 * remaining bits.
 * 
 * @param value The value that will be splitted
 * @param size  Where to split the value (in terms of bits)
 * 
 * @returns Y and Z values generated by splitting X
 */
export const SplitByte = (value: number, size: number = 4): [number, number] => 
{
  const value1 = value >> size;
  const value2 = value & ~(value1 << size);
  return [value1, value2];
}

/**
 * This class represents a BitStream. It contains a buffer of bytes
 * and methods used to yield next bit in the input stream. In
 * particular, this class extends the Buffer class just implementing
 * methods for extracting bits from the buffer
 */
export class BitStream extends Buffer {
  private position: number = 0;
  private currByte: number = 0;
  private byteCounter: number = 0;

  /**
   * This methods returns the next bit to be read. This method has the side
   * effect of increasing the position attribute if the current byte has
   * been fully read.
   * 
   * @returns The next bit
   */
  getNextBit(): number {
    if (this.byteCounter === 0) {
      // First we need to check for Out Of Bound position
      if (this.position + 1 >= this.length) throw new Error(
        '[BitStream:getNextBit:IndexOverflow] No more bytes to read.');

      this.position++; // Update the position
      this.byteCounter = 8; // Reset the byte counter to be 8
      this.currByte = super.readUInt8(this.position); // Read the next byte
    }

    const bit = this.currByte >> 7;
    this.byteCounter--;
    this.currByte = (this.currByte << 1) & 0xFF;
    return bit;
  }

  /**
   * Reads N bytes from the buffer starting from a given offset, 
   * or from the current position if offset is null or undefined.
   * Updates the position if the offset is not given.
   *  
   * @param n The number of bytes to be read.
   * @return The value corresponding to byte read
   */
  readBytes(n: number, offset?: number, le: boolean = false): number {
    const curr_position = offset ?? this.position;

    // Check if the current position plus the number of bytes to read
    // does not overflow the buffer dimension
    if (curr_position + n >= this.length) throw new Error(
      '[BitStream:readBytes:BufferOverflow] Impossible to read input bytes.');

    let curr_result = 0;
    const wrap = le ? n - 1 : 0;
    for (let idx = 0; idx < n; idx++) {
      const position = (le ? 1 : -1) * (wrap - idx); // Handle LE ordering
      curr_result = (curr_result << 8) | super.readUInt8(curr_position + position);

      if (curr_result > Number.MAX_SAFE_INTEGER) {
        throw new Error('[BitStream:readBytes:MaxIntegerReached] Maximum safe ' +
          'integer has been reached. Unable to continue.');
      }
    }

    this.position = offset ? this.position : this.position + n;
    return curr_result;
  }

  /**
   * Returns the next byte from the current position.
   * It does not update the position
   * @returns The next byte
   */
  getNextUInt8(): number {
    return this.readBytes(1, this.position);
  }

  /**
   * Returns the next short from the current position (Big-Endian)
   * It does not update the position
   * @returns The next short
   */
  getNextUInt16BE(): number {
    return super.readUInt16BE(this.position);
  }

  /**
   * Read a single byte from the input offset if given, else from the
   * current position. If the offset is not given, then position is updated.
   * 
   * @param offset The optional offset 
   * @returns The next 8-bit value
   */
  override readUInt8(offset?: number): number {
    return this.readBytes(1, offset);
  }

  /**
   * Read a single short from the buffer starting at input offset, if given,
   * current position otherwise. If the offset is not given, then position is updated.
   * 
   * @param offset The optional offset 
   * @returns The next 16-bit value
   */
  override readUInt16BE(offset?: number): number {
    return this.readBytes(2, offset);
  }
};