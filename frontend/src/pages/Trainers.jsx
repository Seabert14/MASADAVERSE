import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import Notification from "../components/Notification";

function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState(
    "All Specializations"
  );
  const [sortBy, setSortBy] = useState("newest");
  const [formError, setFormError] = useState("");

  const [notification, setNotification] = useState({
    type: "",
    message: ""
  });

  const specializationOptions = [
    "Strength Training",
    "Personal Training",
    "Weight Loss",
    "Bodybuilding",
    "CrossFit",
    "Cardio",
    "Yoga",
    "Nutrition"
  ];

  const [formData, setFormData] = useState({
    trainer_name: "",
    trainer_email: "",
    trainer_phone: "",
    trainer_specialization: ""
  });

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const response = await api.get("/trainers");
      setTrainers(response.data);
    } catch (error) {
      console.error("Error fetching trainers:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load trainers. Please try again."
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

    const name = formData.trainer_name.trim();
    const email = formData.trainer_email.trim();
    const phone = formData.trainer_phone.trim();
    const specialization = formData.trainer_specialization;

    if (!name) {
      setFormError("Please enter the trainer name.");
      return;
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setFormError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (!specialization) {
      setFormError("Please select a specialization.");
      return;
    }

    try {
      const dataToSend = {
        trainer_name: name,
        trainer_email: email,
        trainer_phone: phone,
        trainer_specialization: specialization
      };

      if (editingId) {
        await api.put(`/trainers/${editingId}`, dataToSend);

        setNotification({
          type: "success",
          message: "Trainer updated successfully."
        });
      } else {
        await api.post("/trainers", dataToSend);

        setNotification({
          type: "success",
          message: "Trainer added successfully."
        });
      }

      await fetchTrainers();
      resetForm();
    } catch (error) {
      console.error("Error saving trainer:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save trainer. Please try again."
      });
    }
  };

  const handleEdit = (trainer) => {
    setFormError("");
    setEditingId(trainer.trainer_id);

    setFormData({
      trainer_name: trainer.trainer_name || "",
      trainer_email: trainer.trainer_email || "",
      trainer_phone: trainer.trainer_phone || "",
      trainer_specialization: trainer.trainer_specialization || ""
    });

    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/trainers/${deleteId}`);

      await fetchTrainers();

      setDeleteId(null);

      setNotification({
        type: "success",
        message: "Trainer deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting trainer:", error);

      setDeleteId(null);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete trainer. Please try again."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      trainer_name: "",
      trainer_email: "",
      trainer_phone: "",
      trainer_specialization: ""
    });

    setFormError("");
    setEditingId(null);
    setShowForm(false);
  };

  const filteredTrainers = useMemo(() => {
    const searchText = search.toLowerCase();

    const result = trainers.filter((trainer) => {
      const matchesSearch =
        trainer.trainer_name?.toLowerCase().includes(searchText) ||
        trainer.trainer_email?.toLowerCase().includes(searchText) ||
        trainer.trainer_phone?.toLowerCase().includes(searchText) ||
        trainer.trainer_specialization
          ?.toLowerCase()
          .includes(searchText);

      const matchesSpecialization =
        specializationFilter === "All Specializations" ||
        trainer.trainer_specialization === specializationFilter;

      return matchesSearch && matchesSpecialization;
    });

    return result.sort((a, b) => {
      if (sortBy === "newest") {
        return Number(b.trainer_id) - Number(a.trainer_id);
      }

      if (sortBy === "oldest") {
        return Number(a.trainer_id) - Number(b.trainer_id);
      }

      if (sortBy === "nameAsc") {
        return (a.trainer_name || "").localeCompare(
          b.trainer_name || ""
        );
      }

      if (sortBy === "nameDesc") {
        return (b.trainer_name || "").localeCompare(
          a.trainer_name || ""
        );
      }

      return 0;
    });
  }, [trainers, search, specializationFilter, sortBy]);

  const getInitials = (name) => {
    if (!name) {
      return "T";
    }

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#071019] px-4 py-6 text-white sm:px-5">
      <div className="mx-auto w-full max-w-[1200px]">

        {/* PART 1 — HEADER */}
        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
              Management
            </p>

            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              Trainers
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your gym trainers
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setFormError("");
                setShowForm(true);
              }
            }}
            className="w-full cursor-pointer rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-lime-300 sm:w-auto"
          >
            {showForm ? "Close" : "+ Add Trainer"}
          </button>
        </div>

        {/* PART 2 — FILTERS AND SEARCH */}
        <div className="mb-5 w-full rounded-xl border border-white/10 bg-[#0b1925] p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            <div className="col-span-2 rounded-lg border border-white/10 bg-[#07131e] px-4 py-2.5 text-sm text-slate-400 lg:col-span-1">
              Total Trainers:{" "}
              <span className="font-bold text-white">
                {trainers.length}
              </span>
            </div>

            <select
              value={specializationFilter}
              onChange={(event) =>
                setSpecializationFilter(event.target.value)
              }
              className="col-span-2 cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400 lg:col-span-1"
            >
              <option value="All Specializations">
                All Specializations
              </option>

              {specializationOptions.map((specialization) => (
                <option
                  key={specialization}
                  value={specialization}
                >
                  {specialization}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="col-span-2 cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400 lg:col-span-1"
            >
              <option value="newest">Newest Added</option>
              <option value="oldest">Oldest Added</option>
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
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />
            </div>

          </div>
        </div>

        {/* PART 3 — ADD / EDIT FORM */}
        {showForm && (
          <div className="mb-5 rounded-xl border border-white/10 bg-[#0b1925] p-4 sm:p-5">

            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400">
                  Trainer
                </p>

                <h2 className="mt-1 text-lg font-black">
                  {editingId ? "Edit Trainer" : "Add Trainer"}
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

            {formError && (
              <div className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-400">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4"
            >

              <input
                type="text"
                name="trainer_name"
                placeholder="Trainer Name"
                value={formData.trainer_name}
                onChange={handleChange}
                required
                className="cursor-text rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />

              <input
                type="email"
                name="trainer_email"
                placeholder="Email"
                value={formData.trainer_email}
                onChange={handleChange}
                required
                className="cursor-text rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />

              <input
                type="tel"
                name="trainer_phone"
                placeholder="Phone Number"
                value={formData.trainer_phone}
                onChange={(event) => {
                  setFormError("");

                  setFormData({
                    ...formData,
                    trainer_phone: event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10)
                  });
                }}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                required
                className="cursor-text rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />

              <select
                name="trainer_specialization"
                value={formData.trainer_specialization}
                onChange={handleChange}
                required
                className="cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
              >
                <option value="">Select Specialization</option>

                {specializationOptions.map((specialization) => (
                  <option
                    key={specialization}
                    value={specialization}
                  >
                    {specialization}
                  </option>
                ))}
              </select>

              <div className="flex flex-col gap-2 sm:flex-row md:col-span-2 lg:col-span-4">
                <button
                  type="submit"
                  className="cursor-pointer rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-lime-300"
                >
                  {editingId ? "Update Trainer" : "Save Trainer"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        )}

        {/* PART 4 — TRAINER TABLE */}
        <div className="mx-auto w-full max-w-[1050px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1925]">
          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[900px] text-left">

              <thead>
                <tr className="border-b border-white/10 bg-[#0d1d2a]">

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    ID
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Trainer
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Specialization
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Phone
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Email
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredTrainers.map((trainer) => (
                  <tr
                    key={trainer.trainer_id}
                    className="border-b border-white/5 transition hover:bg-white/[0.025]"
                  >

                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-400">
                      T{String(trainer.trainer_id).padStart(3, "0")}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-400/10 text-xs font-black text-lime-400">
                          {getInitials(trainer.trainer_name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {trainer.trainer_name}
                          </p>

                          <p className="text-[11px] text-slate-600">
                            Trainer
                          </p>
                        </div>

                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="whitespace-nowrap rounded-full bg-lime-400/10 px-2.5 py-1 text-[10px] font-bold text-lime-400">
                        {trainer.trainer_specialization}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">
                      {trainer.trainer_phone}
                    </td>

                    <td className="px-4 py-3.5 text-sm text-slate-400">
                      <span className="block max-w-[190px] truncate">
                        {trainer.trainer_email}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">

                        <button
                          type="button"
                          onClick={() => handleEdit(trainer)}
                          className="cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-lime-400/30 hover:text-lime-400"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(trainer.trainer_id)
                          }
                          className="cursor-pointer rounded-md border border-red-400/10 px-3 py-1.5 text-[11px] font-bold text-red-400 transition hover:bg-red-400/10"
                        >
                          Delete
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

                {filteredTrainers.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-12 text-center"
                    >
                      <p className="text-sm font-bold text-slate-400">
                        No trainers found
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

        {/* PART 5 — DELETE CONFIRMATION */}
        <DeleteConfirmModal
          isOpen={deleteId !== null}
          title="Delete Trainer?"
          message="Are you sure you want to delete this trainer? This action cannot be undone."
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />

        {/* PART 6 — NOTIFICATION */}
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
    </div>
  );
}

export default Trainers;