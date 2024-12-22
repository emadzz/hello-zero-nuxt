import type { Zero, createSchema } from '@rocicorp/zero'

export default function useZero<
  S extends ReturnType<typeof createSchema>
>() {
  const { $z } = useNuxtApp()
  return $z as Zero<S>
}
