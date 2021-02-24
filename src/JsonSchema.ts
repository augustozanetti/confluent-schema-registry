import { Schema, JsonOptions, ConfluentSchema } from './@types'
import Ajv, { DefinedError, ValidateFunction } from 'ajv'

export default class JsonSchema implements Schema {
  private validate: ValidateFunction

  constructor(schema: ConfluentSchema, opts?: JsonOptions) {
    this.validate = this.getJsonSchema(schema, opts)
  }

  private getJsonSchema(schema: ConfluentSchema, opts?: JsonOptions) {
    const ajv = new Ajv(opts)
    const validate = ajv.compile(JSON.parse(schema.schemaString))
    return validate
  }

  private validatePayload(payload: any) {
    const errors: Array<string> = []
    if (!this.isValid(payload, { errorHook: path => errors.push(path.join()) })) {
      throw Error(errors.join(','))
    }
  }

  public toBuffer(payload: object): Buffer {
    this.validatePayload(payload)
    return Buffer.from(JSON.stringify(payload))
  }

  public fromBuffer(buffer: Buffer): any {
    const payload = JSON.parse(buffer.toString())
    this.validatePayload(payload)
    return payload
  }

  public isValid(
    payload: object,
    opts?: { errorHook: (path: Array<string>, value: any, type?: any) => void },
  ): boolean {
    if (!this.validate(payload)) {
      if (opts?.errorHook) {
        for (const err of this.validate.errors as DefinedError[]) {
          opts.errorHook([err.dataPath], err.data, err.schema)
        }
      }
      return false
    }
    return true
  }
}
