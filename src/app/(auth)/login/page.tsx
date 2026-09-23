import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Entrar · Lumo",
  description: "Acesse sua conta Lumo",
};

export default function LoginPage() {
  return <LoginForm />;
}
