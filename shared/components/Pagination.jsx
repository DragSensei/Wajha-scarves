export default function Pagination({ currentPage, totalPages, onPageChange, className = '' }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-white border-t border-surface-container text-xs font-sans ${className}`}>
      <span className="text-outline">
        Page <span className="font-semibold text-on-background">{currentPage}</span> of{' '}
        <span className="font-semibold text-on-background">{totalPages}</span>
      </span>

      <div className="flex items-center space-x-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 border border-surface-container text-on-background hover:bg-surface-container/50 disabled:opacity-30 disabled:pointer-events-none transition-colors uppercase tracking-wider font-medium cursor-pointer"
          aria-label="Previous page"
        >
          Previous
        </button>

        <div className="hidden sm:flex items-center space-x-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 py-1 text-outline">
                  ...
                </span>
              );
            }
            const isActive = p === currentPage;
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[32px] h-[30px] px-2 flex items-center justify-center border font-medium transition-colors cursor-pointer text-xs ${
                  isActive
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'border-surface-container text-on-background hover:bg-surface-container/50'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 border border-surface-container text-on-background hover:bg-surface-container/50 disabled:opacity-30 disabled:pointer-events-none transition-colors uppercase tracking-wider font-medium cursor-pointer"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
