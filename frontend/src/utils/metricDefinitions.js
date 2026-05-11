const METRIC_DEFINITIONS = [
    {
        key: 'users',
        matcher: /kullanıcı|aktif kullanıcı|tekil kullanıcı|kullanici|aktif kullanici|tekil kullanici/i,
        definition: 'Belirtilen dönemde en az bir etkileşimli oturumu olan kullanıcılar.',
        formula: 'Users'
    },
    {
        key: 'new_users',
        matcher: /yeni kullanıcı|yeni kullanici/i,
        definition: 'Dönem içinde ilk kez gelen kullanıcı sayısı.',
        formula: 'New Users'
    },
    {
        key: 'sessions',
        matcher: /oturum|session|ziyaretci/i,
        definition: 'Kullanıcıların başlattığı toplam oturum sayısı.',
        formula: 'Sessions'
    },
    {
        key: 'engagement_rate',
        matcher: /etkileşim oranı|etkilesim orani/i,
        definition: 'Etkileşimli oturumların toplam oturumlara oranı.',
        formula: 'Engagement Rate = 100 - Bounce Rate'
    },
    {
        key: 'bounce_rate',
        matcher: /hemen çıkma|hemen cikma|bounce/i,
        definition: 'Etkileşimsiz oturumların toplam oturumlara oranı.',
        formula: 'Bounce Rate = 100 - Engagement Rate'
    },
    {
        key: 'cvr',
        matcher: /cvr|dönüşüm oranı|trafik dönüşüm|donusum orani|trafik donusum/i,
        definition: 'Oturumdan dönüşüme geçiş oranı.',
        formula: 'CVR = Conversions / Sessions * 100'
    },
    {
        key: 'conversions',
        matcher: /dönüşüm|donusum/i,
        definition: 'Hedeflenen aksiyonların toplamı.',
        formula: 'Conversions'
    },
    {
        key: 'revenue',
        matcher: /gelir|ciro|revenue/i,
        definition: 'Siparişlerden elde edilen toplam gelir.',
        formula: 'Revenue = Sum(order_revenue)'
    },
    {
        key: 'orders',
        matcher: /sipariş|siparis/i,
        definition: 'Tamamlanan sipariş adedi.',
        formula: 'Orders'
    },
    {
        key: 'aov',
        matcher: /aov|sepet ortalaması|sepet ortalamasi/i,
        definition: 'Ortalama sipariş tutarı.',
        formula: 'AOV = Revenue / Orders'
    },
    {
        key: 'roas',
        matcher: /roas/i,
        definition: 'Reklam harcaması başına elde edilen gelir.',
        formula: 'ROAS = Revenue / Ad Spend'
    },
    {
        key: 'ctr',
        matcher: /ctr/i,
        definition: 'Tıklamaların gösterimlere oranı.',
        formula: 'CTR = Clicks / Impressions * 100'
    },
    {
        key: 'cpc',
        matcher: /cpc|tıklama maliyeti|tiklama maliyeti/i,
        definition: 'Bir tıklama başına ortalama maliyet.',
        formula: 'CPC = Spend / Clicks'
    },
    {
        key: 'spend',
        matcher: /harcama|spend/i,
        definition: 'Seçili dönemdeki toplam reklam harcaması.',
        formula: 'Spend = Sum(ad_spend)'
    },
    {
        key: 'refund_rate',
        matcher: /iade orani/i,
        definition: 'İade tutarının toplam gelire oranı.',
        formula: 'Refund Rate = Refund Amount / Revenue * 100'
    },
    {
        key: 'refund_amount',
        matcher: /iade tutarı|iade tutari|refund/i,
        definition: 'Toplam iade tutarı.',
        formula: 'Refund Amount'
    },
    {
        key: 'retention',
        matcher: /retention|cohort/i,
        definition: 'Kullanıcıların ilerleyen dönemlerde geri dönme oranı.',
        formula: 'Retention = Returning Cohort / Initial Cohort * 100'
    }
];

export function getMetricDefinitionByTitle(title = '') {
    return METRIC_DEFINITIONS.find((item) => item.matcher.test(title)) || null;
}

export default METRIC_DEFINITIONS;

