import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import Notification from "../components/Notification";

function Memberships() {
  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [planFilter, setPlanFilter] = useState("All Plans");
  const [sortBy, setSortBy] = useState("newest");

  const [notification, setNotification] = useState({
    type: "",
    message: ""
  });

  const [formData, setFormData] = useState({
    plan_name: "",
    plan_amount: "",
    plan_duration: "",
    plan_start_date: "",
    plan_end_date: "",
    member_id: ""
  });

  const fetchData = async () => {
    try {
      const [membershipsResponse, membersResponse, plansResponse] =
        await Promise.all([
          api.get("/memberships"),
          api.get("/members"),
          api.get("/plan-catalog")
        ]);

      setMemberships(membershipsResponse.data);
      setMembers(membersResponse.data);
      setPlans(plansResponse.data);
    } catch (error) {
      console.error("Error fetching membership data:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load membership data."
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDateInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getToday = () => {
    return formatDateInput(new Date());
  };

  const getLatestMembership = (memberId) => {
    return (
      memberships
        .filter(
          (membership) =>
            Number(membership.member_id) === Number(memberId) &&
            Number(membership.plan_id) !== Number(editingId)
        )
        .sort(
          (a, b) =>
            new Date(b.plan_end_date) -
            new Date(a.plan_end_date)
        )[0] || null
    );
  };

  const calculateEndDate = (startDate, planName) => {
    if (!startDate || !planName) {
      return "";
    }

    const date = new Date(`${startDate}T00:00:00`);

    const durations = {
      Monthly: 1,
      Quarterly: 3,
      "Half-Yearly": 6,
      Yearly: 12
    };

    const months = durations[planName];

    if (!months) {
      return "";
    }

    const originalDay = date.getDate();

    date.setMonth(date.getMonth() + months);

    if (date.getDate() !== originalDay) {
      date.setDate(0);
    }

    return formatDateInput(date);
  };

  const calculateDates = (memberId, selectedPlan) => {
    if (!memberId || !selectedPlan) {
      return {
        start: "",
        end: ""
      };
    }

    const previousMembership = getLatestMembership(memberId);

    const start = previousMembership
      ? previousMembership.plan_end_date?.substring(0, 10)
      : getToday();

    const end = calculateEndDate(
      start,
      selectedPlan.plan_name
    );

    return {
      start,
      end
    };
  };

  const handleMemberChange = (e) => {
    const memberId = e.target.value;

    setFormData((previous) => {
      const selectedPlan = plans.find(
        (plan) => plan.plan_name === previous.plan_name
      );

      if (!memberId || !selectedPlan) {
        return {
          ...previous,
          member_id: memberId
        };
      }

      const dates = calculateDates(memberId, selectedPlan);

      return {
        ...previous,
        member_id: memberId,
        plan_start_date: dates.start,
        plan_end_date: dates.end
      };
    });
  };

  const handlePlanChange = (e) => {
    const planName = e.target.value;

    const selectedPlan = plans.find(
      (plan) => plan.plan_name === planName
    );

    if (!selectedPlan) {
      setFormData((previous) => ({
        ...previous,
        plan_name: "",
        plan_amount: "",
        plan_duration: "",
        plan_start_date: "",
        plan_end_date: ""
      }));

      return;
    }

    const dates = calculateDates(
      formData.member_id,
      selectedPlan
    );

    setFormData((previous) => ({
      ...previous,
      plan_name: selectedPlan.plan_name,
      plan_amount: selectedPlan.plan_amount,
      plan_duration: selectedPlan.plan_duration,
      plan_start_date: dates.start,
      plan_end_date: dates.end
    }));
  };

  const handleStartDateChange = (e) => {
    const startDate = e.target.value;

    const selectedPlan = plans.find(
      (plan) => plan.plan_name === formData.plan_name
    );

    const endDate = selectedPlan
      ? calculateEndDate(
          startDate,
          selectedPlan.plan_name
        )
      : "";

    setFormData((previous) => ({
      ...previous,
      plan_start_date: startDate,
      plan_end_date: endDate
    }));
  };

  const validateForm = () => {
    if (!formData.member_id) {
      setNotification({
        type: "error",
        message: "Please select a member."
      });

      return false;
    }

    if (!formData.plan_name) {
      setNotification({
        type: "error",
        message: "Please select a membership plan."
      });

      return false;
    }

    if (!formData.plan_amount || Number(formData.plan_amount) < 0) {
      setNotification({
        type: "error",
        message: "Membership amount is invalid."
      });

      return false;
    }

    if (!formData.plan_duration || Number(formData.plan_duration) <= 0) {
      setNotification({
        type: "error",
        message: "Membership duration must be greater than 0."
      });

      return false;
    }

    if (!formData.plan_start_date) {
      setNotification({
        type: "error",
        message: "Please select a start date."
      });

      return false;
    }

    if (!formData.plan_end_date) {
      setNotification({
        type: "error",
        message: "Membership end date could not be calculated."
      });

      return false;
    }

    const startDate = new Date(
      `${formData.plan_start_date}T00:00:00`
    );

    const endDate = new Date(
      `${formData.plan_end_date}T00:00:00`
    );

    if (endDate < startDate) {
      setNotification({
        type: "error",
        message: "End date cannot be before start date."
      });

      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const isEditing = Boolean(editingId);

      if (editingId) {
        await api.put(`/memberships/${editingId}`, formData);
      } else {
        await api.post("/memberships", formData);
      }

      setFormData({
        plan_name: "",
        plan_amount: "",
        plan_duration: "",
        plan_start_date: "",
        plan_end_date: "",
        member_id: ""
      });

      setEditingId(null);
      setShowForm(false);

      await fetchData();

      setNotification({
        type: "success",
        message: isEditing
          ? "Membership updated successfully."
          : "Membership added successfully."
      });
    } catch (error) {
      console.error("Error saving membership:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save membership."
      });
    }
  };

  const handleEdit = (membership) => {
    setEditingId(membership.plan_id);

    setFormData({
      plan_name: membership.plan_name ?? "",
      plan_amount: membership.plan_amount ?? "",
      plan_duration: membership.plan_duration ?? "",
      plan_start_date:
        membership.plan_start_date?.substring(0, 10) ?? "",
      plan_end_date:
        membership.plan_end_date?.substring(0, 10) ?? "",
      member_id: membership.member_id ?? ""
    });

    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId === null) {
      return;
    }

    try {
      await api.delete(`/memberships/${deleteId}`);
      await fetchData();
      setDeleteId(null);

      setNotification({
        type: "success",
        message: "Membership deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting membership:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete membership."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      plan_name: "",
      plan_amount: "",
      plan_duration: "",
      plan_start_date: "",
      plan_end_date: "",
      member_id: ""
    });

    setEditingId(null);
    setShowForm(false);
  };

  const getMemberName = (memberId) => {
    const member = members.find(
      (item) => Number(item.member_id) === Number(memberId)
    );

    return member?.member_name || "Unknown";
  };

  const getStatus = (endDate) => {
    if (!endDate) {
      return "No Date";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(
      `${endDate.substring(0, 10)}T00:00:00`
    );

    return end >= today ? "Active" : "Expired";
  };

  const planOptions = useMemo(() => {
    return plans.map((plan) => plan.plan_name);
  }, [plans]);

  const filteredMemberships = useMemo(() => {
    let result = [...memberships];

    if (search.trim()) {
      const value = search.trim().toLowerCase();

      result = result.filter((membership) => {
        const memberName = getMemberName(
          membership.member_id
        );

        return (
          membership.plan_name
            ?.toLowerCase()
            .includes(value) ||
          memberName.toLowerCase().includes(value) ||
          String(membership.plan_amount).includes(value)
        );
      });
    }

    if (statusFilter !== "All") {
      result = result.filter(
        (membership) =>
          getStatus(membership.plan_end_date) === statusFilter
      );
    }

    if (planFilter !== "All Plans") {
      result = result.filter(
        (membership) =>
          membership.plan_name === planFilter
      );
    }

    result = [...result].sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.plan_start_date) -
          new Date(a.plan_start_date)
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.plan_start_date) -
          new Date(b.plan_start_date)
        );
      }

      if (sortBy === "nameAZ") {
        return a.plan_name.localeCompare(b.plan_name);
      }

      if (sortBy === "nameZA") {
        return b.plan_name.localeCompare(a.plan_name);
      }

      return 0;
    });

    return result;
  }, [
    memberships,
    members,
    search,
    statusFilter,
    planFilter,
    sortBy
  ]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#071019] px-4 py-6 text-white sm:px-5">

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() =>
          setNotification({
            type: "",
            message: ""
          })
        }
      />

      <div className="mx-auto w-full max-w-[1250px]">

        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a3e635]">
              Membership Management
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Memberships
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage member plans, pricing and validity.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingId(null);

              setFormData({
                plan_name: "",
                plan_amount: "",
                plan_duration: "",
                plan_start_date: "",
                plan_end_date: "",
                member_id: ""
              });

              setShowForm(true);
            }}
            className="cursor-pointer rounded-lg bg-[#a3e635] px-4 py-2.5 text-sm font-bold text-[#07100a] transition hover:bg-[#bef264]"
          >
            + Add Membership
          </button>

        </div>

        {showForm && (
          <div className="mb-5 rounded-xl border border-white/10 bg-[#0b1620] p-4 sm:p-5">

            <div className="mb-4 flex items-center justify-between">

              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Membership" : "Add Membership"}
              </h2>

              <button
                onClick={resetForm}
                className="cursor-pointer text-sm text-slate-500 hover:text-white"
              >
                Cancel
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-3"
            >

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Member
                </label>

                <select
                  value={formData.member_id}
                  onChange={handleMemberChange}
                  required
                  className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none focus:border-[#a3e635]"
                >
                  <option value="">Select Member</option>

                  {members.map((member) => (
                    <option
                      key={member.member_id}
                      value={member.member_id}
                    >
                      {member.member_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Membership Plan
                </label>

                <select
                  value={formData.plan_name}
                  onChange={handlePlanChange}
                  required
                  className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none focus:border-[#a3e635]"
                >
                  <option value="">Select Plan</option>

                  {plans.map((plan) => (
                    <option
                      key={plan.catalog_id}
                      value={plan.plan_name}
                    >
                      {plan.plan_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Amount
                </label>

                <input
                  type="number"
                  value={formData.plan_amount}
                  readOnly
                  className="w-full cursor-default rounded-lg border border-white/10 bg-[#101c27] px-3 py-2.5 text-sm text-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Duration
                </label>

                <input
                  type="text"
                  value={
                    formData.plan_duration
                      ? `${formData.plan_duration} ${
                          plans.find(
                            (plan) =>
                              plan.plan_name === formData.plan_name
                          )?.duration_type || ""
                        }`
                      : ""
                  }
                  readOnly
                  className="w-full cursor-default rounded-lg border border-white/10 bg-[#101c27] px-3 py-2.5 text-sm text-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Start Date
                </label>

                <input
                  type="date"
                  value={formData.plan_start_date}
                  onChange={handleStartDateChange}
                  required
                  className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none focus:border-[#a3e635]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  End Date
                </label>

                <input
                  type="date"
                  value={formData.plan_end_date}
                  readOnly
                  className="w-full cursor-default rounded-lg border border-white/10 bg-[#101c27] px-3 py-2.5 text-sm text-slate-300 outline-none"
                />
              </div>

              <div className="flex justify-end md:col-span-3">

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg bg-[#a3e635] px-5 py-2.5 text-sm font-bold text-[#07100a] hover:bg-[#bef264] sm:w-auto"
                >
                  {editingId
                    ? "Update Membership"
                    : "Save Membership"}
                </button>

              </div>

            </form>
          </div>
        )}

        <div className="mb-4 w-full rounded-xl border border-white/10 bg-[#0b1620] p-3 sm:p-4">

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            <input
              type="text"
              placeholder="Search membership..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="col-span-2 w-full cursor-text rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#a3e635] lg:col-span-1"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none focus:border-[#a3e635]"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none focus:border-[#a3e635]"
            >
              <option value="All Plans">All Plans</option>

              {planOptions.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="col-span-2 w-full cursor-pointer rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none focus:border-[#a3e635] lg:col-span-1"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="nameAZ">Name A-Z</option>
              <option value="nameZA">Name Z-A</option>
            </select>

          </div>
        </div>

        <div className="mx-auto w-full max-w-[1100px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1620]">

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[900px] text-left">

              <thead className="border-b border-white/10 bg-[#0e1a25]">

                <tr>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Member
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Plan
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Duration
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Start
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    End
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {filteredMemberships.map((membership) => {

                  const status = getStatus(
                    membership.plan_end_date
                  );

                  return (
                    <tr
                      key={membership.plan_id}
                      className="transition hover:bg-white/[0.025]"
                    >

                      <td className="px-4 py-3 text-sm font-medium text-white">
                        {getMemberName(membership.member_id)}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-300">
                        {membership.plan_name}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-300">
                        ₹
                        {Number(
                          membership.plan_amount
                        ).toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-400">
                        {membership.plan_duration}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-400">
                        {membership.plan_start_date?.substring(0, 10)}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-400">
                        {membership.plan_end_date?.substring(0, 10)}
                      </td>

                      <td className="px-4 py-3">

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            status === "Active"
                              ? "bg-[#a3e635]/10 text-[#a3e635]"
                              : "bg-red-400/10 text-red-400"
                          }`}
                        >
                          {status}
                        </span>

                      </td>

                      <td className="px-4 py-3">

                        <div className="flex justify-center gap-2">

                          <button
                            onClick={() =>
                              handleEdit(membership)
                            }
                            className="cursor-pointer rounded-md border border-white/10 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                membership.plan_id
                              )
                            }
                            className="cursor-pointer rounded-md border border-red-400/20 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-400/10"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

                {filteredMemberships.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-10 text-center text-sm text-slate-600"
                    >
                      No memberships found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>
        </div>

        <DeleteConfirmModal
          isOpen={deleteId !== null}
          title="Delete Membership?"
          message="Are you sure you want to delete this membership? This action cannot be undone."
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />

      </div>
    </div>
  );
}

export default Memberships;
