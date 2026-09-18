import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState(null);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
    );

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await api.get(`/dashboard?date=${selectedDate}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020b13] text-sm text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  const selectedDateDisplay = new Date(
    `${selectedDate}T00:00:00`
    ).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
    });

  const maxMembers = Math.max(
    ...stats.membership_growth.map((item) => Number(item.members)),
    1
  );

  return (
    <div className="min-h-screen bg-[#020b13] px-5 py-6 text-white">
      <div className="mx-auto max-w-[1250px]">

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a3e635]">
              Welcome Back, Admin
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Here's what's happening at MASADAVERSE today.
            </p>
          </div>

          <div className="flex items-center gap-2">
      <div className="rounded-lg border border-white/10 bg-[#071520] px-4 py-2.5">
        <p className="text-[10px] uppercase tracking-wider text-slate-600">
            Attendance Date
        </p>

        <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="mt-0.5 cursor-pointer bg-transparent text-sm font-medium text-slate-300 outline-none"
        />
        </div>

            <div className="rounded-lg bg-[#a3e635] px-4 py-3 text-sm font-bold text-[#08110a]">
              Admin
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl border border-white/10 bg-[#071520] px-4 py-3.5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Total Members
                </p>

                <h2 className="mt-1.5 text-2xl font-black">
                  {stats.total_members}
                </h2>

                <p className="mt-0.5 text-xs text-slate-600">
                  Registered members
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a3e635]/10 text-sm font-bold text-[#a3e635]">
                M
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#071520] px-4 py-3.5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Active Memberships
                </p>

                <h2 className="mt-1.5 text-2xl font-black">
                  {stats.active_memberships}
                </h2>

                <p className="mt-0.5 text-xs text-[#a3e635]">
                  Currently active
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a3e635]/10 text-sm font-bold text-[#a3e635]">
                ✓
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#071520] px-4 py-3.5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Total Revenue
                </p>

                <h2 className="mt-1.5 text-2xl font-black">
                  ₹{Number(stats.total_payments).toLocaleString("en-IN")}
                </h2>

                <p className="mt-0.5 text-xs text-slate-600">
                  Recorded payments
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#a3e635]/10 text-sm font-bold text-[#a3e635]">
                ₹
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-400/10 bg-[#071520] px-4 py-3.5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Expired Memberships
                </p>

                <h2 className="mt-1.5 text-2xl font-black text-red-400">
                  {stats.expired_memberships}
                </h2>

                <p className="mt-0.5 text-xs text-slate-600">
                  Expired plans
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-400/10 text-sm font-bold text-red-400">
                !
              </div>
            </div>
          </div>

        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">

          <div className="rounded-xl border border-white/10 bg-[#071520] p-5 xl:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a3e635]">
                  Growth
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Membership Growth
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Member registrations over the last 6 months
                </p>
              </div>

              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                6 Months
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-white/5 bg-[#020b13] px-5 py-4">
              <div className="flex h-52 items-end gap-3">

                {stats.membership_growth.length > 0 ? (
                  stats.membership_growth.map((item) => {
                    const value = Number(item.members);

                    return (
                      <div
                        key={item.month}
                        className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                      >
                        <span className="text-xs font-medium text-slate-400">
                          {value}
                        </span>

                        <div className="flex h-40 w-full items-end">
                          <div
                            className="w-full rounded-t-md bg-[#a3e635] transition-all hover:bg-[#bef264]"
                            style={{
                              height: `${Math.max(
                                (value / maxMembers) * 100,
                                value > 0 ? 8 : 3
                              )}%`
                            }}
                          />
                        </div>

                        <span className="text-xs text-slate-600">
                          {item.month}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex w-full items-center justify-center text-sm text-slate-600">
                    No membership growth data available.
                  </div>
                )}

              </div>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#071520] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a3e635]">
                  Members
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Recent Members
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Latest registrations
                </p>
              </div>

              <Link
                to="/members"
                className="cursor-pointer text-xs font-semibold text-[#a3e635] transition hover:text-[#bef264]"
              >
                View All
              </Link>
            </div>

            <div className="mt-5 space-y-1">
              {stats.recent_members.length > 0 ? (
                stats.recent_members.map((member) => (
                  <div
                    key={member.member_id}
                    className="flex items-center gap-3 rounded-lg px-2 py-3 transition hover:bg-white/[0.025]"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#a3e635]/10 text-xs font-bold text-[#a3e635]">
                      {member.member_name?.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {member.member_name}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-slate-600">
                        {member.plan_name || "No Membership"}
                      </p>
                    </div>

                    <span className="text-sm text-slate-600">
                      →
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-slate-600">
                  No members found.
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl border border-white/10 bg-[#071520] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {selectedDate === new Date().toISOString().split("T")[0]
                    ? "Today's Attendance"
                    : `${selectedDateDisplay} Attendance`}
                </p>

                <h2 className="mt-3 text-2xl font-black">
                  {stats.present_today}
                  <span className="text-sm font-medium text-slate-600">
                    {" "}
                    / {stats.total_attendance_today}
                  </span>
                </h2>

                <p className="mt-0.5 text-xs text-slate-600">
                   Checked in on selected date
                </p>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#a3e635]/20 text-xs font-bold text-[#a3e635]">
                {stats.attendance_percentage}%
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-red-400/10 bg-[#071520] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Upcoming Expiry
            </p>

            <h2 className="mt-2 text-2xl font-black text-red-400">
              {stats.upcoming_expiry}
            </h2>

            <p className="mt-0.5 text-xs text-slate-600">
              Expiring within 7 days
            </p>

            <Link
              to="/memberships"
              className="mt-3 inline-block cursor-pointer text-xs font-semibold text-[#a3e635] transition hover:text-[#bef264]"
            >
              View Memberships →
            </Link>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#071520] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Workout Plans
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {stats.total_workouts}
            </h2>

            <p className="mt-0.5 text-xs text-slate-600">
              Total workout plans
            </p>

            <Link
              to="/workouts"
              className="mt-3 inline-block cursor-pointer text-xs font-semibold text-[#a3e635] transition hover:text-[#bef264]"
            >
              View Plans →
            </Link>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#071520] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Trainers
            </p>

            <h2 className="mt-2 text-2xl font-black">
              {stats.total_trainers}
            </h2>

            <p className="mt-0.5 text-xs text-slate-600">
              Registered trainers
            </p>

            <Link
              to="/trainers"
              className="mt-3 inline-block cursor-pointer text-xs font-semibold text-[#a3e635] transition hover:text-[#bef264]"
            >
              View Trainers →
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Dashboard;