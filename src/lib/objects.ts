export function getAllValues(obj: Record<string, unknown>): unknown[] {
  const values: unknown[] = [];
  const stack: Record<string, unknown>[] = [obj]; // Initialize the stack with the root object

  while (stack.length > 0) {
    const currentObj = stack.pop(); // Get the last object from the stack

    for (const key in currentObj) {
      if (Object.prototype.hasOwnProperty.call(currentObj, key)) {
        const value = currentObj[key];
        if (typeof value === 'object' && value !== null) {
          stack.push(value as Record<string, unknown>); // Push the object onto the stack for further processing
        } else {
          values.push(value); // Push the value if it's not an object
        }
      }
    }
  }

  return values;
}
