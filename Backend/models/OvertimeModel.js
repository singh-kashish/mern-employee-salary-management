import { Sequelize } from 'sequelize';
import db from '../config/Database.js';
const { DataTypes } = Sequelize;

const Overtime = db.define('overtime', {
    employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nik: {
        type: DataTypes.STRING(16),
        allowNull: false
    },
    nama_pegawai: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    hours: {
        type: DataTypes.DECIMAL(3,1),
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING(500),
        allowNull: false
    }
}, {
    freezeTableName: true
});

export default Overtime;
