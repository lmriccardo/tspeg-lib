import { SyncDecodable, Printable } from "../base";
import { BitStream } from "../../utils/bitutil";

/**
 * Common markers defined for JPEG images. This list does not include also markers
 * that can have different last values, like SOF markers or generic APP markers.
 */
export const COMMON_MARKERS: {[key: string] : number} = 
{
  SOI_MARKER  : 0xFFD8, // Start Of Image Marker
  APP0_MARKER : 0xFFE0, // Application 0 (JFIF-specific) marker
  DQT_MARKER  : 0xFFDB, // Define Quantization Table Marker
  DHT_MARKER  : 0xFFC4, // Define Huffman Table Marker
  SOS_MARKER  : 0xFFDA, // Define the Start Of Scan Marker
  DNL_MARKER  : 0xFFDC, // Define Number of lines Marker
  EOI_MARKER  : 0xFFD9  // End Of Image Marker
};

/**
 * This class represents a generic JPEG Marker. As expected it is a synchronous
 * decodable and printable object. In particular its string representation is
 * composed of the name of the Marker, its code and the length in bytes of the
 * corresponding Marker segment.
 * 
 * As expected it takes as input the name of the marker, its code and the ByteBuffer.
 */
export abstract class JPGMarker extends SyncDecodable implements Printable 
{
  protected name   : string;    // The name of the marker
  protected code   : number;    // The corresponding code 0xFFxy
  protected length : number;    // The length of the marker (length + 2)
  protected buffer : BitStream; // The buffer containing the marker

  constructor(name: string, code: number, buffer: Uint8Array) {
    super();
    this.name = name;
    this.code = code;
    this.buffer = BitStream.from(buffer);

    // We need to read the length if it is present in the buffer
    if (this.buffer.length >= 4) {
      this.length = this.buffer.readUInt16BE(2) + 2;
    } else {
      this.length = 2;
    }
  }

	/**
	 * Returns the length of the marker.
	 */
  public get markerLength(): number { return this.length; }

  abstract decodeSync(): void; // Decode the marker
  
  toString(): string {
    // Returns a string summarizing the marker values

		const string_repr = (
			'|' + '-'.repeat(100) + '|\n' +
			`| Marker ${this.name} < ${this.code.toString(16)} >` +
			`${this.length} bytes`
		);
    
		return string_repr;
  }
};

/**
 * This abstract class represents a generic Marker defining a Table (Quantization, Huffman or
 * Arithmetic). It extends JPGMarker and defines two new methods: identifier and destination.
 * That's because, each table in JPEG specification must have its unique identifier and
 * destination, that will be used when referenced in other part of the images.
 */
export abstract class JPG_TableMarker extends JPGMarker {
  abstract get identifier(): number;
  abstract get destination(): number;
}

/**
 * This abstract class represents an aggregation of generic table markers. Some JPEG Markers
 * like DHT or DQT defines, in a single segment, multiple tables each uniquely identified
 * by the destination parameter. That's because, once a table has been defined for a
 * particular destination, it overwrites the previously associated one.
 * 
 * It is, essentially, a collection of markers of the same type, which is defined by the
 * generic parameter T and the input to the constructor, i.e., the constructor function
 * of the specific Table marker.
 */
export class TableMarkerAggregator<T extends JPG_TableMarker> implements Printable 
{
  protected markers : Record<number, T> = {};
  protected size    : number 					  = 0;

  private readonly markerConstructor: new (buffer: BitStream) => T;

  constructor(markerConstructor: new (buffer: BitStream) => T) {
    this.markerConstructor = markerConstructor;
  }

  /**
	 * Given an input buffer for a generic table marker, it extract N specific table
	 * markers and add them all to the collection.
	 * 
	 * @param buffer The buffer with the Table Marker Segment
	 * @returns The total length that has been read during the decoding
	 */
  addMarker(buffer: Uint8Array) : number {
    const bbuffer = BitStream.from(buffer); // Uses the Buffer class for better reading
    const position = 2; // Starts the reading from its length
    let length = bbuffer.readUInt16BE(position) - 2;

    let current_pos = position + 2;
    let start_buffer = bbuffer.subarray(current_pos);
    while (length > 0) {
      const marker = new this.markerConstructor(start_buffer);
      this.markers[marker.identifier] = marker;
      this.size++;
      length -= marker.markerLength - 4;
      current_pos = current_pos + marker.markerLength - 4;
      start_buffer = bbuffer.subarray(current_pos)
    }
    
    return current_pos;
  }

	/**
	 * Returns the total number of markers in the collection.
	 */
  public get nofMarkers() : number { return this.size; }
  
  /**
	 * Get a marker using its identifier. If the specific marker is not present
	 * than it raises an exception.
	 * 
	 * @param identifier The input identifier for the marker
	 * @returns The marker, if it exists in the collection.
   * @throws Error If the input identifier is not a key in the record.
   */
  public getMarker(identifier: number) : T {
    if (!(identifier in this.markers)) throw new Error('getMarker:NoSuchRecordKey');
    return this.markers[identifier];
  }

  toString(): string {
    const marker_str = Object.values(this.markers).map(
      (value: T) : string => value.toString());

    return marker_str.join('\n');
  }
};