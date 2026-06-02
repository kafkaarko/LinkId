function EmptyState({
  title = "Belum ada data",
  desc = "Data masih kosong 😹",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h2 className="text-2xl font-bold">
        {title}
      </h2>

      <p className="opacity-70 mt-2">
        {desc}
      </p>
    </div>
  );
}

export default EmptyState;