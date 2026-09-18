import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import Notification from "../components/Notification";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [notification, setNotification] = useState({
    type: "success",
    message: ""
  });

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

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!categoryName.trim()) {
      setNotification({
        type: "error",
        message: "Category name is required."
      });
      return;
    }

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, {
          category_name: categoryName.trim()
        });

        setNotification({
          type: "success",
          message: "Category updated successfully."
        });
      } else {
        await api.post("/categories", {
          category_name: categoryName.trim()
        });

        setNotification({
          type: "success",
          message: "Category added successfully."
        });
      }

      setCategoryName("");
      setEditingId(null);
      await fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save category."
      });
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.category_id);
    setCategoryName(category.category_name);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/categories/${deleteId}`);

      await fetchCategories();

      setDeleteId(null);

      setNotification({
        type: "success",
        message: "Category deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting category:", error);

      setDeleteId(null);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete category."
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setCategoryName("");
  };

  const filteredCategories = useMemo(() => {
    const searchText = search.toLowerCase();

    const result = categories.filter((category) =>
      category.category_name
        ?.toLowerCase()
        .includes(searchText)
    );

    return result.sort((a, b) => {
      if (sortBy === "newest") {
        return Number(b.category_id) - Number(a.category_id);
      }

      if (sortBy === "oldest") {
        return Number(a.category_id) - Number(b.category_id);
      }

      if (sortBy === "nameAZ") {
        return (a.category_name || "").localeCompare(
          b.category_name || ""
        );
      }

      if (sortBy === "nameZA") {
        return (b.category_name || "").localeCompare(
          a.category_name || ""
        );
      }

      return 0;
    });
  }, [categories, search, sortBy]);

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
              Categories
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage exercise categories used in your gym
            </p>
          </div>

          <div className="w-full rounded-lg border border-white/10 bg-[#0b1925] px-4 py-2.5 sm:w-auto">
            <span className="text-xs text-slate-500">
              Total Categories
            </span>

            <span className="ml-2 text-sm font-black text-lime-400">
              {categories.length}
            </span>
          </div>
        </div>

        {/* PART 2: FILTERS */}

        <div className="mb-5 w-full rounded-xl border border-white/10 bg-[#0b1925] p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

            <div className="col-span-2 lg:col-span-2">
              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search categories..."
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />
            </div>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="col-span-2 w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400 lg:col-span-1"
            >
              <option value="newest">Newest Added</option>
              <option value="oldest">Oldest Added</option>
              <option value="nameAZ">Name A–Z</option>
              <option value="nameZA">Name Z–A</option>
            </select>

          </div>
        </div>

        {/* PART 3: CATEGORY FORM */}

        <div className="mb-5 rounded-xl border border-white/10 bg-[#0b1925] p-4 sm:p-5">

          <div className="flex items-center justify-between gap-3">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400">
                Category
              </p>

              <h2 className="mt-1 text-lg font-black">
                {editingId
                  ? "Edit Category"
                  : "Add Category"}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="cursor-pointer text-slate-500 transition hover:text-white"
              >
                ✕
              </button>
            )}

          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-5 flex flex-col gap-2 sm:flex-row"
          >

            <input
              type="text"
              value={categoryName}
              onChange={(event) =>
                setCategoryName(event.target.value)
              }
              placeholder="Category Name"
              required
              className="w-full flex-1 cursor-text rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
            />

            <button
              type="submit"
              className="w-full cursor-pointer rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-lime-300 sm:w-auto"
            >
              {editingId
                ? "Update Category"
                : "Save Category"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="w-full cursor-pointer rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 sm:w-auto"
              >
                Cancel
              </button>
            )}

          </form>

        </div>

        {/* PART 4: CATEGORY TABLE */}

        <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1925]">

          <div className="border-b border-white/10 bg-[#0d1d2a] px-4 py-4 sm:px-5">

            <h2 className="text-lg font-bold">
              Exercise Categories
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Categories stored in the database
            </p>

          </div>

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[650px] text-left">

              <thead>
                <tr className="border-b border-white/10">

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    ID
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Category
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody>

                {filteredCategories.map((category) => (

                  <tr
                    key={category.category_id}
                    className="border-b border-white/5 transition hover:bg-white/[0.025]"
                  >

                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-500">
                      C{String(category.category_id).padStart(3, "0")}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-white">
                        {category.category_name}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">

                      <div className="flex justify-center gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(category)
                          }
                          className="cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-lime-400/30 hover:text-lime-400"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(category.category_id)
                          }
                          className="cursor-pointer rounded-md border border-red-400/10 px-3 py-1.5 text-[11px] font-bold text-red-400 transition hover:bg-red-400/10"
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

                {filteredCategories.length === 0 && (

                  <tr>

                    <td
                      colSpan="3"
                      className="px-5 py-12 text-center"
                    >

                      <p className="text-sm font-bold text-slate-400">
                        No categories found
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        Try changing your search.
                      </p>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          {/* PART 5: TABLE FOOTER */}

          <div className="border-t border-white/10 px-4 py-3 sm:px-5">

            <p className="text-xs text-slate-600">
              Showing {filteredCategories.length} of{" "}
              {categories.length} categories
            </p>

          </div>

        </div>

      </div>

      {/* PART 6: DELETE MODAL */}

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Delete Category?"
        message="Are you sure you want to delete this category? This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

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

export default Categories;