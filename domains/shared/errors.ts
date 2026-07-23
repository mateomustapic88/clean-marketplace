export class DomainError<TCode extends string = string> extends Error {
  readonly code: TCode

  constructor(code: TCode, message?: string) {
    super(message ?? code)
    this.name = 'DomainError'
    this.code = code
  }
}
