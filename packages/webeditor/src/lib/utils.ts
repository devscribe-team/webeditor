import { clsx, type ClassValue } from "clsx";
import ms, { StringValue } from "ms";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a wrapped function that will cache the result of the inner function for a specified time.
 * After that time, it will invalidate and call the function again.
 * @param timeToInvalidate Time to invalidate as a vercel ms string.
 */
export function timeCached<Ret, Args extends unknown[]>(
  timeToInvalidate: StringValue,
  callback: (...args: Args) => Ret,
) {
  const millisToInvalidate = ms(timeToInvalidate);
  let lastCall = 0;
  let currentValue: Ret;

  return function (...args: Args) {
    const now = Date.now();
    if (now - lastCall < millisToInvalidate) {
      return currentValue;
    }

    lastCall = now;
    currentValue = callback(...args);

    return currentValue;
  };
}
