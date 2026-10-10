import Link from "next/link";

export default function NotFound() {
  return (
    <main className="main-content flex-center min-h-[70vh]">
      <div className="card-glass-form text-center max-w-md mx-auto">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-white mb-2">Decision Not Found</h1>
        <p className="text-secondary mb-6">
          This mystery wheel link may have expired, or the ID is incorrect.
        </p>
        <Link href="/" className="btn-submit-glow inline-flex justify-center">
          <span>🎡 Create a New Wheel</span>
        </Link>
      </div>
    </main>
  );
}
