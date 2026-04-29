import Overtime from '../models/OvertimeModel.js';
import DataPegawai from '../models/DataPegawaiModel.js';
import { Op } from 'sequelize';

export const createOvertime = async (req, res) => {
    const { employee_id, date, hours, reason } = req.body;

    // --- Validations ---
    if (!employee_id || !date || !hours || !reason) {
        return res.status(400).json({ msg: 'All fields are required' });
    }

    const overtimeHours = parseFloat(hours);
    if (isNaN(overtimeHours) || overtimeHours < 1 || overtimeHours > 6) {
        return res.status(400).json({ msg: 'Overtime hours must be between 1 and 6' });
    }

    if (reason.trim().length < 10) {
        return res.status(400).json({ msg: 'Reason must be at least 10 characters' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    if (entryDate > today) {
        return res.status(400).json({ msg: 'Date cannot be in the future' });
    }

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    if (entryDate < sevenDaysAgo) {
        return res.status(400).json({ msg: 'Date cannot be more than 7 days in the past' });
    }

    // Worker must exist
    const worker = await DataPegawai.findOne({ where: { id: employee_id } });
    if (!worker) {
        return res.status(404).json({ msg: 'Worker not found in the system' });
    }

    // No duplicate entry for same worker + same date
    const duplicate = await Overtime.findOne({ where: { employee_id, date } });
    if (duplicate) {
        return res.status(400).json({ msg: 'Overtime entry already exists for this worker on this date' });
    }

    // Monthly cap: total cannot exceed 60 hours
    const startOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1);
    const endOfMonth = new Date(entryDate.getFullYear(), entryDate.getMonth() + 1, 0);

    const monthlyTotal = await Overtime.sum('hours', {
        where: {
            employee_id,
            date: { [Op.between]: [startOfMonth, endOfMonth] }
        }
    });

    const currentTotal = parseFloat(monthlyTotal) || 0;
    if (currentTotal + overtimeHours > 60) {
        return res.status(400).json({
            msg: `This entry would exceed the monthly limit. Current total: ${currentTotal}h, limit: 60h`
        });
    }

    try {
        await Overtime.create({
            employee_id,
            nik: worker.nik,
            nama_pegawai: worker.nama_pegawai,
            date,
            hours: overtimeHours,
            reason: reason.trim()
        });
        res.status(201).json({ msg: 'Overtime entry created successfully' });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ msg: 'Overtime entry already exists for this worker on this date' });
        }
        res.status(500).json({ msg: error.message });
    }
};

export const getOvertime = async (req, res) => {
    try {
        const response = await Overtime.findAll({
            order: [['date', 'DESC']]
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};
