import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

async function login(formData: FormData) {
  "use server";
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/panel",
    });
  } catch (error) {
    if (error instanceof AuthError) redirect("/login?error=1");
    throw error;
  }
}

async function LoginError({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p role="alert" className="text-sm text-red-700">
      Correo o contraseña incorrectos.
    </p>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">Taller Bottega</h1>
      <p className="mt-1 text-stone-500">Inicia sesión para continuar</p>

      <form action={login} className="mt-8 space-y-4">
        <label className="block">
          <span className="text-sm">Correo</span>
          <input name="email" type="email" required className="mt-1 w-full rounded border px-3 py-2" />
        </label>
        <label className="block">
          <span className="text-sm">Contraseña</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <Suspense>
          <LoginError searchParams={searchParams as Promise<{ error?: string }>} />
        </Suspense>
        <button type="submit" className="w-full rounded bg-stone-900 px-3 py-2 text-white">
          Entrar
        </button>
      </form>
    </main>
  );
}
