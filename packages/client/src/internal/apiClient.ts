export type HandleFetchArgs = {
  path?: string;
  domain?: string;
  data?: Record<string, unknown>;
};

const getApiUrl = () => {
  try {
    return process.env.API_URL;
  } catch {
    return "https://api.samepage.network";
  }
};

const handleFetch = <T extends Record<string, unknown> = Record<string, never>>(
  transformArgs: (...info: [URL, RequestInit]) => Parameters<typeof fetch>,
  {
    method,
    path,
    domain,
  }: Pick<RequestInit, "method"> & Omit<HandleFetchArgs, "data">
) => {
  const url = new URL(`${domain || getApiUrl()}/${path}`);
  return fetch(
    ...transformArgs(url, {
      method,
    })
  ).then((r) => {
    if (!r.ok) {
      return r.text().then((e) => Promise.reject(new Error(e)));
    } else if (r.status === 204) {
      return {} as T;
    }
    return r
      .json()
      .then((r) => r as T)
      .catch(() => Promise.reject(r.text()));
  });
};

const handleUrlFetch =
  (method: "GET" | "DELETE") =>
  <T extends Record<string, unknown> = Record<string, never>>(
    args: string | HandleFetchArgs,
    _data?: Record<string, unknown>
  ) => {
    const { data = {}, ...fetchArgs } =
      typeof args === "string" ? { path: args, data: _data } : args;

    return handleFetch<T>((url, init) => {
      Object.entries(data).forEach(([k, v]) =>
        url.searchParams.set(k, v as string)
      );
      return [
        url,
        {
          ...init,
          method,
        },
      ];
    }, fetchArgs);
  };

const handleBodyFetch =
  (method: "POST" | "PUT") =>
  <T extends Record<string, unknown> = Record<string, never>>(
    args: string | HandleFetchArgs,
    _data?: Record<string, unknown>
  ) => {
    const { data, ...fetchArgs } =
      typeof args === "string" ? { path: args, data: _data } : args;

    const body = JSON.stringify(data || {});

    return handleFetch<T>(
      (url, init) => [
        url,
        {
          ...init,
          body,
          headers: {
            "Content-Type": "application/json",
          },
          method,
        },
      ],
      fetchArgs
    );
  };

export const apiPost = handleBodyFetch("POST");

export const apiGet = handleUrlFetch("GET");

const apiClient = <T extends Record<string, unknown>>(
  data: Record<string, unknown> = {}
) =>
  apiPost<T>({
    path: "page",
    data,
  });

export default apiClient;
