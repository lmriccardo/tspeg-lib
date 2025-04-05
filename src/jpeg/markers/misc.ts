import { COMMON_MARKERS, JPGMarker } from "./base";

/**
 * The SOI JPEG Marker - Start Of Image (0xFFD8)
 * 
 * It defines the start of an image and it must be present in the first two bytes
 * of the input byte buffer of the image. It does not define a marker segment since
 * there are no data attached to it.
 */
export class JPEG_SOIMarker extends JPGMarker 
{
  constructor(buffer: Uint8Array) {
    super('SOI - Start Of Image', COMMON_MARKERS.SOI_MARKER, buffer);
    this.decodeSync();
  }
  
  decodeSync(): void { this.length = 2; }
  override toString(): string { return super.toString(); }
}

/**
 * The EOI JPEG Marker - End Of Image Marker (0xFFD9) 
 * 
 * It defines the end of the image and must be place at the end of the buffer. Like the
 * SOI marker it does not define a segment since there are no releated data.
 */
export class JPEG_EOIMarker extends JPGMarker 
{
  constructor(buffer: Uint8Array) {
    super('EOI - End Of Image', COMMON_MARKERS.EOI_MARKER, buffer);
    this.decodeSync();
  }

  decodeSync(): void { this.length = 2; }
  override toString(): string { return super.toString(); }
};

/**
 * The APPn JPG Marker - Application Marker (0xFFEn).
 * 
 * The APPn segments are reserved for application use. Since these segments may
 * be defined differently for different applications, the class is left abstract.
 */
abstract class JPEG_APPnMarker extends JPGMarker
{
  constructor(buffer: Uint8Array, code: number) {
    super('APPn - Applicaion Marker', code, buffer);
  }

  abstract decodeSync(): void;
  override toString(): string { return super.toString(); }
}

/**
 * A specific version of the APPn Marker Segment for the JFIF format.
 * 
 * In the JPEG File Interchange Format (JFIF), immediately after the SOI marker,
 * therefore at the third byte, there must be an APP0 (Application-0) data segment.
 * It is mostly used to add information not available in the standard JPEG format.
 */
export class JPEG_APP0Marker extends JPEG_APPnMarker
{
  private identifier  : string; // A zero terminated string uniquely identifying the marker
  private version     : number; // The version (MSB = major, LSB = minor)
  private units       : number; // Units for the X and Y densities.
  private x_density   : number; // Horizontal pixel density
  private y_density   : number; // Vertical pixel density
  private x_thumbnail : number; // Thumbnail horizontal pixel count
  private y_thumbnail : number; // Thumbnail vertical pixel count

  private rgb_n : [number,number,number][]; // Packet (24-bit) RGB values for the thumbnail
 
  constructor(buffer: Uint8Array) { 
    super(buffer, COMMON_MARKERS.APP0_MARKER);

    // Initialize all the values
    this.identifier  = 'JFIF';
    this.version     = 0;
    this.units       = 0;
    this.x_density   = 0;
    this.y_density   = 0;
    this.x_thumbnail = 0;
    this.y_thumbnail = 0;
    this.rgb_n       = [];

    this.decodeSync();
  }
  
  decodeSync(): void {
    this.version = this.buffer.readUInt16BE(9); // Read the version (skips the identifier)
    this.units = this.buffer.readUInt8(11); // Read the units for X and Y
    this.x_density = this.buffer.readUInt16BE(12); // Read the X density
    this.y_density = this.buffer.readUInt16BE(14); // Read the Y density
    this.x_thumbnail = this.buffer.readUInt8(16); // Read the horizontal pixel count
    this.y_thumbnail = this.buffer.readUInt8(17); // Read the vertical pixel count

    // From this point up to the end we need to take the RGB triplets
    for (let byte_idx = 18; byte_idx < this.length - 2; byte_idx += 3) {
      const red_value = this.buffer.readUInt8(byte_idx);
      const green_value = this.buffer.readUInt8(byte_idx + 1);
      const blue_value = this.buffer.readUInt8(byte_idx + 2);
      this.rgb_n.push([red_value, green_value, blue_value]);
    }
  }

  static unitsToString(unit: number) : string {
    return ({
      0 : 'No units - X and Y specify the pixel aspect ratio',
      1 : 'X and Y are dots per inch',
      2 : 'X and Y are dots per cm'
    } as {[key: number]: string})[unit];
  }

  override toString(): string {
    const summary = super.toString(); // Take the base string from the parent class

    // Format the version string with major and minor
    const major_v = this.version >> 8;
    const minor_v = this.version & ~(major_v << 8);
    const informations = (
      `|  - Identifier              : ${this.identifier}\n`                             + 
      `|  - Version                 : v${major_v}.${minor_v}\n`                         +
      `|  - Units                   : ${JPEG_APP0Marker.unitsToString(this.units)}\n`   +
      `|  - X Pixel Density         : ${this.x_density}\n`                              +
      `|  - Y Pixel Density         : ${this.y_density}\n`                              +
      `|  - Thumbnail X pixel count : ${this.x_thumbnail}\n`                            +
      `|  - Thumbnail Y pixel count : ${this.y_thumbnail}`
    );

    return summary + '\n' + informations;
  }
}