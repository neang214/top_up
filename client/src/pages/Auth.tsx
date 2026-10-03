import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Diamond } from "../components/icons";
import { errorMessage } from "../lib/format";
import { btn, inputClass } from "../lib/ui";
import { useAuthService } from "../services/auth.service";

export default function Auth({ mode }: { mode: "login" | "register" }) {
    const isRegister = mode === "register";
    const user = useAuthService((s) => s.userInfo);
    const isLoading = useAuthService((s) => s.isLoading);
    const login = useAuthService((s) => s.login);
    const register = useAuthService((s) => s.register);
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? "/";

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    if (user) return <Navigate to={from} replace />;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            if (isRegister) await register({ name: name.trim(), email: email.trim(), password });
            else await login({ email: email.trim(), password });
            navigate(from, { replace: true });
        } catch (err) {
            setError(
                errorMessage(err, isRegister ? "We couldn’t create your account. Try again." : "We couldn’t log you in. Try again."),
            );
        }
    };

    return (
        <div className="mx-auto grid max-w-md px-4 py-14">
            <div className="mb-8 text-center">
                <Diamond className="mx-auto text-accent" width={36} height={36} />
                <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">
                    {isRegister ? "Create your account" : "Welcome back"}
                </h1>
                <p className="mt-2 text-dim">
                    {isRegister
                        ? "Keep every top-up in one place. You can still check out without an account."
                        : "Log in to see your orders."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-line bg-surface p-6">
                {isRegister && (
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold">Name</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                            required
                            className={inputClass}
                        />
                    </label>
                )}
                <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        className={inputClass}
                    />
                </label>
                <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={isRegister ? "new-password" : "current-password"}
                        required
                        className={inputClass}
                    />
                </label>

                {error && (
                    <p role="alert" className="text-sm font-medium text-danger">
                        {error}
                    </p>
                )}

                <button type="submit" disabled={isLoading} className={`${btn("primary", "lg")} w-full`}>
                    {isLoading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-dim">
                {isRegister ? "Already have an account?" : "New here?"}{" "}
                <Link
                    to={isRegister ? "/login" : "/register"}
                    state={location.state}
                    className="font-semibold text-accent-text underline underline-offset-4"
                >
                    {isRegister ? "Log in" : "Create an account"}
                </Link>
            </p>
        </div>
    );
}
