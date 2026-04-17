import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function PaymentSuccess() {
  const query = useQuery();
  const navigate = useNavigate();
  const tranId = query.get('tran_id') || '';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-green-700">Payment Successful</h1>
        <p className="mt-3 text-gray-700">
          Your payment has been completed successfully.
        </p>
        <div className="mt-4 rounded-md bg-gray-50 p-4">
          <div className="text-sm text-gray-600">Transaction Number</div>
          <div className="mt-1 font-mono text-base text-gray-900 break-all">{tranId || 'N/A'}</div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-white hover:opacity-90"
            onClick={() => navigate('/traveler')}
          >
            Go back to dashboard
          </button>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-900 hover:bg-gray-50"
            onClick={() => navigate('/invoices' + (tranId ? `?tran_id=${encodeURIComponent(tranId)}` : ''))}
          >
            View invoice
          </button>
        </div>
      </div>
    </div>
  );
}

