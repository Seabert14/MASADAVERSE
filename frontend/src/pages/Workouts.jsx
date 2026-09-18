import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import Notification from "../components/Notification";

function Workouts() {
  const [workouts, setWorkouts] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [trainerFilter, setTrainerFilter] = useState("All Trainers");
  const [sortBy, setSortBy] = useState("newest");
  const [formError, setFormError] = useState("");

  const [notification, setNotification] = useState({
    type: "",
    message: ""
  });

  const [formData, setFormData] = useState({
    workout_name: "",
    trainer_id: ""
  });

  useEffect(() => {
    fetchWorkouts();
    fetchTrainers();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const response = await api.get("/workouts");
      setWorkouts(response.data);
    } catch (error) {
      console.error("Error fetching workouts:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load workout plans. Please try again."
      });
    }
  };

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
    const { name, value } = event.target;

    setFormError("");

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const workoutName = formData.workout_name.trim();
    const trainerId = formData.trainer_id;

    if (!workoutName) {
      setFormError("Please enter the workout plan name.");
      return;
    }

    if (!trainerId) {
      setFormError("Please select a trainer.");
      return;
    }

    try {
      const dataToSend = {
        workout_name: workoutName,
        trainer_id: trainerId
      };

      if (editingId) {
        await api.put(`/workouts/${editingId}`, dataToSend);

        setNotification({
          type: "success",
          message: "Workout plan updated successfully."
        });
      } else {
        await api.post("/workouts", dataToSend);

        setNotification({
          type: "success",
          message: "Workout plan added successfully."
        });
      }

      await fetchWorkouts();
      resetForm();
    } catch (error) {
      console.error("Error saving workout:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save workout plan. Please try again."
      });
    }
  };

  const handleEdit = (workout) => {
    setFormError("");
    setEditingId(workout.workout_id);

    setFormData({
      workout_name: workout.workout_name || "",
      trainer_id: workout.trainer_id || ""
    });

    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/workouts/${deleteId}`);

      await fetchWorkouts();

      setDeleteId(null);

      setNotification({
        type: "success",
        message: "Workout plan deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting workout:", error);

      setDeleteId(null);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete workout plan. Please try again."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      workout_name: "",
      trainer_id: ""
    });

    setFormError("");
    setEditingId(null);
    setShowForm(false);
  };

  const getTrainerName = (trainerId) => {
    const trainer = trainers.find(
      (item) => Number(item.trainer_id) === Number(trainerId)
    );

    return trainer?.trainer_name || "Unknown Trainer";
  };

  const trainerOptions = useMemo(() => {
    return trainers.map((trainer) => ({
      id: trainer.trainer_id,
      name: trainer.trainer_name
    }));
  }, [trainers]);

  const filteredWorkouts = useMemo(() => {
    let result = [...workouts];

    if (search.trim()) {
      const searchText = search.toLowerCase();

      result = result.filter((workout) => {
        const trainerName = getTrainerName(workout.trainer_id);

        return (
          workout.workout_name
            ?.toLowerCase()
            .includes(searchText) ||
          trainerName.toLowerCase().includes(searchText)
        );
      });
    }

    if (trainerFilter !== "All Trainers") {
      result = result.filter(
        (workout) =>
          Number(workout.trainer_id) === Number(trainerFilter)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return Number(b.workout_id) - Number(a.workout_id);
      }

      if (sortBy === "oldest") {
        return Number(a.workout_id) - Number(b.workout_id);
      }

      if (sortBy === "nameAZ") {
        return (a.workout_name || "").localeCompare(
          b.workout_name || ""
        );
      }

      if (sortBy === "nameZA") {
        return (b.workout_name || "").localeCompare(
          a.workout_name || ""
        );
      }

      return 0;
    });

    return result;
  }, [
    workouts,
    trainers,
    search,
    trainerFilter,
    sortBy
  ]);

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
              Workout Plans
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage workout plans and assigned trainers
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
            {showForm ? "Close" : "+ Add Workout"}
          </button>
        </div>

        {/* PART 2 — STATISTICS */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Plans
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              {workouts.length}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Workout plans
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Trainers
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              {trainers.length}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Available trainers
            </p>
          </div>

        </div>

        {/* PART 3 — FILTERS AND SEARCH */}
        <div className="mb-5 w-full rounded-xl border border-white/10 bg-[#0b1925] p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

            <div className="relative col-span-2 lg:col-span-1">
              <input
                type="text"
                placeholder="Search workout plans..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />
            </div>

            <select
              value={trainerFilter}
              onChange={(event) =>
                setTrainerFilter(event.target.value)
              }
              className="col-span-2 cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400 lg:col-span-1"
            >
              <option value="All Trainers">
                All Trainers
              </option>

              {trainerOptions.map((trainer) => (
                <option
                  key={trainer.id}
                  value={trainer.id}
                >
                  {trainer.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="col-span-2 cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400 lg:col-span-1"
            >
              <option value="newest">
                Newest Added
              </option>

              <option value="oldest">
                Oldest Added
              </option>

              <option value="nameAZ">
                Name A–Z
              </option>

              <option value="nameZA">
                Name Z–A
              </option>
            </select>

          </div>
        </div>

        {/* PART 4 — ADD / EDIT FORM */}
        {showForm && (
          <div className="mb-5 rounded-xl border border-white/10 bg-[#0b1925] p-4 sm:p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400">
                  Workout
                </p>

                <h2 className="mt-1 text-lg font-black">
                  {editingId
                    ? "Edit Workout Plan"
                    : "Add Workout Plan"}
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
              className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2"
            >

              <input
                type="text"
                name="workout_name"
                placeholder="Workout Name"
                value={formData.workout_name}
                onChange={handleChange}
                required
                className="cursor-text rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />

              <select
                name="trainer_id"
                value={formData.trainer_id}
                onChange={handleChange}
                required
                className="cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
              >
                <option value="">
                  Select Trainer
                </option>

                {trainers.map((trainer) => (
                  <option
                    key={trainer.trainer_id}
                    value={trainer.trainer_id}
                  >
                    {trainer.trainer_name}
                  </option>
                ))}
              </select>

              <div className="flex flex-col gap-2 sm:flex-row md:col-span-2">

                <button
                  type="submit"
                  className="cursor-pointer rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-lime-300"
                >
                  {editingId
                    ? "Update Plan"
                    : "Save Plan"}
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

        {/* PART 5 — WORKOUT PLAN TABLE */}
        <div className="mx-auto w-full max-w-[1050px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1925]">

          <div className="border-b border-white/10 bg-[#0d1d2a] px-4 py-4 sm:px-5">

            <h2 className="text-lg font-bold">
              Workout Plans
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Assigned workout plans and trainers
            </p>

          </div>

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[850px] text-left">

              <thead>
                <tr className="border-b border-white/10 bg-[#0d1d2a]">

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Plan
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Trainer
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Plan ID
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredWorkouts.map((workout) => (
                  <tr
                    key={workout.workout_id}
                    className="border-b border-white/5 transition hover:bg-white/[0.025]"
                  >

                    <td className="px-4 py-3.5">

                      <div>
                        <p className="text-sm font-bold text-white">
                          {workout.workout_name}
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-600">
                          Workout Plan
                        </p>
                      </div>

                    </td>

                    <td className="px-4 py-3.5 text-sm text-slate-300">
                      {getTrainerName(workout.trainer_id)}
                    </td>

                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-500">
                      W{String(workout.workout_id).padStart(3, "0")}
                    </td>

                    <td className="px-4 py-3.5">

                      <div className="flex justify-center gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(workout)
                          }
                          className="cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-lime-400/30 hover:text-lime-400"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(workout.workout_id)
                          }
                          className="cursor-pointer rounded-md border border-red-400/10 px-3 py-1.5 text-[11px] font-bold text-red-400 transition hover:bg-red-400/10"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>
                ))}

                {filteredWorkouts.length === 0 && (
                  <tr>

                    <td
                      colSpan="4"
                      className="px-5 py-12 text-center"
                    >

                      <p className="text-sm font-bold text-slate-400">
                        No workout plans found
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Try changing your search or trainer filter.
                      </p>

                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>

          <div className="border-t border-white/10 px-4 py-3 sm:px-5">

            <p className="text-xs text-slate-600">
              Showing {filteredWorkouts.length} of{" "}
              {workouts.length} workout plans
            </p>

          </div>

        </div>

      </div>

      {/* PART 6 — DELETE CONFIRMATION */}
      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Delete Workout Plan?"
        message="Are you sure you want to delete this workout plan? This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      {/* PART 7 — NOTIFICATION */}
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

export default Workouts;