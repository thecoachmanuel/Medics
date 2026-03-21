export const NG_LOCALE = "en-NG" as const;
export const NG_TIME_ZONE = "Africa/Lagos" as const;

type DateInput = string | number | Date;

const toDate = (input: DateInput): Date => (input instanceof Date ? input : new Date(input));

export const formatDateTimeNG = (
  input: DateInput,
  options?: Intl.DateTimeFormatOptions,
): string => {
  const base: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat(NG_LOCALE, { ...base, ...options, timeZone: NG_TIME_ZONE }).format(
    toDate(input),
  );
};

export const formatDateNG = (input: DateInput, options?: Intl.DateTimeFormatOptions): string => {
  const base: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  };
  return new Intl.DateTimeFormat(NG_LOCALE, { ...base, ...options, timeZone: NG_TIME_ZONE }).format(
    toDate(input),
  );
};

export const formatTimeNG = (input: DateInput, options?: Intl.DateTimeFormatOptions): string => {
  const base: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat(NG_LOCALE, { ...base, ...options, timeZone: NG_TIME_ZONE }).format(
    toDate(input),
  );
};

