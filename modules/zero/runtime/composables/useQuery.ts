import type { TableSchema, Query, QueryType } from "@rocicorp/zero"
import type { AdvancedQuery } from "@rocicorp/zero/advanced";
import cloneDeep from "lodash/cloneDeep";

type UnwrapMaybeRefOrGetter<T> =
  T extends MaybeRefOrGetter<infer U> ? U : never;


export default function useQuery<
  TSchema extends TableSchema,
  TReturn extends QueryType,
>(
  q: MaybeRefOrGetter<Query<TSchema, TReturn>>,
  enable = true
) {
  const z = useZero()

  const data = ref<
    Parameters<
      Parameters<
        ReturnType<
          UnwrapMaybeRefOrGetter<typeof q>['materialize']
        >['addListener']
      >[0]
    >[0]
  >()

  watchEffect((cleanup) => {
    if (!z) {
      return
    }

    const qAdvanced = toValue(q) as AdvancedQuery<TSchema, TReturn>

    const hash = qAdvanced.hash() + z.clientID

    const view = qAdvanced.materialize()
    data.value = view.data === undefined
      ? view.data
      : (cloneDeep(view.data as any));

    view.addListener((snap) => {
      data.value = snap === undefined
        ? snap
        : (cloneDeep(snap));
    })

    cleanup(() => {
      console.log('watchEffect cleanup')
      view.destroy()
    })
  })

  return data
}
