export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-surface-container text-xs font-sans">
      <span className="text-outline">
        Page <span className="font-semibold text-on-background">{currentPage}</span> of{' '}
        <span className="font-semibold text-on-background">{totalPages}</span>
      </span>
      <div className="flex space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 border border-surface-container text-on-background hover:bg-surface-container/50 disabled:opacity-40 disabled:pointer-events-none transition-colors uppercase tracking-wider font-medium"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 border border-surface-container text-on-background hover:bg-surface-container/50 disabled:opacity-40 disabled:pointer-events-none transition-colors uppercase tracking-wider font-medium"
        >
          Next
        </button>
      </div>
    </div>
  );
}
