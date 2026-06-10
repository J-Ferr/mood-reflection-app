import { useState } from "react";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const  [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
  e.preventDefault();

  console.log("Submitting forgot password for:", email);

  try {
    const response = await fetch("http://localhost:5000/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("Response data:", data);

    setMessage(data.message || "Check your email for a reset link.");
  } catch (error) {
    console.error("Forgot password error:", error);
    setMessage("Could not connect to the server.");
  }
};

    return (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-3xl font-bold mb-2">
        Forgot Password
      </h1>

      <p className="text-gray-600 mb-6">
        Enter your email and we'll send you a reset link.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="block mb-2 text-sm font-medium">
            Email
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Send Reset Link
        </button>
      </form>

      {message && (
        <p className="mt-4 text-green-600">
          {message}
        </p>
      )}
    </div>
  </div>
);
}

export default ForgotPassword;