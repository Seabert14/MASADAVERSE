import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import Notification from "../components/Notification";

function Members() {
  const [members, setMembers] = useState([]);
  const [memberships, setMemberships] = useState([]);
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

  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    member_name: "",
    member_email: "",
    member_gender: "",
    member_join_date: "",
    member_address: "",
    member_phone: ""
  });

  useEffect(() => {
    fetchMembers();
    fetchMemberships();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get("/members");
      setMembers(response.data);
    } catch (error) {
      console.error("Error fetching members:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load members. Please try again."
      });
    }
  };

  const fetchMemberships = async () => {
    try {
      const response = await api.get("/memberships");
      setMemberships(response.data);
    } catch (error) {
      console.error("Error fetching memberships:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load membership information."
      });
    }
  };

  const handleChange = (event) => {
    setFormError("");

    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const name = formData.member_name.trim();
    const email = formData.member_email.trim();
    const phone = formData.member_phone.trim();
    const address = formData.member_address.trim();

    if (!name) {
      setFormError("Please enter the member name.");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setFormError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (!formData.member_gender) {
      setFormError("Please select a gender.");
      return;
    }

    if (!formData.member_join_date) {
      setFormError("Please select a join date.");
      return;
    }

    if (!address) {
      setFormError("Please enter the address.");
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        member_name: name,
        member_email: email,
        member_phone: phone,
        member_address: address
      };

      if (editingId) {
        await api.put(`/members/${editingId}`, dataToSend);

        setNotification({
          type: "success",
          message: "Member updated successfully."
        });
      } else {
        await api.post("/members", dataToSend);

        setNotification({
          type: "success",
          message: "Member added successfully."
        });
      }

      await fetchMembers();
      resetForm();
    } catch (error) {
      console.error("Error saving member:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save member. Please try again."
      });
    }
  };

  const handleEdit = (member) => {
    setEditingId(member.member_id);
    setFormError("");

    setFormData({
      member_name: member.member_name || "",
      member_email: member.member_email || "",
      member_gender: member.member_gender || "",
      member_join_date: member.member_join_date
        ? member.member_join_date.substring(0, 10)
        : "",
      member_address: member.member_address || "",
      member_phone: member.member_phone || ""
    });

    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/members/${deleteId}`);

      await fetchMembers();
      await fetchMemberships();

      setDeleteId(null);

      setNotification({
        type: "success",
        message: "Member deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting member:", error);

      setDeleteId(null);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete member. Please try again."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      member_name: "",
      member_email: "",
      member_gender: "",
      member_join_date: "",
      member_address: "",
      member_phone: ""
    });

    setFormError("");
    setEditingId(null);
    setShowForm(false);
  };

  const getMemberMembership = (memberId) => {
    const memberPlans = memberships
      .filter(
        (membership) =>
          Number(membership.member_id) === Number(memberId)
      )
      .sort((a, b) => {
        const dateA = new Date(a.plan_end_date || 0);
        const dateB = new Date(b.plan_end_date || 0);

        return dateB - dateA;
      });

    return memberPlans[0] || null;
  };

  const getMembershipStatus = (membership) => {
    if (!membership?.plan_end_date) {
      return "No Plan";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(membership.plan_end_date);
    endDate.setHours(0, 0, 0, 0);

    return endDate >= today ? "Active" : "Expired";
  };

  const planOptions = useMemo(() => {
    const plans = memberships
      .map((membership) => membership.plan_name)
      .filter(Boolean);

    return [...new Set(plans)];
  }, [memberships]);

  const memberRows = useMemo(() => {
    return members.map((member) => {
      const membership = getMemberMembership(member.member_id);

      return {
        ...member,
        membership,
        planName: membership?.plan_name || "No Plan",
        status: getMembershipStatus(membership)
      };
    });
  }, [members, memberships]);

  const filteredMembers = useMemo(() => {
    const result = memberRows.filter((member) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        member.member_name?.toLowerCase().includes(searchValue) ||
        member.member_email?.toLowerCase().includes(searchValue) ||
        member.member_phone?.includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        member.status === statusFilter;

      const matchesPlan =
        planFilter === "All Plans" ||
        member.planName === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });

    return result.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.member_join_date) -
          new Date(a.member_join_date)
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.member_join_date) -
          new Date(b.member_join_date)
        );
      }

      if (sortBy === "nameAsc") {
        return (a.member_name || "").localeCompare(
          b.member_name || ""
        );
      }

      if (sortBy === "nameDesc") {
        return (b.member_name || "").localeCompare(
          a.member_name || ""
        );
      }

      return 0;
    });
  }, [
    memberRows,
    search,
    statusFilter,
    planFilter,
    sortBy
  ]);

  const activeMembers = memberRows.filter(
    (member) => member.status === "Active"
  ).length;

  const expiredMembers = memberRows.filter(
    (member) => member.status === "Expired"
  ).length;

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#071019] px-4 py-6 text-white sm:px-5">
      <div className="mx-auto w-full max-w-[1250px]">

        {/* Part 1: Page Header */}
        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a3e635]">
              Management
            </p>

            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              Members
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your gym members
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setFormError("");
                setShowForm(true);
              }
            }}
            className="w-full cursor-pointer rounded-lg bg-[#a3e635] px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-[#bef264] sm:w-auto"
          >
            {showForm ? "Close" : "+ Add Member"}
          </button>

        </div>

        {/* Part 2: Search, Filters and Sorting */}
        <div className="mb-5 w-full rounded-xl border border-white/10 bg-[#0b1620] p-3 sm:p-4">

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">

            <div className="col-span-2 flex flex-wrap gap-2 lg:col-span-2">

              <button
                onClick={() => setStatusFilter("All")}
                className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-bold transition sm:px-4 ${
                  statusFilter === "All"
                    ? "bg-[#a3e635] text-[#06111b]"
                    : "border border-white/10 bg-[#071019] text-slate-400 hover:text-white"
                }`}
              >
                All ({members.length})
              </button>

              <button
                onClick={() => setStatusFilter("Active")}
                className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-bold transition sm:px-4 ${
                  statusFilter === "Active"
                    ? "bg-[#a3e635] text-[#06111b]"
                    : "border border-white/10 bg-[#071019] text-slate-400 hover:text-white"
                }`}
              >
                Active ({activeMembers})
              </button>

              <button
                onClick={() => setStatusFilter("Expired")}
                className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-bold transition sm:px-4 ${
                  statusFilter === "Expired"
                    ? "bg-[#a3e635] text-[#06111b]"
                    : "border border-white/10 bg-[#071019] text-slate-400 hover:text-white"
                }`}
              >
                Expired ({expiredMembers})
              </button>

            </div>

            <select
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-[#a3e635] lg:col-span-1"
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
              onChange={(event) => setSortBy(event.target.value)}
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-[#a3e635] lg:col-span-1"
            >
              <option value="newest">Newest Joined</option>
              <option value="oldest">Oldest Joined</option>
              <option value="nameAsc">Name A–Z</option>
              <option value="nameDesc">Name Z–A</option>
            </select>

            <div className="relative col-span-2 lg:col-span-1">

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search by name, phone..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#071019] py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#a3e635]"
              />

            </div>

          </div>
        </div>

        {/* Part 3: Add/Edit Member Form */}
        {showForm && (
          <div className="mb-5 rounded-xl border border-white/10 bg-[#0b1620] p-4 sm:p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a3e635]">
                  Member
                </p>

                <h2 className="mt-1 text-lg font-black">
                  {editingId ? "Edit Member" : "Add Member"}
                </h2>
              </div>

              <button
                onClick={resetForm}
                className="cursor-pointer text-slate-500 hover:text-white"
              >
                ✕
              </button>

            </div>

            {formError && (
              <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-400">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
            >

              <input
                type="text"
                name="member_name"
                placeholder="Full Name"
                value={formData.member_name}
                onChange={handleChange}
                required
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#a3e635]"
              />

              <input
                type="email"
                name="member_email"
                placeholder="Email"
                value={formData.member_email}
                onChange={handleChange}
                required
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#a3e635]"
              />

              <input
                type="tel"
                name="member_phone"
                placeholder="Phone Number"
                value={formData.member_phone}
                onChange={(event) => {
                  setFormError("");

                  setFormData({
                    ...formData,
                    member_phone: event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  });
                }}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                required
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#a3e635]"
              />

              <select
                name="member_gender"
                value={formData.member_gender}
                onChange={handleChange}
                required
                className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none focus:border-[#a3e635]"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <input
                type="date"
                name="member_join_date"
                value={formData.member_join_date}
                onChange={handleChange}
                required
                className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none focus:border-[#a3e635]"
              />

              <input
                type="text"
                name="member_address"
                placeholder="Address"
                value={formData.member_address}
                onChange={handleChange}
                required
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#071019] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#a3e635]"
              />

              <div className="flex flex-col gap-2 sm:flex-row md:col-span-2 lg:col-span-3">

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg bg-[#a3e635] px-5 py-2.5 text-sm font-black text-[#06111b] hover:bg-[#bef264] sm:w-auto"
                >
                  {editingId ? "Update Member" : "Save Member"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 sm:w-auto"
                >
                  Cancel
                </button>

              </div>

            </form>
          </div>
        )}

        {/* Part 4: Members Table */}
        <div className="mx-auto w-full max-w-[1050px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1620]">

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[900px] text-left">

              <thead>
                <tr className="border-b border-white/10 bg-[#0d1d2a]">

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    ID
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Member
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Phone
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Plan
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Joined
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredMembers.map((member) => (
                  <tr
                    key={member.member_id}
                    className="border-b border-white/5 transition hover:bg-white/[0.025]"
                  >

                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-400">
                      M{String(member.member_id).padStart(3, "0")}
                    </td>

                    <td className="px-4 py-3.5">

                      <div className="flex items-center gap-2.5">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#a3e635]/10 text-xs font-black text-[#a3e635]">
                          {member.member_name
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-bold text-white">
                            {member.member_name}
                          </p>

                          <p className="max-w-[190px] truncate text-[11px] text-slate-600">
                            {member.member_email}
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="px-4 py-3.5 text-sm text-slate-400">
                      {member.member_phone}
                    </td>

                    <td className="px-4 py-3.5 text-sm text-slate-300">
                      {member.planName}
                    </td>

                    <td className="px-4 py-3.5">

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                          member.status === "Active"
                            ? "bg-[#a3e635]/15 text-[#a3e635]"
                            : member.status === "Expired"
                            ? "bg-red-400/15 text-red-400"
                            : "bg-slate-700/50 text-slate-400"
                        }`}
                      >
                        {member.status}
                      </span>

                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">
                      {formatDate(member.member_join_date)}
                    </td>

                    <td className="px-4 py-3.5">

                      <div className="flex items-center gap-2">

                        <button
                          onClick={() => handleEdit(member)}
                          className="cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:border-[#a3e635]/30 hover:text-[#a3e635]"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(member.member_id)
                          }
                          className="cursor-pointer rounded-md border border-red-400/10 px-3 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-400/10"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

                {filteredMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-12 text-center"
                    >
                      <p className="text-sm font-bold text-slate-400">
                        No members found
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Try changing your filters or search.
                      </p>
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* Part 5: Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Delete Member?"
        message="Are you sure you want to delete this member? This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

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

    </div>
  );
}

export default Members;