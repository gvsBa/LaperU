import { z } from 'zod'

const markupPattern = /[<>]/

export function safeText(options: { max: number; min?: number; optional: true }): z.ZodOptional<z.ZodString>
export function safeText(options: { max: number; min?: number; optional?: false }): z.ZodString
export function safeText(options: { max: number; min?: number; optional?: boolean }): z.ZodString | z.ZodOptional<z.ZodString> {
  let schema = z.string().trim()
  if (options.min !== undefined) schema = schema.min(options.min)
  schema = schema.max(options.max).refine((value) => !markupPattern.test(value), {
    message: 'Teks tidak boleh mengandung markup HTML.',
  })
  return options.optional ? schema.optional() : schema
}
