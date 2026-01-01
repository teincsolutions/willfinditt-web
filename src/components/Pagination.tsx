interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex justify-center space-x-2 mt-8">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-4 py-2 rounded-lg font-medium transition-all shadow-sm ${
            page === currentPage
              ? 'bg-primary text-white shadow-primary/20'
              : 'bg-background-primary text-text-gray hover:bg-primary/10 hover:text-primary'
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
};
