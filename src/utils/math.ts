/**
 * Transform the input vector into a matrix of dimension (R,C), where
 * R is the number of rows and C is the number of columns in a zig-zag manner.
 * 
 * EXAMPLE: V = [1,2,...,12] and (R=3, C=4). The resulting matrix will be
 * 
 *     [
 *       [1, 2,  6,  7]
 *       [3, 5,  8, 11],
 *       [4, 9, 10, 12]
 *     ]
 * 
 * @param values The vector with all values to be set in the resulting matrix
 * @param nr     The total number of rows
 * @param nc     The total number of columns
 * 
 * @returns The zigzag matrix
 */
export const ToZigZag = (values: number[], nr: number, nc: number)
  : number[][] => 
{
  // Check if the total number of values can fit the matrix
  if (values.length !== nr * nc) {
    throw new Error('[ToZigZag:InvalidDimension] Input number of values ' +
      `${values.length} do not fit matrix dimension ${nr * nc}.`);
  }

  const zigzag: number[][] = Array.from({ length: nr }, () => Array(nc).fill(0));
  const min_dimension = Math.min(nr - 1, nc - 1); // Take the min dimension

  let direction = -1; // The update position direction
  let element_idx = 0; // Element index inside the input vector

  // At some point we need to switch the way in which we compute the new
  // positions. This is enabled using a drop down flag and the counter
  let drop_down_cnt = (min_dimension % 2 === 0) ? 1 : 2;
  let drop_down_flag = 0;

  // Initial position will always be (0, 0)
  let curr_position = [0, 0];
  let last_curr_pos = curr_position;

  zigzag[0][0] = values[0]; // Initialize the fist position with the first element

  // This loop cycle for all diagonals. If we look at the indexes of the cells
  // belonging to the same diagonal, we can see that their sum is always the same.
  for (let diag_sum = 0; diag_sum < ((nr - 1) + (nc - 1)) + 1; diag_sum++) {
    // If the sum of the indexes of the diagonal is grater then the minimum
    // dimension, then we need to switch otherwise we would go out of bound.
    if (diag_sum > min_dimension && !drop_down_flag) {
      drop_down_flag = 1;
    }

    // Update the current position based on the direction and the drop down flag
    if (((direction > 0) as any) ^ (drop_down_flag)) {
      curr_position = [curr_position[0], curr_position[1] + 1];
    } else {
      curr_position = [curr_position[0] + 1, curr_position[1]];
    }

    // Loop through the current diagonal and assign the values
    for (let idx = 0; idx < diag_sum + 1 - drop_down_flag * drop_down_cnt; idx++) {
      const [r, c] = curr_position;
      zigzag[r][c] = values[element_idx];
      element_idx++;
      last_curr_pos = curr_position;
      curr_position = [curr_position[0] - direction, curr_position[1] + direction];
    }

    // Update the direction based on the parity of the current diagonal sum.
    direction = (-1) ** (diag_sum + 1);

    // Also updates the drop down counter if the sum is less than min dimension
    if (diag_sum > min_dimension) drop_down_cnt += 2;

    curr_position = last_curr_pos;
  }

  return zigzag;
}