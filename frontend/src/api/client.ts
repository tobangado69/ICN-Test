import axios, { type AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("task_manager_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string }>) => {
    const message =
      err.response?.data?.error ?? err.message ?? "Request failed";
    return Promise.reject(new Error(message));
  },
);

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { method = "GET", body } = options as {
    method?: string;
    body?: string;
  };
  const config = body ? JSON.parse(body as string) : undefined;

  const res = await axiosInstance.request<T>({
    url: path,
    method: (method as "GET" | "POST" | "PUT" | "DELETE") ?? "GET",
    data: config,
  });

  return res.data;
}
