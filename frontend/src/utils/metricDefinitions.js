const METRIC_DEFINITIONS = [
    {
        key: 'users',
        matcher: /kullanici|aktif kullanici|tekil kullanici/i,
        definition: 'Belirtilen donemde en az bir etkilesimli oturumu olan kullanicilar.',
        formula: 'Users'
    },
    {
        key: 'new_users',
        matcher: /yeni kullanici/i,
        definition: 'Donem icinde ilk kez gelen kullanici sayisi.',
        formula: 'New Users'
    },
    {
        key: 'sessions',
        matcher: /oturum|session|ziyaretci/i,
        definition: 'Kullanicilarin baslattigi toplam oturum sayisi.',
        formula: 'Sessions'
    },
    {
        key: 'engagement_rate',
        matcher: /etkilesim orani/i,
        definition: 'Etkilesimli oturumlarin toplam oturumlara orani.',
        formula: 'Engagement Rate = 100 - Bounce Rate'
    },
    {
        key: 'bounce_rate',
        matcher: /hemen cikma|bounce/i,
        definition: 'Etkilesimsiz oturumlarin toplam oturumlara orani.',
        formula: 'Bounce Rate = 100 - Engagement Rate'
    },
    {
        key: 'cvr',
        matcher: /cvr|donusum orani|trafik donusum/i,
        definition: 'Oturumdan donusume gecis orani.',
        formula: 'CVR = Conversions / Sessions * 100'
    },
    {
        key: 'conversions',
        matcher: /donusum/i,
        definition: 'Hedeflenen aksiyonlarin toplami.',
        formula: 'Conversions'
    },
    {
        key: 'revenue',
        matcher: /gelir|ciro|revenue/i,
        definition: 'Siparislerden elde edilen toplam gelir.',
        formula: 'Revenue = Sum(order_revenue)'
    },
    {
        key: 'orders',
        matcher: /siparis/i,
        definition: 'Tamamlanan siparis adedi.',
        formula: 'Orders'
    },
    {
        key: 'aov',
        matcher: /aov|sepet ortalamasi/i,
        definition: 'Ortalama siparis tutari.',
        formula: 'AOV = Revenue / Orders'
    },
    {
        key: 'roas',
        matcher: /roas/i,
        definition: 'Reklam harcamasi basina elde edilen gelir.',
        formula: 'ROAS = Revenue / Ad Spend'
    },
    {
        key: 'ctr',
        matcher: /ctr/i,
        definition: 'Tiklamalarin gosterimlere orani.',
        formula: 'CTR = Clicks / Impressions * 100'
    },
    {
        key: 'cpc',
        matcher: /cpc|tiklama maliyeti/i,
        definition: 'Bir tiklama basina ortalama maliyet.',
        formula: 'CPC = Spend / Clicks'
    },
    {
        key: 'spend',
        matcher: /harcama|spend/i,
        definition: 'Secili donemdeki toplam reklam harcamasi.',
        formula: 'Spend = Sum(ad_spend)'
    },
    {
        key: 'refund_rate',
        matcher: /iade orani/i,
        definition: 'Iade tutarinin toplam gelire orani.',
        formula: 'Refund Rate = Refund Amount / Revenue * 100'
    },
    {
        key: 'refund_amount',
        matcher: /iade tutari|refund/i,
        definition: 'Toplam iade tutari.',
        formula: 'Refund Amount'
    },
    {
        key: 'retention',
        matcher: /retention|cohort/i,
        definition: 'Kullanicilarin ilerleyen donemlerde geri donme orani.',
        formula: 'Retention = Returning Cohort / Initial Cohort * 100'
    }
];

export function getMetricDefinitionByTitle(title = '') {
    return METRIC_DEFINITIONS.find((item) => item.matcher.test(title)) || null;
}

export default METRIC_DEFINITIONS;
