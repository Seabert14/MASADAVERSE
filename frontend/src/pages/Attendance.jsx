import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import DateInput from "../components/DateInput";
import TimeInput from "../components/TimeInput";
import Notification from "../components/Notification";

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sortBy, setSortBy] = useState("newest");

  const [notification, setNotification] = useState({
    type: "",
    message: ""
  });

  const [formData, setFormData] = useState({
    member_id: "",
    attendance_date: "",
    check_in_time: "",
    check_out_time: "",
    attendance_status: "Present"
  });

  const statusOptions = ["Present", "Absent", "Late"];

  useEffect(() => {
    fetchAttendance();
    fetchMembers();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get("/attendance");
      setAttendance(response.data);
    } catch (error) {
      console.error("Error fetching attendance:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load attendance records."
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

  const resetForm = () => {
    setFormData({
      member_id: "",
      attendance_date: "",
      check_in_time: "",
      check_out_time: "",
      attendance_status: "Present"
    });

    setEditingId(null);
    setShowForm(false);
  };

  const validateForm = () => {
    if (!formData.member_id) {
      return "Please select a member.";
    }

    if (!formData.attendance_date) {
      return "Please select an attendance date.";
    }

    if (!formData.attendance_status) {
      return "Please select an attendance status.";
    }

    if (
      (formData.attendance_status === "Present" ||
        formData.attendance_status === "Late") &&
      !formData.check_in_time
    ) {
      return "Check-in time is required for Present or Late attendance.";
    }

    if (
      formData.check_in_time &&
      formData.check_out_time &&
      formData.check_out_time < formData.check_in_time
    ) {
      return "Check-out time cannot be earlier than check-in time.";
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
        await api.put(`/attendance/${editingId}`, formData);

        setNotification({
          type: "success",
          message: "Attendance updated successfully."
        });
      } else {
        await api.post("/attendance", formData);

        setNotification({
          type: "success",
          message: "Attendance added successfully."
        });
      }

      await fetchAttendance();
      resetForm();
    } catch (error) {
      console.error("Error saving attendance:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save attendance."
      });
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.attendance_id);

    setFormData({
      member_id: record.member_id || "",
      attendance_date:
        record.attendance_date?.substring(0, 10) || "",
      check_in_time: record.check_in_time || "",
      check_out_time: record.check_out_time || "",
      attendance_status:
        record.attendance_status || "Present"
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
      await api.delete(`/attendance/${deleteId}`);

      await fetchAttendance();

      setDeleteId(null);

      setNotification({
        type: "success",
        message: "Attendance record deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting attendance:", error);

      setDeleteId(null);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete attendance record."
      });
    }
  };

  const getMemberName = (memberId) => {
    const member = members.find(
      (item) => Number(item.member_id) === Number(memberId)
    );

    return member?.member_name || "Unknown Member";
  };

  const filteredAttendance = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const result = attendance.filter((record) => {
      const memberName = getMemberName(record.member_id);

      const matchesSearch =
        memberName.toLowerCase().includes(searchText) ||
        String(record.attendance_status || "")
          .toLowerCase()
          .includes(searchText) ||
        String(record.attendance_date || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "All Status" ||
        record.attendance_status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.attendance_date) -
          new Date(a.attendance_date)
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.attendance_date) -
          new Date(b.attendance_date)
        );
      }

      if (sortBy === "nameAZ") {
        return getMemberName(a.member_id).localeCompare(
          getMemberName(b.member_id)
        );
      }

      if (sortBy === "nameZA") {
        return getMemberName(b.member_id).localeCompare(
          getMemberName(a.member_id)
        );
      }

      return 0;
    });
  }, [
    attendance,
    members,
    search,
    statusFilter,
    sortBy
  ]);

  const presentCount = attendance.filter(
    (record) =>
      record.attendance_status?.toLowerCase() === "present"
  ).length;

  const absentCount = attendance.filter(
    (record) =>
      record.attendance_status?.toLowerCase() === "absent"
  ).length;

  const lateCount = attendance.filter(
    (record) =>
      record.attendance_status?.toLowerCase() === "late"
  ).length;

  const getStatusStyle = (status) => {
    const value = status?.toLowerCase();

    if (value === "present") {
      return "bg-lime-400/10 text-lime-400";
    }

    if (value === "late") {
      return "bg-yellow-400/10 text-yellow-300";
    }

    if (value === "absent") {
      return "bg-red-400/10 text-red-400";
    }

    return "bg-white/5 text-slate-400";
  };

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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#06111b] px-4 py-6 text-white sm:px-5 md:px-8 md:py-7">
      <div className="mx-auto w-full max-w-[1200px]">

        {/* PART 1: Header */}

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end lg:items-center">

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
              Management
            </p>

            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              Attendance
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Track member check-ins and attendance history
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
            className="w-full cursor-pointer rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-lime-300 sm:w-auto"
          >
            {showForm ? "Close" : "+ Add Attendance"}
          </button>

        </div>

        {/* PART 2: Statistics */}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Records
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              {attendance.length}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Attendance records
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Present
            </p>

            <h2 className="mt-1.5 text-2xl font-black text-lime-400">
              {presentCount}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Present records
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Absent
                </p>

                <h2 className="mt-1.5 text-2xl font-black text-red-400">
                  {absentCount}
                </h2>
              </div>

              <div>
                <p className="text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Late
                </p>

                <h2 className="mt-1.5 text-right text-2xl font-black text-yellow-300">
                  {lateCount}
                </h2>
              </div>

            </div>

          </div>

        </div>

        {/* PART 3: Filters */}

        <div className="mt-5 w-full rounded-xl border border-white/10 bg-[#0b1925] p-3 sm:p-4">

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

            <div className="col-span-2 lg:col-span-1">
              <input
                type="text"
                placeholder="Search member, date or status..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400"
            >
              <option value="All Status">
                All Status
              </option>

              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400"
            >
              <option value="newest">Newest Date</option>
              <option value="oldest">Oldest Date</option>
              <option value="nameAZ">Member A–Z</option>
              <option value="nameZA">Member Z–A</option>
            </select>

          </div>

        </div>

        {/* PART 4: Add / Edit Form */}

        {showForm && (
          <div className="mt-5 rounded-xl border border-white/10 bg-[#0b1925] p-4 sm:p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400">
                  Attendance
                </p>

                <h2 className="mt-1 text-lg font-black">
                  {editingId
                    ? "Edit Attendance"
                    : "Add Attendance"}
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
              className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
            >

              <select
                name="member_id"
                value={formData.member_id}
                onChange={handleChange}
                required
                className="cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
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

              <DateInput
                name="attendance_date"
                value={formData.attendance_date}
                onChange={handleChange}
                required
              />

              <TimeInput
                name="check_in_time"
                value={formData.check_in_time}
                onChange={handleChange}
              />

              <TimeInput
                name="check_out_time"
                value={formData.check_out_time}
                onChange={handleChange}
              />

              <select
                name="attendance_status"
                value={formData.attendance_status}
                onChange={handleChange}
                required
                className="cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row lg:col-span-5">

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-lime-300 sm:w-auto"
                >
                  {editingId
                    ? "Update Attendance"
                    : "Save Attendance"}
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

        {/* PART 5: Attendance Table */}

        <div className="mx-auto mt-5 w-full max-w-[1100px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1925]">

          <div className="border-b border-white/10 bg-[#0d1d2a] px-4 py-4 sm:px-5">

            <h2 className="text-lg font-bold">
              Attendance Records
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Member attendance history
            </p>

          </div>

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[850px]">

              <thead>
                <tr className="border-b border-white/10 text-left">

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Member
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Check In
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Check Out
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredAttendance.map((record) => (
                  <tr
                    key={record.attendance_id}
                    className="border-b border-white/5 transition hover:bg-white/[0.025]"
                  >

                    <td className="px-4 py-3.5">

                      <div className="flex items-center gap-2.5">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-black text-lime-400">
                          {getMemberName(record.member_id)
                            .charAt(0)
                            .toUpperCase()}
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
                      {formatDate(record.attendance_date)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">
                      {record.check_in_time || "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">
                      {record.check_out_time || "-"}
                    </td>

                    <td className="px-4 py-3.5">

                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-black ${getStatusStyle(
                          record.attendance_status
                        )}`}
                      >
                        {record.attendance_status}
                      </span>

                    </td>

                    <td className="px-4 py-3.5">

                      <div className="flex justify-center gap-2">

                        <button
                          onClick={() =>
                            handleEdit(record)
                          }
                          className="cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-lime-400/30 hover:text-lime-400"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              record.attendance_id
                            )
                          }
                          className="cursor-pointer rounded-md border border-red-400/10 px-3 py-1.5 text-[11px] font-bold text-red-400 transition hover:bg-red-400/10"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

                {filteredAttendance.length === 0 && (
                  <tr>

                    <td
                      colSpan="6"
                      className="px-5 py-12 text-center"
                    >
                      <p className="text-sm font-bold text-slate-400">
                        No attendance records found
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Try changing your search or filters.
                      </p>
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

          <div className="border-t border-white/10 px-4 py-3 sm:px-5">

            <p className="text-xs text-slate-600">
              Showing {filteredAttendance.length} of{" "}
              {attendance.length} records
            </p>

          </div>

        </div>

      </div>

      {/* PART 6: Delete Confirmation */}

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Delete Attendance?"
        message="Are you sure you want to delete this attendance record? This action cannot be undone."
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

export default Attendance;