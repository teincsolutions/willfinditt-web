'use client';

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
  const total = Math.max(0, Math.floor(Number(totalPages) || 0));
  if (total <= 1) return null;

  const current = Math.max(
    1,
    Math.min(total, Math.floor(Number(currentPage) || 1))
  );

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      // Calculate range around current
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);

      // Adjust to always show at least 3 middle pages if possible
      if (current <= 3) {
        end = 4;
      } else if (current >= total - 2) {
        start = total - 3;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(total);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex justify-center items-center flex-wrap gap-2 mt-8">
      {/* Previous Button */}
      <button
        type="button"
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className="flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all bg-background-primary text-text-gray hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        aria-label="Previous page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      {/* Page Numbers */}
      {pages.map((page, index) => {
        const isEllipsis = page === '...';
        const isNumeric = typeof page === 'number';
        const isActive = isNumeric && page === current;

        return (
          <button
            key={`${page}-${index}`}
            type="button"
            onClick={() => isNumeric && onPageChange(page as number)}
            disabled={isEllipsis}
            className={`flex items-center justify-center min-w-[2.5rem] h-10 px-3 rounded-lg font-bold transition-all ${
              isActive
                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10'
                : isEllipsis
                  ? 'bg-transparent text-text-gray cursor-default pointer-events-none'
                  : 'bg-background-primary text-text-gray hover:bg-primary/10 hover:text-primary active:scale-95'
            }`}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        type="button"
        onClick={() => onPageChange(current + 1)}
        disabled={current === total}
        className="flex items-center justify-center w-10 h-10 rounded-lg font-medium transition-all bg-background-primary text-text-gray hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
        aria-label="Next page"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </div>
  );
};
