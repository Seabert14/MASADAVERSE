import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import Notification from "../components/Notification";

function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [workoutFilter, setWorkoutFilter] = useState("All Workouts");
  const [sortBy, setSortBy] = useState("newest");
  const [formError, setFormError] = useState("");

  const [notification, setNotification] = useState({
    type: "success",
    message: ""
  });

  const [formData, setFormData] = useState({
    exercise_name: "",
    category_id: "",
    workout_id: ""
  });

  useEffect(() => {
    fetchExercises();
    fetchWorkouts();
    fetchCategories();
  }, []);

  const fetchExercises = async () => {
    try {
      const response = await api.get("/exercises");
      setExercises(response.data);
    } catch (error) {
      console.error("Error fetching exercises:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load exercises."
      });
    }
  };

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
          "Unable to load workout plans."
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load categories."
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

    const exerciseName = formData.exercise_name.trim();
    const categoryId = formData.category_id;
    const workoutId = formData.workout_id;

    if (!exerciseName) {
      setFormError("Please enter the exercise name.");
      return;
    }

    if (!categoryId) {
      setFormError("Please select an exercise category.");
      return;
    }

    if (!workoutId) {
      setFormError("Please select a workout plan.");
      return;
    }

    try {
      const dataToSend = {
        exercise_name: exerciseName,
        category_id: categoryId,
        workout_id: workoutId
      };

      if (editingId) {
        await api.put(`/exercises/${editingId}`, dataToSend);

        setNotification({
          type: "success",
          message: "Exercise updated successfully."
        });
      } else {
        await api.post("/exercises", dataToSend);

        setNotification({
          type: "success",
          message: "Exercise added successfully."
        });
      }

      await fetchExercises();
      resetForm();
    } catch (error) {
      console.error("Error saving exercise:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save exercise."
      });
    }
  };

  const handleEdit = (exercise) => {
    setFormError("");
    setEditingId(exercise.exercise_id);

    setFormData({
      exercise_name: exercise.exercise_name || "",
      category_id: exercise.category_id || "",
      workout_id: exercise.workout_id || ""
    });

    setShowForm(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/exercises/${deleteId}`);

      await fetchExercises();

      setDeleteId(null);

      setNotification({
        type: "success",
        message: "Exercise deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting exercise:", error);

      setDeleteId(null);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete exercise."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      exercise_name: "",
      category_id: "",
      workout_id: ""
    });

    setFormError("");
    setEditingId(null);
    setShowForm(false);
  };

  const getWorkoutName = (workoutId) => {
    const workout = workouts.find(
      (item) => Number(item.workout_id) === Number(workoutId)
    );

    return workout?.workout_name || "Unknown Workout";
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(
      (item) => Number(item.category_id) === Number(categoryId)
    );

    return category?.category_name || "Unknown Category";
  };

  const filteredExercises = useMemo(() => {
    let result = [...exercises];

    if (search.trim()) {
      const searchText = search.toLowerCase();

      result = result.filter((exercise) => {
        const workoutName = getWorkoutName(exercise.workout_id);
        const categoryName = getCategoryName(exercise.category_id);

        return (
          exercise.exercise_name
            ?.toLowerCase()
            .includes(searchText) ||
          categoryName.toLowerCase().includes(searchText) ||
          workoutName.toLowerCase().includes(searchText)
        );
      });
    }

    if (categoryFilter !== "All Categories") {
      result = result.filter(
        (exercise) =>
          Number(exercise.category_id) === Number(categoryFilter)
      );
    }

    if (workoutFilter !== "All Workouts") {
      result = result.filter(
        (exercise) =>
          Number(exercise.workout_id) === Number(workoutFilter)
      );
    }

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return Number(b.exercise_id) - Number(a.exercise_id);
      }

      if (sortBy === "oldest") {
        return Number(a.exercise_id) - Number(b.exercise_id);
      }

      if (sortBy === "nameAZ") {
        return (a.exercise_name || "").localeCompare(
          b.exercise_name || ""
        );
      }

      if (sortBy === "nameZA") {
        return (b.exercise_name || "").localeCompare(
          a.exercise_name || ""
        );
      }

      return 0;
    });

    return result;
  }, [
    exercises,
    workouts,
    categories,
    search,
    categoryFilter,
    workoutFilter,
    sortBy
  ]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#071019] px-4 py-6 text-white sm:px-5">
      <div className="mx-auto w-full max-w-[1200px]">

        {/* PART 1: HEADER */}

        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
              Management
            </p>

            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              Exercises
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage exercises assigned to workout plans
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
            {showForm ? "Close" : "+ Add Exercise"}
          </button>
        </div>

        {/* PART 2: STATS */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Exercises
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              {exercises.length}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Exercises
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Workout Plans
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              {workouts.length}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Workout plans
            </p>
          </div>

        </div>

        {/* PART 3: FILTERS */}

        <div className="mb-5 w-full rounded-xl border border-white/10 bg-[#0b1925] p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

            <div className="relative col-span-2 lg:col-span-1">
              <input
                type="text"
                placeholder="Search exercises..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400"
            >
              <option value="All Categories">
                All Categories
              </option>

              {categories.map((category) => (
                <option
                  key={category.category_id}
                  value={category.category_id}
                >
                  {category.category_name}
                </option>
              ))}
            </select>

            <select
              value={workoutFilter}
              onChange={(event) =>
                setWorkoutFilter(event.target.value)
              }
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400"
            >
              <option value="All Workouts">
                All Workouts
              </option>

              {workouts.map((workout) => (
                <option
                  key={workout.workout_id}
                  value={workout.workout_id}
                >
                  {workout.workout_name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="col-span-2 w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400 lg:col-span-1"
            >
              <option value="newest">Newest Added</option>
              <option value="oldest">Oldest Added</option>
              <option value="nameAZ">Name A–Z</option>
              <option value="nameZA">Name Z–A</option>
            </select>

          </div>
        </div>

        {/* PART 4: FORM */}

        {showForm && (
          <div className="mb-5 rounded-xl border border-white/10 bg-[#0b1925] p-4 sm:p-5">

            <div className="flex items-center justify-between gap-3">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400">
                  Exercise
                </p>

                <h2 className="mt-1 text-lg font-black">
                  {editingId ? "Edit Exercise" : "Add Exercise"}
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
              className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3"
            >

              <input
                type="text"
                name="exercise_name"
                placeholder="Exercise Name"
                value={formData.exercise_name}
                onChange={handleChange}
                required
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />

              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
              >
                <option value="">Select Category</option>

                {categories.map((category) => (
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.category_name}
                  </option>
                ))}
              </select>

              <select
                name="workout_id"
                value={formData.workout_id}
                onChange={handleChange}
                required
                className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
              >
                <option value="">Select Workout Plan</option>

                {workouts.map((workout) => (
                  <option
                    key={workout.workout_id}
                    value={workout.workout_id}
                  >
                    {workout.workout_name}
                  </option>
                ))}
              </select>

              <div className="flex flex-col gap-2 sm:flex-row md:col-span-3">

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-lime-300 sm:w-auto"
                >
                  {editingId
                    ? "Update Exercise"
                    : "Save Exercise"}
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

        {/* PART 5: EXERCISE TABLE */}

        <div className="mx-auto w-full max-w-[1050px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1925]">

          <div className="border-b border-white/10 bg-[#0d1d2a] px-4 py-4 sm:px-5">

            <h2 className="text-lg font-bold">
              Exercise Library
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Exercises assigned to workout plans
            </p>

          </div>

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[850px] text-left">

              <thead>
                <tr className="border-b border-white/10">

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    ID
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Exercise
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Category
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Workout Plan
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredExercises.map((exercise) => {

                  const categoryName = getCategoryName(
                    exercise.category_id
                  );

                  return (
                    <tr
                      key={exercise.exercise_id}
                      className="border-b border-white/5 transition hover:bg-white/[0.025]"
                    >

                      <td className="px-4 py-3.5 text-sm font-semibold text-slate-500">
                        E{String(exercise.exercise_id).padStart(3, "0")}
                      </td>

                      <td className="px-4 py-3.5">

                        <div>
                          <p className="text-sm font-bold text-white">
                            {exercise.exercise_name}
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-600">
                            Exercise
                          </p>
                        </div>

                      </td>

                      <td className="px-4 py-3.5">

                        <span className="whitespace-nowrap rounded-full bg-lime-400/10 px-2.5 py-1 text-[10px] font-bold text-lime-400">
                          {categoryName}
                        </span>

                      </td>

                      <td className="px-4 py-3.5 text-sm text-slate-300">
                        {getWorkoutName(exercise.workout_id)}
                      </td>

                      <td className="px-4 py-3.5">

                        <div className="flex justify-center gap-2">

                          <button
                            type="button"
                            onClick={() => handleEdit(exercise)}
                            className="cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-lime-400/30 hover:text-lime-400"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(exercise.exercise_id)
                            }
                            className="cursor-pointer rounded-md border border-red-400/10 px-3 py-1.5 text-[11px] font-bold text-red-400 transition hover:bg-red-400/10"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  );
                })}

                {filteredExercises.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-5 py-12 text-center"
                    >
                      <p className="text-sm font-bold text-slate-400">
                        No exercises found
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

          {/* PART 6: TABLE FOOTER */}

          <div className="border-t border-white/10 px-4 py-3 sm:px-5">
            <p className="text-xs text-slate-600">
              Showing {filteredExercises.length} of{" "}
              {exercises.length} exercises
            </p>
          </div>

        </div>

      </div>

      {/* PART 7: DELETE MODAL */}

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Delete Exercise?"
        message="Are you sure you want to delete this exercise? This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      {/* PART 8: NOTIFICATION */}

      <Notification
        type={notification.type}
        message={notification.message}
        onClose={() =>
          setNotification({
            type: "success",
            message: ""
          })
        }
      />

    </div>
  );
}

export default Exercises;