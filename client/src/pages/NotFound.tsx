import { Link } from "react-router-dom";
import { btn } from "../lib/ui";

export default function NotFound() {
    return (
        <div className="mx-auto max-w-md px-4 py-28 text-center">
            <p className="font-display text-6xl font-bold text-accent-text">404</p>
            <h1 className="mt-4 font-display text-2xl font-bold">This page doesn’t exist.</h1>
            <p className="mt-3 text-dim">The link may be broken, or the page may have moved.</p>
            <Link to="/" className={`${btn("primary")} mt-8`}>
                Back to games
            </Link>
        </div>
    );
}
