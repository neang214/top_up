export default function Footer() {
    return (
        <footer className="mt-20 border-t border-line">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-dim sm:flex-row sm:justify-between">
                <p>Pay with any banking app that supports Bakong KHQR.</p>
                <p>© {new Date().getFullYear()} TopUp</p>
            </div>
        </footer>
    );
}
