import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import Notification from "../components/Notification";

function Progress() {
  const [progress, setProgress] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("All Members");
  const [sortBy, setSortBy] = useState("newest");

  const [notification, setNotification] = useState({
    type: "",
    message: ""
  });

  const [formData, setFormData] = useState({
    member_id: "",
    record_date: "",
    weight: "",
    height: "",
    body_fat: ""
  });

  useEffect(() => {
    fetchProgress();
    fetchMembers();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await api.get("/progress");
      setProgress(response.data);
    } catch (error) {
      console.error("Error fetching progress:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load progress records."
      });
    }
  };

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
          "Unable to load members."
      });
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.member_id) {
      return "Please select a member.";
    }

    if (!formData.record_date) {
      return "Please select a record date.";
    }

    if (formData.weight === "") {
      return "Please enter weight.";
    }

    if (Number(formData.weight) <= 0) {
      return "Weight must be greater than 0.";
    }

    if (formData.height === "") {
      return "Please enter height.";
    }

    if (Number(formData.height) <= 0) {
      return "Height must be greater than 0.";
    }

    if (formData.body_fat === "") {
      return "Please enter body fat percentage.";
    }

    if (
      Number(formData.body_fat) < 0 ||
      Number(formData.body_fat) > 100
    ) {
      return "Body fat must be between 0 and 100.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setNotification({
        type: "error",
        message: validationMessage
      });

      return;
    }

    try {
      if (editingId) {
        await api.put(`/progress/${editingId}`, formData);

        setNotification({
          type: "success",
          message: "Progress record updated successfully."
        });
      } else {
        await api.post("/progress", formData);

        setNotification({
          type: "success",
          message: "Progress record added successfully."
        });
      }

      await fetchProgress();
      resetForm();
    } catch (error) {
      console.error("Error saving progress:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save progress record."
      });
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.progress_id);

    setFormData({
      member_id: record.member_id || "",
      record_date: record.record_date
        ? record.record_date.substring(0, 10)
        : "",
      weight: record.weight ?? "",
      height: record.height ?? "",
      body_fat: record.body_fat ?? ""
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
      await api.delete(`/progress/${deleteId}`);
      await fetchProgress();

      setDeleteId(null);

      setNotification({
        type: "success",
        message: "Progress record deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting progress:", error);

      setDeleteId(null);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete progress record."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      member_id: "",
      record_date: "",
      weight: "",
      height: "",
      body_fat: ""
    });

    setEditingId(null);
    setShowForm(false);
  };

  const getMemberName = (memberId) => {
    const member = members.find(
      (item) => Number(item.member_id) === Number(memberId)
    );

    return member?.member_name || "Unknown Member";
  };

  const getInitials = (name) => {
    if (!name) {
      return "M";
    }

    return name
      .trim()
      .split(/\s+/)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const filteredProgress = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const result = progress.filter((record) => {
      const memberName = getMemberName(record.member_id);

      const matchesSearch =
        memberName.toLowerCase().includes(searchText) ||
        String(record.weight ?? "")
          .toLowerCase()
          .includes(searchText) ||
        String(record.height ?? "")
          .toLowerCase()
          .includes(searchText) ||
        String(record.body_fat ?? "")
          .toLowerCase()
          .includes(searchText);

      const matchesMember =
        memberFilter === "All Members" ||
        Number(record.member_id) === Number(memberFilter);

      return matchesSearch && matchesMember;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.record_date) -
          new Date(a.record_date)
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.record_date) -
          new Date(b.record_date)
        );
      }

      if (sortBy === "weightHigh") {
        return Number(b.weight || 0) - Number(a.weight || 0);
      }

      if (sortBy === "weightLow") {
        return Number(a.weight || 0) - Number(b.weight || 0);
      }

      return 0;
    });
  }, [
    progress,
    members,
    search,
    memberFilter,
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

      <div className="mx-auto w-full max-w-[1200px]">

        {/* PART 1: HEADER */}

        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
              Management
            </p>

            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              Progress
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Track member fitness measurements and progress
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="w-full cursor-pointer rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-lime-300 sm:w-auto"
          >
            {showForm ? "Close" : "+ Add Progress"}
          </button>
        </div>

        {/* PART 2: STATS */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Records
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              {progress.length}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Progress records
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Members
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              {members.length}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Registered members
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Results
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              {filteredProgress.length}
            </h2>

            <p className="mt-0.5 text-xs text-lime-400">
              Matching records
            </p>
          </div>

        </div>

        {/* PART 3: FILTERS */}

        <div className="mb-5 w-full rounded-xl border border-white/10 bg-[#0b1925] p-3 sm:p-4">

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

            <div className="col-span-2 lg:col-span-1">
              <input
                type="text"
                placeholder="Search member, weight, height..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />
            </div>

            <select
              value={memberFilter}
              onChange={(event) =>
                setMemberFilter(event.target.value)
              }
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400"
            >
              <option value="All Members">
                All Members
              </option>

              {members.map((member) => (
                <option
                  key={member.member_id}
                  value={member.member_id}
                >
                  {member.member_name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="col-span-2 w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400 lg:col-span-1"
            >
              <option value="newest">Newest Date</option>
              <option value="oldest">Oldest Date</option>
              <option value="weightHigh">Weight High-Low</option>
              <option value="weightLow">Weight Low-High</option>
            </select>

          </div>

        </div>

        {/* PART 4: FORM */}

        {showForm && (
          <div className="mb-5 rounded-xl border border-white/10 bg-[#0b1925] p-4 sm:p-5">

            <div className="flex items-center justify-between gap-3">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400">
                  Progress
                </p>

                <h2 className="mt-1 text-lg font-black">
                  {editingId
                    ? "Edit Progress Record"
                    : "Add Progress Record"}
                </h2>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="cursor-pointer text-slate-500 transition hover:text-white"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5"
            >

              <select
                name="member_id"
                value={formData.member_id}
                onChange={handleChange}
                required
                className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
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

              <input
                type="date"
                name="record_date"
                value={formData.record_date}
                onChange={handleChange}
                required
                className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
              />

              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                placeholder="Weight (kg)"
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />

              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                required
                min="0"
                step="0.1"
                placeholder="Height (cm)"
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />

              <input
                type="number"
                name="body_fat"
                value={formData.body_fat}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.1"
                placeholder="Body Fat (%)"
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />

              <div className="flex flex-col gap-2 sm:flex-row md:col-span-2 lg:col-span-5">

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-lime-300 sm:w-auto"
                >
                  {editingId
                    ? "Update Progress"
                    : "Save Progress"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Cancel
                </button>

              </div>

            </form>
          </div>
        )}

        {/* PART 5: PROGRESS TABLE */}

        <div className="mx-auto w-full max-w-[1100px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1925]">

          <div className="border-b border-white/10 bg-[#0d1d2a] px-4 py-4 sm:px-5">

            <h2 className="text-lg font-bold">
              Progress Records
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Member fitness measurements
            </p>

          </div>

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[950px] text-left">

              <thead>
                <tr className="border-b border-white/10">

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    ID
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Member
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Weight
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Height
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Body Fat
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredProgress.map((record) => (

                  <tr
                    key={record.progress_id}
                    className="border-b border-white/5 transition hover:bg-white/[0.025]"
                  >

                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-500">
                      P{String(record.progress_id).padStart(3, "0")}
                    </td>

                    <td className="px-4 py-3.5">

                      <div className="flex items-center gap-2.5">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-[10px] font-black text-lime-400">
                          {getInitials(
                            getMemberName(record.member_id)
                          )}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-bold text-white">
                            {getMemberName(record.member_id)}
                          </p>

                          <p className="text-[11px] text-slate-600">
                            Member
                          </p>

                        </div>

                      </div>

                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">
                      {record.record_date
                        ? new Date(
                            record.record_date
                          ).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })
                        : "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-300">
                      {record.weight} kg
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-300">
                      {record.height} cm
                    </td>

                    <td className="px-4 py-3.5">

                      <span className="whitespace-nowrap rounded-full bg-lime-400/10 px-2.5 py-1 text-[10px] font-black text-lime-400">
                        {record.body_fat}%
                      </span>

                    </td>

                    <td className="px-4 py-3.5">

                      <div className="flex justify-center gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(record)
                          }
                          className="cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-lime-400/30 hover:text-lime-400"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(record.progress_id)
                          }
                          className="cursor-pointer rounded-md border border-red-400/10 px-3 py-1.5 text-[11px] font-bold text-red-400 transition hover:bg-red-400/10"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

                {filteredProgress.length === 0 && (

                  <tr>

                    <td
                      colSpan="7"
                      className="px-5 py-12 text-center"
                    >

                      <p className="text-sm font-bold text-slate-400">
                        No progress records found
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Try changing your search or member filter.
                      </p>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          {/* PART 6: TABLE FOOTER */}

          <div className="border-t border-white/10 px-4 py-3 sm:px-5">

            <p className="text-xs text-slate-600">
              Showing {filteredProgress.length} of{" "}
              {progress.length} progress records
            </p>

          </div>

        </div>

      </div>

      {/* PART 7: DELETE MODAL */}

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Delete Progress Record?"
        message="Are you sure you want to delete this progress record? This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

    </div>
  );
}

export default Progress;