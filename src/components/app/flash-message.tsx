"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type FlashMessageProps = {
    notice?: string;
    error?: string;
    successDurationMs?: number;
    errorDurationMs?: number;
};

type FlashState = {
    type: "success" | "error";
    text: string;
};

export function FlashMessage({
    notice,
    error,
    successDurationMs = 3500,
    errorDurationMs = 7000,
}: FlashMessageProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const initial = useMemo<FlashState | null>(() => {
        if (error) return { type: "error", text: error };
        if (notice) return { type: "success", text: notice };
        return null;
    }, [error, notice]);

    const [active, setActive] = useState<FlashState | null>(initial);

    useEffect(() => {
        setActive(initial);
    }, [initial]);

    useEffect(() => {
        if (!active) {
            return;
        }

        const timer = window.setTimeout(
            () => setActive(null),
            active.type === "success" ? successDurationMs : errorDurationMs
        );

        return () => window.clearTimeout(timer);
    }, [active, successDurationMs, errorDurationMs]);

    useEffect(() => {
        if (!active) {
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        const hadNotice = params.has("notice");
        const hadError = params.has("error");

        if (!hadNotice && !hadError) {
            return;
        }

        params.delete("notice");
        params.delete("error");

        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, [active, pathname, router, searchParams]);

    if (!active) {
        return null;
    }

    const isError = active.type === "error";

    return (
        <div
            role={isError ? "alert" : "status"}
            aria-live={isError ? "assertive" : "polite"}
            className={`state-panel flex items-start justify-between gap-3 p-3 ${isError ? "state-error" : ""}`}
        >
            <div className="flex items-start gap-2.5">
                {isError ? (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-red-300" />
                ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                )}
                <p className={`text-sm ${isError ? "text-red-700 dark:text-red-200" : "text-emerald-700 dark:text-emerald-200"}`}>
                    {active.text}
                </p>
            </div>
            <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Dismiss message"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-black/5 hover:text-foreground"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
