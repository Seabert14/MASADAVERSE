import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import DateInput from "../components/DateInput";
import Notification from "../components/Notification";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [sortBy, setSortBy] = useState("newest");

  const [notification, setNotification] = useState({
    type: "",
    message: ""
  });

  const paymentTypes = [
    "Cash",
    "UPI",
    "Card",
    "Bank Transfer"
  ];

  const [formData, setFormData] = useState({
    payment_date: "",
    payment_type: "",
    plan_id: "",
    plan_amount: ""
  });

  useEffect(() => {
    fetchPayments();
    fetchMemberships();
    fetchMembers();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get("/payments");
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to load payments."
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
          "Unable to load memberships."
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

    if (name === "plan_id") {
      const selectedMembership = memberships.find(
        (membership) =>
          Number(membership.plan_id) === Number(value)
      );

      setFormData((previous) => ({
        ...previous,
        plan_id: value,
        plan_amount: selectedMembership
          ? selectedMembership.plan_amount
          : ""
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.payment_date) {
      setNotification({
        type: "error",
        message: "Please select a payment date."
      });
      return false;
    }

    if (!formData.payment_type) {
      setNotification({
        type: "error",
        message: "Please select a payment type."
      });
      return false;
    }

    if (!formData.plan_id) {
      setNotification({
        type: "error",
        message: "Please select a membership."
      });
      return false;
    }

    if (
      !formData.plan_amount ||
      Number(formData.plan_amount) <= 0
    ) {
      setNotification({
        type: "error",
        message: "Payment amount must be greater than 0."
      });
      return false;
    }

    const selectedMembership = memberships.find(
      (membership) =>
        Number(membership.plan_id) === Number(formData.plan_id)
    );

    if (!selectedMembership) {
      setNotification({
        type: "error",
        message: "Selected membership could not be found."
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const isEditing = Boolean(editingId);

      if (editingId) {
        await api.put(`/payments/${editingId}`, formData);
      } else {
        await api.post("/payments", formData);
      }

      await fetchPayments();
      resetForm();

      setNotification({
        type: "success",
        message: isEditing
          ? "Payment updated successfully."
          : "Payment added successfully."
      });
    } catch (error) {
      console.error("Error saving payment:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to save payment."
      });
    }
  };

  const handleEdit = (payment) => {
    setEditingId(payment.payment_id);

    setFormData({
      payment_date:
        payment.payment_date?.substring(0, 10) ?? "",
      payment_type: payment.payment_type ?? "",
      plan_id: payment.plan_id ?? "",
      plan_amount: payment.plan_amount ?? ""
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
      await api.delete(`/payments/${deleteId}`);
      await fetchPayments();
      setDeleteId(null);

      setNotification({
        type: "success",
        message: "Payment deleted successfully."
      });
    } catch (error) {
      console.error("Error deleting payment:", error);

      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to delete payment."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      payment_date: "",
      payment_type: "",
      plan_id: "",
      plan_amount: ""
    });

    setEditingId(null);
    setShowForm(false);
  };

  const getMembership = (planId) => {
    return memberships.find(
      (membership) =>
        Number(membership.plan_id) === Number(planId)
    );
  };

  const getMemberName = (planId) => {
    const membership = getMembership(planId);

    if (!membership) {
      return "Unknown Member";
    }

    const member = members.find(
      (item) =>
        Number(item.member_id) ===
        Number(membership.member_id)
    );

    return member?.member_name || "Unknown Member";
  };

  const filteredPayments = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    const result = payments.filter((payment) => {
      const memberName = getMemberName(payment.plan_id);
      const membership = getMembership(payment.plan_id);

      const matchesSearch =
        memberName.toLowerCase().includes(searchText) ||
        (payment.payment_type || "")
          .toLowerCase()
          .includes(searchText) ||
        String(payment.plan_amount || "")
          .toLowerCase()
          .includes(searchText) ||
        (membership?.plan_name || "")
          .toLowerCase()
          .includes(searchText);

      const matchesType =
        typeFilter === "All Types" ||
        payment.payment_type === typeFilter;

      return matchesSearch && matchesType;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.payment_date) -
          new Date(a.payment_date)
        );
      }

      if (sortBy === "oldest") {
        return (
          new Date(a.payment_date) -
          new Date(b.payment_date)
        );
      }

      if (sortBy === "amountHigh") {
        return (
          Number(b.plan_amount || 0) -
          Number(a.plan_amount || 0)
        );
      }

      if (sortBy === "amountLow") {
        return (
          Number(a.plan_amount || 0) -
          Number(b.plan_amount || 0)
        );
      }

      return 0;
    });
  }, [
    payments,
    memberships,
    members,
    search,
    typeFilter,
    sortBy
  ]);

  const totalPayments = payments.reduce(
    (total, payment) =>
      total + Number(payment.plan_amount || 0),
    0
  );

  const transactionCount = payments.length;

  const averagePayment =
    transactionCount > 0
      ? Math.round(totalPayments / transactionCount)
      : 0;

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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#071019] px-4 py-6 text-white sm:px-5 md:px-8 md:py-7">

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

        {/* PART 1: Header */}

        <div className="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end lg:items-center">

          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
              Management
            </p>

            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              Payments
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Track membership payments and transactions
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
            {showForm ? "Close" : "+ Add Payment"}
          </button>

        </div>

        {/* PART 2: Payment Statistics */}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Total Payments
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              ₹{totalPayments.toLocaleString("en-IN")}
            </h2>

            <p className="mt-0.5 text-xs text-lime-400">
              Revenue
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Transactions
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              {transactionCount}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Payments
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b1925] px-4 py-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Average Payment
            </p>

            <h2 className="mt-1.5 text-2xl font-black">
              ₹{averagePayment.toLocaleString("en-IN")}
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Per transaction
            </p>
          </div>

        </div>

        {/* PART 3: Filters */}

        <div className="mb-5 w-full rounded-xl border border-white/10 bg-[#0b1925] p-3 sm:p-4">

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              className="cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400"
            >
              <option value="All Types">
                All Types
              </option>

              {paymentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
              className="cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-400"
            >
              <option value="newest">
                Newest Payment
              </option>

              <option value="oldest">
                Oldest Payment
              </option>

              <option value="amountHigh">
                Amount High–Low
              </option>

              <option value="amountLow">
                Amount Low–High
              </option>
            </select>

            <div className="relative col-span-2 lg:col-span-1">

              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search member, plan..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="w-full cursor-text rounded-lg border border-white/10 bg-[#07131e] py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-400"
              />

            </div>

          </div>

        </div>

        {/* PART 4: Add / Edit Form */}

        {showForm && (
          <div className="mb-5 rounded-xl border border-white/10 bg-[#0b1925] p-4 sm:p-5">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-lime-400">
                  Payment
                </p>

                <h2 className="mt-1 text-lg font-black">
                  {editingId
                    ? "Edit Payment"
                    : "Add Payment"}
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
              className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4"
            >

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Payment Date
                </label>

                <DateInput
                  name="payment_date"
                  value={formData.payment_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Payment Type
                </label>

                <select
                  name="payment_type"
                  value={formData.payment_type}
                  onChange={handleChange}
                  required
                  className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
                >
                  <option value="">
                    Select Payment Type
                  </option>

                  {paymentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Membership
                </label>

                <select
                  name="plan_id"
                  value={formData.plan_id}
                  onChange={handleChange}
                  required
                  className="w-full cursor-pointer rounded-lg border border-white/10 bg-[#07131e] px-3 py-2.5 text-sm text-white outline-none focus:border-lime-400"
                >
                  <option value="">
                    Select Membership
                  </option>

                  {memberships.map((membership) => (
                    <option
                      key={membership.plan_id}
                      value={membership.plan_id}
                    >
                      {getMemberName(membership.plan_id)} -{" "}
                      {membership.plan_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-400">
                  Payment Amount
                </label>

                <input
                  type="number"
                  value={formData.plan_amount}
                  readOnly
                  className="w-full cursor-default rounded-lg border border-white/10 bg-[#101c27] px-3 py-2.5 text-sm text-slate-300 outline-none"
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row md:col-span-2 lg:col-span-4">

                <button
                  type="submit"
                  className="w-full cursor-pointer rounded-lg bg-lime-400 px-5 py-2.5 text-sm font-black text-[#06111b] transition hover:bg-lime-300 sm:w-auto"
                >
                  {editingId
                    ? "Update Payment"
                    : "Save Payment"}
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

        {/* PART 5: Payment History */}

        <div className="mx-auto w-full max-w-[1100px] overflow-hidden rounded-xl border border-white/10 bg-[#0b1925]">

          <div className="border-b border-white/10 bg-[#0d1d2a] px-4 py-4 sm:px-5">

            <h2 className="text-lg font-bold">
              Payment History
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Membership payment transactions
            </p>

          </div>

          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[900px] text-left">

              <thead>

                <tr className="border-b border-white/10">

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Member
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Membership
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Type
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredPayments.map((payment) => {

                  const membership = getMembership(
                    payment.plan_id
                  );

                  return (
                    <tr
                      key={payment.payment_id}
                      className="border-b border-white/5 transition hover:bg-white/[0.025]"
                    >

                      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-400">
                        {formatDate(payment.payment_date)}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="text-sm font-bold text-white">
                          {getMemberName(payment.plan_id)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-sm text-slate-300">
                        {membership?.plan_name || "Unknown"}
                      </td>

                      <td className="px-4 py-3.5">

                        <span className="whitespace-nowrap rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-slate-300">
                          {payment.payment_type}
                        </span>

                      </td>

                      <td className="px-4 py-3.5 text-sm font-black text-lime-400">
                        ₹
                        {Number(
                          payment.plan_amount || 0
                        ).toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 py-3.5">

                        <div className="flex justify-center gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(payment)
                            }
                            className="cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[11px] font-bold text-slate-400 transition hover:border-lime-400/30 hover:text-lime-400"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                payment.payment_id
                              )
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

                {filteredPayments.length === 0 && (
                  <tr>

                    <td
                      colSpan="6"
                      className="px-5 py-12 text-center"
                    >

                      <p className="text-sm font-bold text-slate-400">
                        No payments found
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

          <div className="border-t border-white/10 px-4 py-3 sm:px-5">

            <p className="text-xs text-slate-600">
              Showing {filteredPayments.length} of{" "}
              {payments.length} transactions
            </p>

          </div>

        </div>

      </div>

      {/* PART 6: Delete Confirmation */}

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        title="Delete Payment?"
        message="Are you sure you want to delete this payment? This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

    </div>
  );
}

export default Payments;