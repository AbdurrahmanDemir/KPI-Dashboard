# KPI Dashboard — ER Diyagramı

## Tablo İlişkileri

```mermaid
erDiagram
    users {
        int id PK
        varchar name
        varchar email UK
        varchar password_hash
        enum role
        datetime last_login
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    import_logs {
        int id PK
        int user_id FK
        varchar file_name
        enum file_type
        enum source_type
        int row_count
        int error_count
        enum status
        json error_detail
        datetime created_at
        datetime completed_at
    }

    traffic_data {
        int id PK
        date date
        varchar source
        varchar medium
        varchar channel_group
        varchar channel
        int sessions
        int users
        int new_users
        decimal bounce_rate
        decimal avg_session_duration
        decimal pages_per_session
        int pages_viewed
        int conversions
        decimal revenue
        int import_id FK
        datetime created_at
    }

    ads_data {
        int id PK
        date date
        enum platform
        varchar platform_id
        varchar campaign_name
        varchar adset
        varchar ad_name
        varchar ad_group
        int impressions
        int clicks
        int reach
        decimal spend
        decimal ctr
        decimal cpc
        decimal avg_cpc
        int conversions
        decimal conversion_value
        varchar currency
        int import_id FK
        datetime created_at
    }

    sales_data {
        int id PK
        varchar order_id UK
        date order_date
        varchar customer_id
        varchar city
        varchar country
        varchar device
        varchar channel
        int product_count
        decimal order_revenue
        decimal discount_amount
        decimal refund_amount
        enum order_status
        varchar payment_method
        int import_id FK
        datetime created_at
    }

    campaign_data {
        int id PK
        varchar campaign_name
        enum platform
        varchar platform_id
        date start_date
        date end_date
        decimal budget
        enum budget_type
        varchar objective
        decimal target_roas
        varchar currency
        enum status
        datetime created_at
        datetime updated_at
    }

    channel_mapping {
        int id PK
        varchar source
        varchar medium
        varchar channel_group
        varchar platform
        boolean is_paid
        datetime created_at
    }

    funnel_data {
        int id PK
        date date
        varchar channel
        varchar device
        varchar step_name
        tinyint step_order
        int session_count
        int import_id FK
        datetime created_at
    }

    kpi_cache {
        int id PK
        varchar kpi_type
        date date_start
        date date_end
        varchar filters_hash
        json value
        datetime calculated_at
        datetime expires_at
    }

    saved_views {
        int id PK
        int user_id FK
        varchar name
        json layout_config
        json filter_config
        boolean is_default
        datetime created_at
        datetime updated_at
    }

    segments {
        int id PK
        int user_id FK
        varchar name
        json rules_config
        datetime created_at
        datetime updated_at
    }

    audit_logs {
        int id PK
        int user_id FK
        varchar action
        varchar entity_type
        varchar entity_id
        varchar ip_address
        varchar user_agent
        json payload
        datetime created_at
    }

    users ||--o{ import_logs : "yükler"
    users ||--o{ saved_views : "kaydeder"
    users ||--o{ segments : "oluşturur"
    users ||--o{ audit_logs : "tetikler"

    import_logs ||--o{ traffic_data : "içerir"
    import_logs ||--o{ ads_data : "içerir"
    import_logs ||--o{ sales_data : "içerir"
    import_logs ||--o{ funnel_data : "içerir"
```

## Tablo Özeti

| # | Tablo | Satır Sayısı (Tahmini) | Açıklama |
|---|-------|------------------------|----------|
| 1 | `users` | ~10 | Kullanıcılar |
| 2 | `import_logs` | ~100+ | Import geçmişi |
| 3 | `traffic_data` | ~50,000+ | GA trafik verisi |
| 4 | `ads_data` | ~30,000+ | Meta + Google Ads |
| 5 | `sales_data` | ~10,000+ | Sipariş verileri |
| 6 | `campaign_data` | ~50 | Kampanya tanımları |
| 7 | `channel_mapping` | ~20 | Kanal normalizasyonu |
| 8 | `funnel_data` | ~100,000+ | Funnel adımları |
| 9 | `kpi_cache` | ~500 | Hesaplanan KPI'lar |
| 10 | `saved_views` | ~50 | Kaydedilmiş layoutlar |
| 11 | `segments` | ~20 | Kullanıcı segmentleri |
| 12 | `audit_logs` | ~10,000+ | Audit logları |

## Index Stratejisi

| Tablo | Indexli Kolonlar | Gerekçe |
|-------|-----------------|---------|
| `traffic_data` | date, channel, (source,medium), (date,channel) | Filtreli KPI sorguları |
| `ads_data` | date, platform, campaign_name, (date,platform) | ROAS ve kampanya sorguları |
| `sales_data` | order_date, customer_id, channel, city, country, order_status | Cohort ve coğrafi filtreler |
| `funnel_data` | date, step_order, (date,channel) | Funnel analiz sorguları |
| `kpi_cache` | (kpi_type,date_start,date_end,filters_hash) UNIQUE, expires_at | Cache lookup performansı |
| `audit_logs` | user_id, action, created_at | Log filtreleme |
