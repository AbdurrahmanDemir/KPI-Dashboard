const round = (value, digits = 2) => Number(Number(value || 0).toFixed(digits));

const buildAttributionInsight = ({
    spend = 0,
    impressions = 0,
    clicks = 0,
    sessions = 0,
    analyticsOrders = 0,
    analyticsRevenue = 0,
    platformRevenue = 0
}) => {
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const analyticsCvr = sessions > 0 ? (analyticsOrders / sessions) * 100 : 0;
    const analyticsRoas = spend > 0 ? analyticsRevenue / spend : 0;
    const platformRoas = spend > 0 ? platformRevenue / spend : 0;
    const attributionGap = platformRevenue - analyticsRevenue;

    const insight = {
        code: 'BALANCED',
        severity: 'info',
        diagnosis: 'Attribution dengeli',
        recommended_action: 'Mevcut kanal ve kampanya karmasini izlemeye devam edin.'
    };

    if (spend > 0 && clicks === 0) {
        insight.code = 'DELIVERY_WITHOUT_CLICKS';
        insight.severity = 'high';
        insight.diagnosis = 'Teslimat var ama tiklama yok';
        insight.recommended_action = 'Reklam teslimati, yerlesim ve tracking yapisini kontrol edin.';
    } else if (ctr < 1.2) {
        insight.code = 'LOW_INTEREST';
        insight.severity = 'medium';
        insight.diagnosis = 'Ust huni zayif: kreatif veya hedefleme kontrol edilmeli';
        insight.recommended_action = 'Kreatif, mesaj ve hedefleme segmentlerini test edin.';
    } else if (analyticsCvr < 1) {
        insight.code = 'LOW_CONVERSION';
        insight.severity = 'medium';
        insight.diagnosis = 'Alt huni zayif: urun, teklif veya landing page kontrol edilmeli';
        insight.recommended_action = 'Landing page, teklif, fiyat ve urun deneyimini gozden gecirin.';
    } else if (attributionGap > analyticsRevenue * 0.25) {
        insight.code = 'PLATFORM_OVERREPORTING';
        insight.severity = 'medium';
        insight.diagnosis = 'Platform gelir iddiasi analytics kaynagindan yuksek';
        insight.recommended_action = 'Attribution penceresi ve platform bazli donusum tanimlarini karsilastirin.';
    } else if (attributionGap < analyticsRevenue * -0.2) {
        insight.code = 'ANALYTICS_OVERREPORTING';
        insight.severity = 'low';
        insight.diagnosis = 'Analytics geliri platform gelirinden yuksek gorunuyor';
        insight.recommended_action = 'Channel mapping ve kampanya eslesmelerini kontrol edin.';
    }

    return {
        ...insight,
        ctr: round(ctr),
        analytics_cvr: round(analyticsCvr),
        analytics_roas: round(analyticsRoas),
        platform_roas: round(platformRoas),
        attribution_gap: round(attributionGap)
    };
};

module.exports = {
    buildAttributionInsight
};
