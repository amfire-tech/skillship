import { useQuery, useMutation, type UseQueryOptions, type UseMutationOptions } from "@tanstack/react-query";
import { api } from "@/lib/api";

// ============================================================
// useApi — TanStack Query wrappers over API client.
// Server state goes through these hooks, not raw api calls.
//
// Usage:
//   const { data } = useApiQuery<User[]>(["users"], "/users");
//   const { mutate } = useApiMutation<User>("/users");
// ============================================================

export function useApiQuery<T>(
  queryKey: string[],
  url: string,
  params?: Record<string, unknown>,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">
) {
  return useQuery<T>({
    queryKey,
    queryFn: () => api.get<T>(url, params),
    ...options,
  });
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  url: string,
  method: "post" | "put" | "patch" | "delete" = "post",
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (variables) => {
      if (method === "delete") return api.delete<TData>(url);
      return api[method]<TData>(url, variables);
    },
    ...options,
  });
}
