import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { HiOutlineOfficeBuilding, HiOutlineSwitchHorizontal } from 'react-icons/hi';

const CompanySwitcher = () => {
  const { user, activeCompany, setActiveCompany, getActiveCompanyInfo } = useAuth();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState({});
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch cross-company alerts for badge counts
  useEffect(() => {
    if (user?.role !== 'supplier' || !user?.companies || user.companies.length < 2) return;

    const fetchAlerts = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user'))?.firebaseToken;
        const res = await axios.get('/api/restock-requests/cross-company-alerts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const alertMap = {};
        (res.data.data || []).forEach((a) => {
          alertMap[a.company._id] = a.pendingCount + a.acceptedCount;
        });
        setAlerts(alertMap);
      } catch { /* silent */ }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [user]);

  // Only show for suppliers with multiple companies
  if (user?.role !== 'supplier' || !user?.companies || user.companies.length < 2) {
    return null;
  }

  const activeInfo = getActiveCompanyInfo();
  const totalOtherAlerts = Object.entries(alerts)
    .filter(([id]) => id !== activeCompany)
    .reduce((sum, [, count]) => sum + count, 0);

  const handleSwitch = (companyId) => {
    setActiveCompany(companyId);
    setOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
      >
        <HiOutlineOfficeBuilding className="text-primary-600" />
        <span className="max-w-[140px] truncate">{activeInfo?.name || 'Select Company'}</span>
        <HiOutlineSwitchHorizontal className="text-gray-400 text-xs" />
        {totalOtherAlerts > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {totalOtherAlerts}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200">
            <p className="text-xs text-gray-500 font-medium uppercase">Switch Company</p>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {user.companies.map((company) => {
              const alertCount = alerts[company._id] || 0;
              return (
                <button
                  key={company._id}
                  onClick={() => handleSwitch(company._id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    activeCompany === company._id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      activeCompany === company._id
                        ? 'bg-primary-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <HiOutlineOfficeBuilding
                      className={
                        activeCompany === company._id ? 'text-primary-600' : 'text-gray-400'
                      }
                    />
                  </div>
                  <div className="text-left overflow-hidden flex-1">
                    <p className="font-medium truncate">{company.name}</p>
                    {activeCompany === company._id && (
                      <p className="text-[10px] text-primary-500">Currently active</p>
                    )}
                  </div>
                  {/* Alert badge for other companies */}
                  {alertCount > 0 && activeCompany !== company._id && (
                    <span className="min-w-[20px] h-5 bg-red-50 text-red-600 text-[11px] font-semibold rounded-full flex items-center justify-center px-1.5 border border-red-200">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanySwitcher;
