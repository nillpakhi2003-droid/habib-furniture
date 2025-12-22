"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminLoginAction } from "./actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold text-3xl inline-block">
              Habib Furniture
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to continue
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-sm border"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);

            startTransition(async () => {
              const res = await adminLoginAction(formData);

              if (res.ok) {
                router.push("/admin/dashboard");
                router.refresh();
              } else {
                const messages = {
                  INVALID_CREDENTIALS: "Invalid phone or password",
                  NOT_ALLOWED: "You do not have admin access",
                  INVALID_INPUT: "Phone and password are required (min 8 chars)",
                };
                alert(messages[res.error] || "Login failed");
              }
            });
          }}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                required
                disabled={pending}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-60"
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={pending}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-60"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-red-700 disabled:opacity-60 transition"
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-red-600">
              ← Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
