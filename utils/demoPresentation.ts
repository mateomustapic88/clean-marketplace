const demoPrefix = /^\s*\[DEMO\]\s*/i

export const demoDisplayText = (value: string, isDemo: boolean): string =>
  isDemo ? value.replace(demoPrefix, '') : value

export const demoDisplayName = (
  firstName: string,
  lastName: string,
  isDemo: boolean,
): string => demoDisplayText(`${firstName} ${lastName}`.trim(), isDemo)
