"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface AccessRestriction {
    id: string;
    levels: string[];
    reason: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
    createdBy: string;
    createdAt: string;
}

const LEVELS = ["100", "200", "300", "400", "500", "600"];

export default function AccessControlPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    const [restrictions, setRestrictions] = useState<AccessRestriction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Form state
    const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
    const [reason, setReason] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [allLevels, setAllLevels] = useState(false);

    // Check if already authenticated (stored in sessionStorage)
    useEffect(() => {
        const token = sessionStorage.getItem("admin_access_token");
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) fetchRestrictions();
    }, [isAuthenticated]);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setLoginError("");
        setLoginLoading(true);

        try {
            const res = await fetch("/api/admin/access-control/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }

            // Store token in sessionStorage
            sessionStorage.setItem("admin_access_token", data.token);
            setIsAuthenticated(true);
        } catch (e: any) {
            setLoginError(e.message);
        } finally {
            setLoginLoading(false);
        }
    }

    function handleLogout() {
        sessionStorage.removeItem("admin_access_token");
        setIsAuthenticated(false);
    }

    async function fetchRestrictions() {
        setLoading(true);
        setError("");
        try {
            const token = sessionStorage.getItem("admin_access_token");
            const res = await fetch("/api/admin/access-control", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch restrictions");
            const data = await res.json();
            setRestrictions(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setSuccess("");

        const levels = allLevels ? ["all"] : selectedLevels;
        if (levels.length === 0) {
            setError("Please select at least one level");
            return;
        }
        if (!reason.trim()) {
            setError("Please enter a reason");
            return;
        }
        if (!startTime || !endTime) {
            setError("Please select start and end times");
            return;
        }

        setLoading(true);
        try {
            const token = sessionStorage.getItem("admin_access_token");
            const res = await fetch("/api/admin/access-control", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    levels,
                    reason: reason.trim(),
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create restriction");
            }

            setSuccess("Restriction created successfully!");
            setSelectedLevels([]);
            setReason("");
            setStartTime("");
            setEndTime("");
            setAllLevels(false);
            await fetchRestrictions();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggle(id: string, currentStatus: boolean) {
        try {
            const token = sessionStorage.getItem("admin_access_token");
            const res = await fetch(`/api/admin/access-control/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isActive: !currentStatus }),
            });
            if (!res.ok) throw new Error("Failed to update");
            await fetchRestrictions();
        } catch (e: any) {
            setError(e.message);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this restriction?")) return;
        try {
            const token = sessionStorage.getItem("admin_access_token");
            const res = await fetch(`/api/admin/access-control/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to delete");
            await fetchRestrictions();
        } catch (e: any) {
            setError(e.message);
        }
    }

    function toggleLevel(level: string) {
        setSelectedLevels(prev =>
            prev.includes(level)
                ? prev.filter(l => l !== level)
                : [...prev, level]
        );
    }

    function formatDateTime(dateStr: string) {
        return new Date(dateStr).toLocaleString();
    }

    function getStatus(restriction: AccessRestriction) {
        const now = new Date();
        const start = new Date(restriction.startTime);
        const end = new Date(restriction.endTime);

        if (!restriction.isActive) return { label: "Disabled", color: "bg-gray-500" };
        if (now < start) return { label: "Upcoming", color: "bg-yellow-500" };
        if (now >= end) return { label: "Expired", color: "bg-gray-400" };
        return { label: "Active", color: "bg-red-500" };
    }

    // Show login form if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 dark:[background-color:#0C120C] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-[#2D3A2D] rounded-xl shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
                        Admin Access Control
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                        Enter admin credentials to manage access restrictions
                    </p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter admin username"
                                className="w-full border rounded-lg px-4 py-2 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white border-gray-300 dark:border-white/20"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                className="w-full border rounded-lg px-4 py-2 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white border-gray-300 dark:border-white/20"
                                required
                            />
                        </div>

                        {loginError && (
                            <div className="text-red-500 text-sm text-center">{loginError}</div>
                        )}

                        <button
                            type="submit"
                            disabled={loginLoading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loginLoading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Access Control (Exam Mode)</h1>
                <div className="space-x-4">
                    <Link
                        href="/admin/documents"
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
                    >
                        Documents
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Create New Restriction */}
            <div className="mb-8 p-6 bg-white dark:bg-[#2D3A2D] rounded-lg border border-gray-200 dark:border-white/10">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New Restriction</h2>

                <form onSubmit={handleCreate} className="space-y-4">
                    {/* Level Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Levels to Restrict
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setAllLevels(!allLevels);
                                    if (!allLevels) setSelectedLevels([]);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${allLevels
                                        ? "bg-red-600 text-white"
                                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                    }`}
                            >
                                All Levels
                            </button>
                            {LEVELS.map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => {
                                        if (allLevels) setAllLevels(false);
                                        toggleLevel(level);
                                    }}
                                    disabled={allLevels}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedLevels.includes(level)
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                                        } ${allLevels ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {level}L
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Reason (e.g., "Pharmacology Exam")
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter reason for restriction"
                            className="w-full border rounded-lg px-4 py-2 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white border-gray-300 dark:border-white/20"
                        />
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Time
                            </label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full border rounded-lg px-4 py-2 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white border-gray-300 dark:border-white/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Time
                            </label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full border rounded-lg px-4 py-2 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white border-gray-300 dark:border-white/20"
                            />
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    {success && <div className="text-green-500 text-sm">{success}</div>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create Restriction"}
                    </button>
                </form>
            </div>

            {/* Existing Restrictions */}
            <div className="bg-white dark:bg-[#2D3A2D] rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white p-4 border-b border-gray-200 dark:border-white/10">
                    Existing Restrictions
                </h2>

                {loading ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : restrictions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No restrictions created yet.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-white/10">
                        {restrictions.map(restriction => {
                            const statusInfo = getStatus(restriction);
                            return (
                                <div key={restriction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${statusInfo.color}`}>
                                                    {statusInfo.label}
                                                </span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {restriction.reason}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                <span className="font-medium">Levels:</span>{" "}
                                                {restriction.levels.includes("all")
                                                    ? "All Levels"
                                                    : restriction.levels.map(l => `${l}L`).join(", ")}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                <span className="font-medium">Period:</span>{" "}
                                                {formatDateTime(restriction.startTime)} - {formatDateTime(restriction.endTime)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggle(restriction.id, restriction.isActive)}
                                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${restriction.isActive
                                                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                                        : "bg-green-500 hover:bg-green-600 text-white"
                                                    }`}
                                            >
                                                {restriction.isActive ? "Disable" : "Enable"}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(restriction.id)}
                                                className="px-3 py-1 rounded text-sm font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
