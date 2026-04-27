/**
/**
 * Sequelize Modelleri — Merkezi Index
 * Tüm modelleri ve aralarındaki ilişkileri tanımlar
 */

const { sequelize } = require('../config/database');

// ─── Modelleri Yükle ──────────────────────────────────────────────────────────
const User = require('./User');
const ImportLog = require('./ImportLog');
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

// ─── İlişkiler ────────────────────────────────────────────────────────────────

// User → ImportLog (1:N)
User.hasMany(ImportLog, { foreignKey: 'user_id', as: 'imports' });
ImportLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User → SavedView (1:N)
User.hasMany(SavedView, { foreignKey: 'user_id', as: 'saved_views' });
SavedView.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User → Segment (1:N)
User.hasMany(Segment, { foreignKey: 'user_id', as: 'segments' });
Segment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User → AuditLog (1:N)
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User → RefreshToken (1:N)
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refresh_tokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User → ReportSchedule (1:N)
User.hasMany(ReportSchedule, { foreignKey: 'user_id', as: 'report_schedules' });
ReportSchedule.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// ImportLog → TrafficData (1:N)
ImportLog.hasMany(TrafficData, { foreignKey: 'import_id', as: 'traffic_data', onDelete: 'CASCADE' });
TrafficData.belongsTo(ImportLog, { foreignKey: 'import_id', as: 'import' });

// ImportLog → AdsData (1:N)
ImportLog.hasMany(AdsData, { foreignKey: 'import_id', as: 'ads_data', onDelete: 'CASCADE' });
AdsData.belongsTo(ImportLog, { foreignKey: 'import_id', as: 'import' });

// ImportLog → SalesData (1:N)
ImportLog.hasMany(SalesData, { foreignKey: 'import_id', as: 'sales_data', onDelete: 'CASCADE' });
SalesData.belongsTo(ImportLog, { foreignKey: 'import_id', as: 'import' });

// ImportLog → FunnelData (1:N)
ImportLog.hasMany(FunnelData, { foreignKey: 'import_id', as: 'funnel_data', onDelete: 'CASCADE' });
FunnelData.belongsTo(ImportLog, { foreignKey: 'import_id', as: 'import' });

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = {
    sequelize,
    User,
    ImportLog,
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
