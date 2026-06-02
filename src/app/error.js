"use client";

export default function Error({ error, reset }) {
  return (
    <div className="h-screen flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold text-red-500">Something Went Wrong</h1>

      <p className="my-4">{error.message}</p>

      <button
        onClick={() => reset()}
        className="bg-blue-600 text-white px-5 py-2 rounded"
      >
        Try Again
      </button>
    </div>
  );
}
