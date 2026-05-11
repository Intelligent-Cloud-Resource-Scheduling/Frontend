import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fbfbff_0%,#ffffff_45%,#f8fbfa_100%)] px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <section className="hidden lg:block">
            <Link href="/login" className="text-sm font-semibold text-primary">
              Cloud Video
            </Link>
            <h1 className="mt-8 max-w-lg text-4xl font-bold leading-tight text-slate-950">
              Upload, process, and monitor cloud video jobs from one focused workspace.
            </h1>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {["Fast uploads", "Live status", "Plan limits"].map((item) => (
                <div key={item} className="rounded-lg border border-border bg-white p-4 text-sm font-semibold text-slate-700 shadow-soft">
                  {item}
                </div>
              ))}
            </div>
          </section>
          <section className="mx-auto w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold text-primary">Cloud Video</p>
            <h2 className="mt-3 text-2xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">{footer}</div> : null}
          </section>
        </div>
      </div>
    </main>
  );
}
