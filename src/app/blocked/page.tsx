"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AcademicCapIcon, ClockIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";

export default function BlockedPage() {
    const router = useRouter();
    const [restriction, setRestriction] = useState<{
        restricted: boolean;
        reason?: string;
        resumesAt?: string;
        levels?: string[];
    } | null>(null);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        checkRestriction();
        const interval = setInterval(checkRestriction, 30000); // Re-check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!restriction?.resumesAt) return;

        const updateCountdown = () => {
            const now = new Date();
            const end = new Date(restriction.resumesAt!);
            const diff = end.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft("Access should be restored now. Refreshing...");
                setTimeout(() => router.push("/main"), 2000);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [restriction?.resumesAt, router]);

    async function checkRestriction() {
        try {
            const res = await fetch("/api/access-check");
            const data = await res.json();

            if (!data.restricted) {
                // No longer restricted, redirect to main
                router.push("/main");
                return;
            }

            setRestriction(data);
        } catch (error) {
            console.error("Error checking restriction:", error);
        }
    }

    if (!restriction) {
        return (
            <div className="min-h-screen bg-gray-50 dark:[background-color:#0C120C] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
            </div>
        );
    }

    const levelDisplay = restriction.levels?.includes("all")
        ? "All Levels"
        : restriction.levels?.map(l => `${l}L`).join(", ") || "Your Level";

    return (
        <div className="min-h-screen bg-gray-50 dark:[background-color:#0C120C] flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
                {/* Main Card */}
                <div className="bg-white dark:bg-[#2D3A2D] rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    {/* Header */}
                    <div className="bg-red-600 p-6 text-center">
                        <ShieldExclamationIcon className="h-16 w-16 text-white mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-white">Access Temporarily Restricted</h1>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Reason */}
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                                <AcademicCapIcon className="h-5 w-5" />
                                <span className="text-sm font-medium">Reason</span>
                            </div>
                            <p className="text-xl font-semibold text-gray-900 dark:text-white">
                                {restriction.reason || "Examination in Progress"}
                            </p>
                        </div>

                        {/* Affected Levels */}
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Affected Students</p>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">{levelDisplay}</p>
                        </div>

                        {/* Countdown */}
                        <div className="bg-gray-100 dark:bg-black/20 rounded-xl p-6 text-center">
                            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                                <ClockIcon className="h-5 w-5" />
                                <span className="text-sm font-medium">Access Resumes In</span>
                            </div>
                            <p className="text-4xl font-bold text-green-600 dark:text-[#00A400] font-mono">
                                {timeLeft}
                            </p>
                            {restriction.resumesAt && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    ({new Date(restriction.resumesAt).toLocaleString()})
                                </p>
                            )}
                        </div>

                        {/* Message */}
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                            <p>
                                PANSGPT access has been temporarily disabled during this examination period
                                to maintain academic integrity.
                            </p>
                            <p className="mt-2">
                                Please wait until the examination ends. Access will be automatically restored.
                            </p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-black/20 px-6 py-4 text-center border-t border-gray-200 dark:border-white/10">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Faculty of Pharmaceutical Sciences, University of Jos
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
