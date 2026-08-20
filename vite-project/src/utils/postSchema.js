import { z } from 'zod'

export const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  author: z.string().optional(),
  createdAt: z.string().optional()
})

export const validatePost = (data) => {
  const result = postSchema.safeParse(data)
  if (!result.success) {
    return { ok: false, errors: result.error.format() }
  }
  return { ok: true, data: result.data }
}
