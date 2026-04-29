import { useState, useEffect } from 'react';
import Layout from '../../../layout';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../../../components';
import { getMe } from '../../../config/redux/action';
import axios from 'axios';
import Swal from 'sweetalert2';

const OvertimePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isError, user } = useSelector((state) => state.auth);

    const [employees, setEmployees] = useState([]);
    const [overtimeList, setOvertimeList] = useState([]);
    const [formData, setFormData] = useState({
        employee_id: '',
        date: '',
        hours: '',
        reason: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        dispatch(getMe());
    }, [dispatch]);

    useEffect(() => {
        if (isError) navigate('/login');
        if (user && user.hak_akses !== 'admin') navigate('/dashboard');
    }, [isError, user, navigate]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await axios.get('http://localhost:5001/data_pegawai', { withCredentials: true });
                setEmployees(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        const fetchOvertime = async () => {
            try {
                const res = await axios.get('http://localhost:5001/overtime', { withCredentials: true });
                setOvertimeList(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchEmployees();
        fetchOvertime();
    }, []);

    const validate = () => {
        const newErrors = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        if (!formData.employee_id) newErrors.employee_id = 'Please select a worker';
        if (!formData.date) {
            newErrors.date = 'Date is required';
        } else {
            const entryDate = new Date(formData.date);
            if (entryDate > today) newErrors.date = 'Date cannot be in the future';
            else if (entryDate < sevenDaysAgo) newErrors.date = 'Date cannot be more than 7 days in the past';
        }
        if (!formData.hours) {
            newErrors.hours = 'Hours is required';
        } else {
            const h = parseFloat(formData.hours);
            if (isNaN(h) || h < 1 || h > 6) newErrors.hours = 'Overtime hours must be between 1 and 6';
        }
        if (!formData.reason) {
            newErrors.reason = 'Reason is required';
        } else if (formData.reason.trim().length < 10) {
            newErrors.reason = 'Reason must be at least 10 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await axios.post('http://localhost:5001/overtime', formData, { withCredentials: true });
            Swal.fire({ icon: 'success', title: 'Success', text: 'Overtime entry saved', timer: 1500, showConfirmButton: false });
            setFormData({ employee_id: '', date: '', hours: '', reason: '' });
            const res = await axios.get('http://localhost:5001/overtime', { withCredentials: true });
            setOvertimeList(res.data);
        } catch (err) {
            const msg = err.response?.data?.msg || 'Something went wrong';
            Swal.fire({ icon: 'error', title: 'Error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return (
        <Layout>
            <Breadcrumb pageName="Overtime Entry" />
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6.5 mt-6">
                <h3 className="font-medium text-black dark:text-white mb-4 border-b border-stroke pb-2 dark:border-strokedark">
                    Log Overtime for Site Worker
                </h3>
                <form onSubmit={handleSubmit}>
                    {/* Worker */}
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Worker <span className="text-meta-1">*</span>
                        </label>
                        <select
                            name="employee_id"
                            value={formData.employee_id}
                            onChange={handleChange}
                            className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                        >
                            <option value="">Select a worker</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.nama_pegawai} — {emp.nik}
                                </option>
                            ))}
                        </select>
                        {errors.employee_id && <p className="text-meta-1 text-sm mt-1">{errors.employee_id}</p>}
                    </div>

                    {/* Date */}
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Date <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            min={sevenDaysAgo}
                            max={today}
                            className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                        />
                        {errors.date && <p className="text-meta-1 text-sm mt-1">{errors.date}</p>}
                    </div>

                    {/* Hours */}
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Overtime Hours (1–6) <span className="text-meta-1">*</span>
                        </label>
                        <input
                            type="number"
                            name="hours"
                            value={formData.hours}
                            onChange={handleChange}
                            min="1"
                            max="6"
                            step="0.5"
                            placeholder="Enter hours (e.g. 2.5)"
                            className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                        />
                        {errors.hours && <p className="text-meta-1 text-sm mt-1">{errors.hours}</p>}
                    </div>

                    {/* Reason */}
                    <div className="mb-4.5">
                        <label className="mb-2.5 block text-black dark:text-white">
                            Reason <span className="text-meta-1">*</span>
                        </label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Minimum 10 characters"
                            className="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input"
                        />
                        {errors.reason && <p className="text-meta-1 text-sm mt-1">{errors.reason}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded bg-primary py-3 px-8 text-white hover:bg-opacity-90 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Submit Overtime'}
                    </button>
                </form>
            </div>

            {/* Overtime List */}
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark px-5 pt-6 pb-4 mt-6">
                <h3 className="font-medium text-black dark:text-white mb-4">Recent Overtime Entries</h3>
                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="bg-gray-2 dark:bg-meta-4">
                                <th className="py-3 px-4 text-left font-medium text-black dark:text-white">Worker</th>
                                <th className="py-3 px-4 text-left font-medium text-black dark:text-white">NIK</th>
                                <th className="py-3 px-4 text-left font-medium text-black dark:text-white">Date</th>
                                <th className="py-3 px-4 text-left font-medium text-black dark:text-white">Hours</th>
                                <th className="py-3 px-4 text-left font-medium text-black dark:text-white">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {overtimeList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-6 text-gray-500">No overtime entries yet</td>
                                </tr>
                            ) : (
                                overtimeList.map((entry) => (
                                    <tr key={entry.id}>
                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-black dark:text-white">{entry.nama_pegawai}</td>
                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-black dark:text-white">{entry.nik}</td>
                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-black dark:text-white">
                                            {new Date(entry.date).toLocaleDateString('en-GB')}
                                        </td>
                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-black dark:text-white">{entry.hours}h</td>
                                        <td className="border-b border-[#eee] py-4 px-4 dark:border-strokedark text-black dark:text-white">{entry.reason}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default OvertimePage;
