/**
 * This interface represents a decodable object. It defines two methods for decoding:
 * asynchronous and synchronous decoding. The goal of the decoding is defined 
 * application-purpouse, and it is left to the object that will implements this interface.
 */
export interface Decodable {
  decodeSync() : void;           // A synchronous decode method
  decode()     : Promise<void>;  // The decode asynchronous version
}

/**
 * This interface represnts a printable object. It defines one single method: toString()
 * which returns a comprehensive summary of the state of the object that will
 * implement this interface.
 */
export interface Printable {
  toString() : string;
}

/**
 * This is an abstract class that represents a synchronous decodable object. It
 * implements the Decodable interface leaving the `decodeSync` method as abstract
 * and 'deleting' the asynchronous decode method.
 */
export abstract class SyncDecodable implements Decodable {
  abstract decodeSync(): void;
  decode() : Promise<void> { throw new Error('JPGMarker:decode:NotAvailable') }
}