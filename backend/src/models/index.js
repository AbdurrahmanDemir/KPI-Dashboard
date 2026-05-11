/**
 * Sequelize modelleri ve iliskileri
 */

const { sequelize } = require('../config/database');

const User = require('./User');
const ImportLog = require('./ImportLog');
const ImportRawRow = require('./ImportRawRow');
const ImportStagingRow = require('./ImportStagingRow');
const TrafficData = require('./TrafficData');
const AdsData = require('./AdsData');
const SalesData = require('./SalesData');
const CampaignData = require('./CampaignData');
const ChannelMapping = require('./ChannelMapping');
const FunnelData = require('./FunnelData');
const KpiCache = require('./KpiCache');
const SavedView = require('./SavedView');
const Segment = require('./Segment');
const AuditLog = require('./AuditLog');
const RefreshToken = require('./RefreshToken');
const ReportSchedule = require('./ReportSchedule');
const Integration = require('./Integration');

User.hasMany(ImportLog, { foreignKey: 'user_id', as: 'imports' });
ImportLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(SavedView, { foreignKey: 'user_id', as: 'saved_views' });
SavedView.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Segment, { foreignKey: 'user_id', as: 'segments' });
Segment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(ReportSchedule, { foreignKey: 'user_id', as: 'report_schedules' });
ReportSchedule.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

ImportLog.hasMany(ImportRawRow, { foreignKey: 'import_id', as: 'raw_rows', onDelete: 'CASCADE' });
ImportRawRow.belongsTo(ImportLog, { foreignKey: 'import_id', as: 'import' });

ImportLog.hasMany(ImportStagingRow, { foreignKey: 'import_id', as: 'staging_rows', onDelete: 'CASCADE' });
ImportStagingRow.belongsTo(ImportLog, { foreignKey: 'import_id', as: 'import' });

ImportLog.hasMany(TrafficData, { foreignKey: 'import_id', as: 'traffic_data', onDelete: 'CASCADE' });
TrafficData.belongsTo(ImportLog, { foreignKey: 'import_id', as: 'import' });

ImportLog.hasMany(AdsData, { foreignKey: 'import_id', as: 'ads_data', onDelete: 'CASCADE' });
AdsData.belongsTo(ImportLog, { foreignKey: 'import_id', as: 'import' });

ImportLog.hasMany(SalesData, { foreignKey: 'import_id', as: 'sales_data', onDelete: 'CASCADE' });
SalesData.belongsTo(ImportLog, { foreignKey: 'import_id', as: 'import' });

ImportLog.hasMany(FunnelData, { foreignKey: 'import_id', as: 'funnel_data', onDelete: 'CASCADE' });
FunnelData.belongsTo(ImportLog, { foreignKey: 'import_id', as: 'import' });

module.exports = {
    sequelize,
    User,
    ImportLog,
    ImportRawRow,
    ImportStagingRow,
    TrafficData,
    AdsData,
    SalesData,
    CampaignData,
    ChannelMapping,
    FunnelData,
    KpiCache,
    SavedView,
    Segment,
    AuditLog,
    RefreshToken,
    ReportSchedule,
    Integration,
};
