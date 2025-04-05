import { BitGenerator } from "../utils/bitutil";

/**
 * Represents a single node in the Huffman Tree. Each node will have two children.
 * The left child is always reachable using a 0 input, while 1 for the rigth one.
 * Moreover, a node is a leaf in the corresponding tree if it has a symbol not null
 */
export class HuffmanNode {
  private left   : HuffmanNode | null = null; // The left child
  private rigth  : HuffmanNode | null = null; // The rigth child
  private symbol : number | null      = null; // The optional symbol 

  constructor(symbol?: number) {
    this.symbol = symbol ?? null;
  }

  private validateInput(bit: number) {
    if (bit < 0 || bit > 1) throw new Error(
      '[HuffmanNode:setNextNode:InvalidInput] Possible inputs are 0 or 1 ' +
      `given input is ${bit}`);
  }

  /**
   * Depending on the input bit (0/1) it will creates the
   * corresponding child for the current node.
   * 
   * @param bit The input bit value
   * @throws Error if the input value is different from 0 or 1
   */
  setNextNode(bit: number) {
    this.validateInput(bit);
    if (bit === 0 && !this.left) { this.left = new HuffmanNode() } 
    else if (bit === 1 && !this.rigth) { this.rigth = new HuffmanNode() }
  }

  /**
   * Returns the corresponding node given the input value
   * @param bit The input bit either 0 or 1
   * @returns The corresponding Huffman Node if exists, Null otherwise
   */
  getNextNode(bit: number) : HuffmanNode | null {
    this.validateInput(bit);

    switch (bit) {
      case 0: return this.left;
      case 1: return this.rigth;
      default: return null;
    }
  }

  /**
   * Sets the corresponding symbol to the node
   * @param symbol The input value for the symbol
   */
  setSymbol(symbol: number) {
    // First we need to check that the symbol has not already
    // been set before. Otherwise, raise an error
    if (this.symbol) throw new Error('[HuffmanNode:setSymbol:AlreadyExists] ' +
      `Impossible to set a new symbol, since already exists: ${this.symbol}`);

    this.symbol = symbol;
  }

  /**
   * Returns the symbol associated with the Node.
   * @returns A value if the symbol exists, Null otherwise
   */
  getSymbol() : number | null { return this.symbol; }

  /**
   * Check if the current node is a leaf node or not.
   * @returns True or False
   */
  isLeaf() : boolean { return this.symbol != null; }
}

/**
 * The Huffman Tree used for decoding/encoding. Notes that this tree works
 * for JPEG images, since it is created starting from the HuffmanTable
 * specification. 
 */
export class JPEGHuffmanTree {
  private bits    : number[] = []; // Each element is the number of symbols for that not bits
  private symbols : number[] = []; // Symbols associated to each code
  private codes   : number[] = []; // All possible codes for each bit length
  
  private root: HuffmanNode = new HuffmanNode(); // The root node of the tree

  private generateCodes(bits: number[]) {
    let curr_code = 0; // Initialize the current code to 0  
    
    for (let bit_idx = 0; bit_idx < bits.length; bit_idx++) {
      const bit_count = bits[bit_idx];

      // If there are codes for that number of bits
      if (bit_count > 0) {
        for (let idx = 0; idx < bit_count; idx++) {
          this.codes.push(curr_code);
          curr_code++;
        }
      } else {
        this.codes.push(-1);
      }

      curr_code <<= 1;
    }
  }

  private buildHuffmanTree() {
    let [symbols_index, codes_index] = [0, 0];
    let curr_node = this.root;

    for (let bits_idx = 0; bits_idx < this.bits.length; bits_idx++) {
      const bit_len = bits_idx + 1;

      // If there are no codes for the current number of bits
      if (this.bits[bits_idx] === 0) {
        codes_index++;
        continue;
      }

      // Otherwise, there are codes that needs to be added to the tree
      for (let counter = 0; counter < this.bits[bits_idx]; counter++) {
        const curr_code = this.codes[codes_index + counter];
        const curr_symbol = this.symbols[codes_index + counter];

        // Traverse the tree and add new nodes to it
        for (let i = bit_len - 1; i > -1; i--) {
          const bit = (curr_code >> i) & 1;
          curr_node.setNextNode(bit);
          curr_node = curr_node.getNextNode(bit)!;
        }

        curr_node.setSymbol(curr_symbol);
        curr_node = this.root;
      }

      codes_index += this.bits[bits_idx];
      symbols_index += this.bits[bits_idx];
    }
  }

  /**
   * Generate the Huffman Tree given the input vectors BITS and symbols.
   * In the context of JPEG images, the huffman tree is generated starting
   * from the definition of the Huffman Table which gives the BITS vector
   * and the HUFFVAL (symbols) vector. 
   * 
   * @param bits    A vector of length 16, each element is the number of symbols for that size
   * @param symbols The symbols associated with each length
   */
  buildTree(bits: number[], symbols: number[]) {
    this.bits = bits;
    this.symbols = symbols;
    
    // Generate the codes for the input bits and symbols
    // and then build the HuffmanTree.
    this.generateCodes(bits);
    this.buildHuffmanTree();
  }

  /**
   * Decodes the input code and returns the corresponding symbol
   * by diving into the current Huffman Tree.
   * 
   * @param code The input code to be decoded
   * @returns The corresponding symbol
   */
  decode(code: number) : number | null {
    let curr_node: HuffmanNode | null = this.root;

    for (const bit of BitGenerator(code, true)) {
      curr_node = curr_node!.getNextNode(bit);
      if (!curr_node) return null;
    }

    if (!curr_node.isLeaf()) return null;
    return curr_node.getSymbol();
  }
}