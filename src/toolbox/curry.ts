// Snippet by Jamie Pennell
// https://medium.com/codex/currying-in-typescript-ca5226c85b85

type PartialParameters<FN extends (...args: any[]) => any> = Partial<
  Parameters<FN>
>;

type PartialTuple<TUPLE extends any[], EXTRACTED extends any[] = []> =
  // If the tuple provided has at least one required value
  TUPLE extends [infer NEXT_PARAM, ...infer REMAINING]
    ? // recurse back in to this type with one less item
      // in the original tuple, and the latest extracted value
      // added to the extracted list as optional
      PartialTuple<REMAINING, [...EXTRACTED, NEXT_PARAM?]>
    : // else if there are no more values,
      // return an empty tuple so that too is a valid option
      [...EXTRACTED, ...TUPLE];

type RemainingParameters<PROVIDED extends any[], EXPECTED extends any[]> =
  // if the expected array has any required items…
  EXPECTED extends [infer E1, ...infer EX]
    ? // if the provided array has at least one required item,
      // recurse with one item less in each array type
      PROVIDED extends [infer P1, ...infer PX]
      ? RemainingParameters<PX, EX>
      : // else the remaining args is unchanged
        EXPECTED
    : // else there are no more arguments
      [];

type CurriedFunctionOrReturnValue<
  PROVIDED extends any[],
  FN extends (...args: any[]) => any,
> =
  RemainingParameters<PROVIDED, Parameters<FN>> extends [any, ...any[]]
    ? CurriedFunction<PROVIDED, FN>
    : ReturnType<FN>;

type CurriedFunction<
  PROVIDED extends any[],
  FN extends (...args: any[]) => any,
> = <
  NEW_ARGS extends PartialTuple<RemainingParameters<PROVIDED, Parameters<FN>>>,
>(
  ...args: PartialTuple<RemainingParameters<PROVIDED, Parameters<FN>>>[]
) => CurriedFunctionOrReturnValue<[...PROVIDED, ...NEW_ARGS], FN>;

export default function curry<
  FN extends (...args: any[]) => any,
  STARTING_ARGS extends PartialParameters<FN>,
>(
  targetFn: FN,
  ...existingArgs: PartialParameters<FN>[]
): CurriedFunction<STARTING_ARGS, FN> {
  return function (...args) {
    const totalArgs = [...existingArgs, ...args];
    if (totalArgs.length >= targetFn.length) {
      return targetFn(...totalArgs);
    }
    return curry(targetFn, ...(totalArgs as PartialParameters<FN>));
  };
}
