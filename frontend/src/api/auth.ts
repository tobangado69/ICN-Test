import type { User, LoginInput, RegisterInput, LoginResponse } from "../types/user";
import { api } from "./client";

export async function login(input: LoginInput): Promise<LoginResponse> {
  return api<LoginResponse>("/users/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function register(input: RegisterInput): Promise<User> {
  return api<User>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
