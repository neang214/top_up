import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthService } from "../services/auth.service";
import { btn } from "../lib/ui";
import { Diamond } from "./icons";
import ThemeToggle from "./ThemeToggle";

const link = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition-colors sm:px-3 ${
        isActive ? "text-ink" : "text-dim hover:text-ink"
    }`;

export default function Navbar() {
    const user = useAuthService((s) => s.userInfo);
    const logOut = useAuthService((s) => s.logOut);
    const navigate = useNavigate();

    const handleLogOut = async () => {
        await logOut();
        navigate("/");
    };

    return (
        <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
                <Link to="/" className="mr-2 flex items-center gap-2 font-display text-lg font-bold tracking-tight">
                    <Diamond className="text-accent" width={22} height={22} />
                    <span className={user ? "hidden sm:inline" : ""}>TopUp</span>
                </Link>

                <nav className="flex items-center">
                    <NavLink to="/" end className={(s) => `${link(s)} hidden sm:block`}>
                        Games
                    </NavLink>
                    {user && (
                        <NavLink to="/orders" className={link}>
                            My orders
                        </NavLink>
                    )}
                </nav>

                <div className="ml-auto flex items-center gap-2">
                    <ThemeToggle />
                    {user ? (
                        <>
                            <span className="hidden max-w-32 truncate text-sm text-dim sm:block">{user.name}</span>
                            <button type="button" onClick={handleLogOut} className={btn("ghost", "sm")}>
                                Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <span className="hidden sm:block">
                                <Link to="/login" className={btn("subtle", "sm")}>
                                    Log in
                                </Link>
                            </span>
                            <Link to="/register" className={btn("primary", "sm")}>
                                Sign up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
