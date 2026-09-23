import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Criar conta · Lumo",
  description: "Crie sua conta Lumo",
};

export default function SignupPage() {
  return <SignupForm />;
}
