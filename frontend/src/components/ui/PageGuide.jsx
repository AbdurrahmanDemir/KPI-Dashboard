import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IconHelpCircle, IconX } from '@tabler/icons-react';

const GUIDE_STORAGE_PREFIX = 'kpi-dashboard-guide-seen:';

const guides = {
    '/': {
        key: 'dashboard',
        title: 'Genel Bakış Rehberi',
        intro: 'Bu sayfa tüm dashboardun hızlı özetidir. Trafik, gelir, dönüşüm ve reklam performansını tek ekranda takip edebilirsiniz.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Üst kartlarda kullanıcı, oturum, etkileşim, dönüşüm ve toplam gelir özetleri yer alır.',
                    'Trend grafikleri gelir ve sipariş değişimini zaman içinde gösterir.',
                    'Kanal, şehir ve ürün özetleri hangi kaynağın satışa daha çok katkısı olduğunu anlamanızı sağlar.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Tarih ve diğer filtreleri değiştirerek tüm ekranın aynı filtreyle güncellenmesini sağlayın.',
                    'Kanal grafiklerine tıklayarak ilgili kanala hızlı filtre uygulayın.',
                    'Detay gerektiren bir metrik görürseniz ilgili analiz sayfasına geçin.'
                ]
            }
        ]
    },
    '/marketing': {
        key: 'marketing',
        title: 'Pazarlama Analizi Rehberi',
        intro: 'Pazarlama harcaması, platform ROAS, Analytics ROAS ve attribution farkını birlikte okumak için kullanılır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'KPI kartları toplam harcama, platform ROAS, Analytics ROAS ve attribution farkını gösterir.',
                    'Kanal özeti, hangi pazarlama kanalının Analytics cirosuna daha çok katkısı olduğunu gösterir.',
                    'Attribution tablosu platform verisi ile Analytics verisi arasındaki farkları teşhis eder.',
                    'Kampanya scatter grafiği harcama ve ROAS ilişkisini görmeye yarar.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Platform ROAS ile Analytics ROAS arasındaki fark büyükse attribution tablosundaki yorumlara bakın.',
                    'Kanal grafiğine tıklayarak sayfayı tek kanala indirebilirsiniz.',
                    'Detaylı kanal karşılaştırması için Kanal Analizi sayfasını kullanın.'
                ]
            }
        ]
    },
    '/sales': {
        key: 'sales',
        title: 'Satış Analizi Rehberi',
        intro: 'Satış performansını ciro, sipariş, sepet ortalaması, iade ve tekrar satın alma açısından inceler.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'KPI kartları toplam ciro, sipariş, AOV, iade tutarı, iade oranı ve tekrar satın almayı gösterir.',
                    'Karşılaştırma modülünde ürün, şehir, cihaz veya ödeme yöntemi seçerek iki değeri yan yana analiz edebilirsiniz.',
                    'Radar ve bar grafikler ciro, AOV, sipariş, müşteri ve iade riskini daha kolay karşılaştırmanızı sağlar.',
                    'Detay tablolarında seçilen boyutun tüm satırlarını sıralayabilir ve CSV olarak indirebilirsiniz.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Önce karşılaştırma boyutunu seçin: ürün, şehir, cihaz veya ödeme yöntemi.',
                    'İki değer seçerek metrik farklarını ve grafiklerini inceleyin.',
                    'İade oranı yüksek ama cirosu da yüksek olan değerleri operasyonel risk olarak takip edin.'
                ]
            }
        ]
    },
    '/channels': {
        key: 'channels',
        title: 'Kanal Analizi Rehberi',
        intro: 'Kanalları ciro, harcama, ROAS, CTR, CVR, CPA ve attribution farkı üzerinden karşılaştırır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Kanal ciro grafikleri hangi kanalın daha çok gelir getirdiğini gösterir.',
                    'İnteraktif karşılaştırma modülünde iki kanal seçip detaylı metrik farklarını görebilirsiniz.',
                    'Radar grafik kanalların normalize performans profilini yan yana gösterir.',
                    'Seçili kanallardaki en büyük kampanyalar grafiği kanal içindeki ağırlıklı kampanyaları gösterir.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'İki kanal seçip ROAS, CTR, CVR ve CPA farkını birlikte okuyun.',
                    'Harcama yüksek ama Analytics ciro düşükse ilgili kanalda optimizasyon ihtimali vardır.',
                    'Grafiklere tıklayarak global kanal filtresi uygulayabilirsiniz.'
                ]
            }
        ]
    },
    '/campaigns': {
        key: 'campaigns',
        title: 'Kampanya Analizi Rehberi',
        intro: 'Kampanyaları harcama, ciro, ROAS, dönüşüm ve ürün etkisiyle detaylı incelemek için kullanılır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'ROAS ve harcama dağılım grafiği kampanyaların verimlilik konumunu gösterir.',
                    'Karşılaştırma modülünde iki kampanyayı seçip metrik farklarını, radar profilini ve aylık ciro trendini görebilirsiniz.',
                    'Detaylı kampanya tablosunda CPC, CPA, platform ROAS, Analytics ROAS, gelir payı ve skor bulunur.',
                    'Ürün harcama ve satış tablosu kampanyaların hangi ürünlere gelir getirdiğini gösterir.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Önce yüksek harcama ve düşük ROAS noktalarını scatter grafikte bulun.',
                    'Iki kampanyayi seçerek aradaki ciro, maliyet ve dönüşüm farkını karşılaştırın.',
                    'Aylık trendde bir kampanyanın tek seferlik mi yoksa sürdürülebilir mi olduğunu kontrol edin.'
                ]
            }
        ]
    },
    '/utm': {
        key: 'utm',
        title: 'UTM Analizi Rehberi',
        intro: 'Bu modül mevcut pazarlama ve satış analizlerinden bağımsızdır. Burada kendi UTM linklerinizi üretir, test eder ve sadece bu linklerden gelen etkinlikleri analiz edersiniz.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'UTM oluşturucu ile source, medium, campaign, content ve term bilgileriyle yeni takip linki üretirsiniz.',
                    'Takip linki tıklamayı kaydeder ve hedef URL\'ye UTM parametrelerini ekleyerek yönlendirir.',
                    'Test ve validasyon alanı yalnızca bu modül için örnek tıklama, lead ve satış verisi üretir.',
                    'Grafik ve tablolar sadece UTM linklerinden toplanan etkinlikleri gösterir.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Önce yeni bir UTM linki oluşturun ve reklam ya da kampanya alanında bu takip linkini kullanın.',
                    'İsterseniz test butonlarıyla modüle örnek veri ekleyip grafiklerin çalışmasını hemen doğrulayın.',
                    'Aynı ekranda iki UTM linki seçerek tıklama, lead, satış ve gelir farklarını karşılaştırın.',
                    'Bu modül genel dashboard filtrelerinden bağımsız çalıştığı için mevcut satış ve pazarlama analizleriyle karışmaz.'
                ]
            }
        ]
    },
    '/traffic': {
        key: 'traffic',
        title: 'Trafik Analizi Rehberi',
        intro: 'Trafik kalitesini oturum, kullanıcı, hemen çıkma, süre ve dönüşüm metrikleriyle takip eder.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Trafik KPI kartları oturum, kullanıcı, yeni kullanıcı ve davranış metriklerini özetler.',
                    'Grafikler trafik kaynaklarının ve cihazların performansını gösterir.',
                    'Tablolar kaynak, kanal veya kampanya bazında detaylı inceleme yapmanızı sağlar.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Yüksek trafik ama düşük dönüşüm olan kaynakları ayıklayın.',
                    'Hemen cikma ve sayfa/oturum metriklerini kampanya filtreleriyle birlikte okuyun.',
                    'Trafik kalitesi düşük kanallar için kampanya ve landing page kontrolü yapın.'
                ]
            }
        ]
    },
    '/funnel': {
        key: 'funnel',
        title: 'Funnel Analizi Rehberi',
        intro: 'Kullanıcıların satın alma yolculuğunda hangi aşamada kaybolduğunu gösterir.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Funnel grafik aşamalar arasındaki geçiş ve kayıp oranlarını gösterir.',
                    'Kanal veya cihaz filtreleriyle kaybın nereden geldiğini daha net görebilirsiniz.',
                    'Tablolar her adımın oturum ve dönüşüm sayısını detaylandırır.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'En büyük düşüşün olduğu adımı bulun.',
                    'Aynı adımı kanal ve cihaz filtreleriyle tekrar kontrol edin.',
                    'Checkout veya ödeme adımında yüksek kayıp varsa teknik/UX kontrolü planlayın.'
                ]
            }
        ]
    },
    '/cohort': {
        key: 'cohort',
        title: 'Cohort Analizi Rehberi',
        intro: 'Kullanıcı gruplarının zaman içindeki geri dönüş ve gelir davranışını incelemek için kullanılır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Cohort heatmap belirli dönemde gelen kullanıcıların sonraki dönemlerdeki performansını gösterir.',
                    'Tablolar cohort, dönem ve metrik bazında detay sunar.',
                    'Filtrelerle kampanya veya kanal kaynaklı cohort farklarını inceleyebilirsiniz.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'İlk dönemden sonra hızlı düşen cohortları belirleyin.',
                    'Kampanya filtreleriyle hangi acquisition kaynağının daha kalıcı olduğunu kontrol edin.',
                    'Retention ve gelir davranışını birlikte yorumlayın.'
                ]
            }
        ]
    },
    '/data/overview': {
        key: 'data-overview',
        title: 'Veri Özeti Rehberi',
        intro: 'Sistemdeki veri setlerinin durumunu ve son güncellenme bilgilerini takip eder.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Import, API ve tablo bazında kayıt sayıları görünür.',
                    'Son güncelleme zamanları veri tazeliği hakkında fikir verir.',
                    'Eksik veya düşük hacimli veri kaynakları hızlıca fark edilir.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Analizlerde beklenmeyen sonuç varsa önce veri özetini kontrol edin.',
                    'Son import durumunu ve kayıt sayılarını karşılaştırın.',
                    'Eksik kaynak varsa Veri Yükleme veya API Entegrasyonları sayfasına geçin.'
                ]
            }
        ]
    },
    '/data/import': {
        key: 'data-import',
        title: 'Veri Yükleme Rehberi',
        intro: 'CSV veya Excel dosyalarını sisteme yüklemek ve alan eşleştirmelerini kontrol etmek için kullanılır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Dosya yükleme alanı ve veri tipi seçimi bulunur.',
                    'Alan eşleştirme ve validasyon adımları import öncesi hataları yakalar.',
                    'Import geçmişi yüklenen dosyaların sonucunu takip etmeye yarar.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Önce doğru veri tipini seçin.',
                    'Dosyayı yükledikten sonra kolon eşleştirmelerini kontrol edin.',
                    'Validasyon uyarılarını düzeltmeden importu tamamlamayın.'
                ]
            }
        ]
    },
    '/data/integrations': {
        key: 'data-integrations',
        title: 'API Entegrasyonları Rehberi',
        intro: 'Google Ads, Meta Ads ve benzeri kaynaklarla API bağlantılarını yönetmek için kullanılır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Entegrasyon durumları ve bağlantı ayarları görünür.',
                    'Test veya senkronizasyon işlemleri buradan başlatılır.',
                    'API kaynaklı veri temizleme veya yenileme işlemleri takip edilir.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Bağlantı durumunu kontrol edin.',
                    'Yeni veri çekmeden önce tarih ve kaynak ayarlarının doğru olduğundan emin olun.',
                    'Senkronizasyon sonrası Veri Özeti sayfasından kayıt sayılarını kontrol edin.'
                ]
            }
        ]
    },
    '/export': {
        key: 'export',
        title: 'Raporlama Rehberi',
        intro: 'Dashboard verilerini Excel, CSV veya PDF formatında dışa aktarmak için kullanılır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Rapor türü ve format seçimleri bulunur.',
                    'Aktif filtrelere göre rapor oluşturabilirsiniz.',
                    'KPI, kanal, kampanya, ürün ve attribution çıktıları rapora dahil edilebilir.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Önce global filtreleri istediğiniz döneme göre ayarlayın.',
                    'Rapor formatını seçin.',
                    'İndirdiğiniz raporu ekip veya müşteri paylaşımı için kullanın.'
                ]
            }
        ]
    },
    '/segments': {
        key: 'segments',
        title: 'Segment Yönetimi Rehberi',
        intro: 'Kullanıcı, kampanya veya satış segmentlerini oluşturmak ve takip etmek için kullanılır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Kayıtlı segmentler, kuralları ve durumları listelenir.',
                    'Segment detayına giderek kapsadığı kitle veya kuralları inceleyebilirsiniz.',
                    'Yeni segment oluşturma aksiyonu buradan başlatılır.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Segment listesini amacınıza göre filtreleyin veya arayın.',
                    'Yeni segment için kural kurucuyu açın.',
                    'Segmenti kaydettikten sonra etkilediği kayıt sayısını kontrol edin.'
                ]
            }
        ]
    },
    '/segments/new': {
        key: 'segment-builder',
        title: 'Segment Oluşturma Rehberi',
        intro: 'Filtre ve koşullarla yeni segment tanımlamak için kullanılır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Segment adı, tipi ve kural alanları bulunur.',
                    'Kurallar kanal, kampanya, ürün, şehir, cihaz ve gelir gibi alanlara göre kurulabilir.',
                    'Önizleme veya kaydetme adımları segmentin doğru çalıştığını kontrol etmenizi sağlar.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Önce segment amacını belirleyin.',
                    'Koşulları daraltarak hedef kitleyi netleştirin.',
                    'Kaydetmeden önce segment sonucunu kontrol edin.'
                ]
            }
        ]
    },
    '/users': {
        key: 'users',
        title: 'Takım Yönetimi Rehberi',
        intro: 'Kullanıcıları, rollerini ve erişim seviyelerini yönetmek için kullanılır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Kullanıcı listesi ve rol bilgileri görünür.',
                    'Yeni kullanıcı ekleme veya mevcut kullanıcıyı düzenleme işlemleri yapılır.',
                    'Admin, pazarlama yetkilisi ve görüntüleyici rolleri erişimleri belirler.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Kullanıcı rolünü görevine göre seçin.',
                    'Gereksiz admin yetkisi vermekten kaçının.',
                    'Değişikliklerden sonra kullanıcının erişebildiği menüleri kontrol edin.'
                ]
            }
        ]
    },
    '/logs': {
        key: 'logs',
        title: 'Denetim Logları Rehberi',
        intro: 'Sistemde yapılan önemli işlemleri ve kullanıcı hareketlerini takip eder.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Kullanıcı, işlem, tarih ve durum bilgileri listelenir.',
                    'Hata veya kritik aksiyonlar geriye dönük incelenebilir.',
                    'Filtreler denetim sürecini hızlandırır.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Sorun yaşandığı tarih aralığını filtreleyin.',
                    'Kullanıcı veya işlem tipine göre daraltın.',
                    'Tekrarlayan hataları backend veya veri kaynağı kontrolü için not alın.'
                ]
            }
        ]
    },
    '/settings': {
        key: 'settings',
        title: 'Ayarlar Rehberi',
        intro: 'Dashboard davranışı ve genel ayarları yönetmek için kullanılır.',
        sections: [
            {
                title: 'Bu sayfada ne var?',
                items: [
                    'Genel sistem ayarları ve tercihler bulunur.',
                    'Tema, rapor veya uygulama davranışı gibi ayarlar buradan yönetilebilir.',
                    'Yetkiye göre görülebilen ayarlar değişebilir.'
                ]
            },
            {
                title: 'Nasıl kullanılır?',
                items: [
                    'Değişiklik yapmadan önce etkilediği alanları kontrol edin.',
                    'Kaydettikten sonra ilgili sayfada sonucu test edin.',
                    'Emin olmadığınız sistem ayarlarını varsayılan değerde bırakın.'
                ]
            }
        ]
    }
};

const getGuideForPath = (pathname) => {
    if (pathname.startsWith('/segments/') && pathname.endsWith('/edit')) return guides['/segments/new'];
    if (pathname.startsWith('/segments/') && pathname !== '/segments/new') {
        return {
            key: 'segment-detail',
            title: 'Segment Detay Rehberi',
            intro: 'Seçili segmentin kurallarını, kapsamını ve performans etkisini incelemek için kullanılır.',
            sections: [
                {
                    title: 'Bu sayfada ne var?',
                    items: [
                        'Segment tanımı, kuralları ve temel bilgileri görünür.',
                        'Segmentin kapsadigi kayıtlar veya metrikler incelenebilir.',
                        'Gerekirse segment düzenleme akışına geçilebilir.'
                    ]
                },
                {
                    title: 'Nasıl kullanılır?',
                    items: [
                        'Kuralların beklediğiniz kitleyi kapsadığını kontrol edin.',
                        'Segment çok geniş veya çok darsa düzenleme ekranına geçin.',
                        'Segmenti raporlama veya analiz filtreleriyle birlikte kullanın.'
                    ]
                }
            ]
        };
    }

    return guides[pathname] || guides['/'];
};

export default function PageGuide() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const guide = useMemo(() => getGuideForPath(location.pathname), [location.pathname]);

    useEffect(() => {
        const storageKey = `${GUIDE_STORAGE_PREFIX}${guide.key}`;
        if (!window.localStorage.getItem(storageKey)) {
            setIsOpen(true);
        }
    }, [guide.key]);

    useEffect(() => {
        const scrollContainer = document.querySelector('main');
        if (!scrollContainer) return undefined;

        const handleScroll = () => {
            setIsCompact(scrollContainer.scrollTop > 80);
        };

        handleScroll();
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [location.pathname]);

    const closeGuide = () => {
        window.localStorage.setItem(`${GUIDE_STORAGE_PREFIX}${guide.key}`, '1');
        setIsOpen(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                title="Sayfa rehberini aç"
                style={{
                    position: 'fixed',
                    right: 0,
                    top: '116px',
                    zIndex: 900,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: isCompact ? '10px' : '10px 12px',
                    border: '1px solid var(--color-border)',
                    borderRight: 'none',
                    borderRadius: '8px 0 0 8px',
                    background: 'var(--color-accent-primary)',
                    color: '#fff',
                    boxShadow: 'var(--shadow-card)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 700,
                    minWidth: isCompact ? '42px' : '92px',
                    justifyContent: 'center',
                    transition: 'min-width 0.2s ease, padding 0.2s ease'
                }}
            >
                <IconHelpCircle size={18} stroke={1.8} />
                {!isCompact && <span>Rehber</span>}
            </button>

            {isOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={guide.title}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 1200,
                        background: 'rgba(15, 23, 42, 0.45)',
                        display: 'flex',
                        justifyContent: 'flex-end'
                    }}
                    onClick={closeGuide}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: 'min(520px, 100vw)',
                            height: '100%',
                            background: 'var(--color-bg-secondary)',
                            borderLeft: '1px solid var(--color-border)',
                            boxShadow: '0 18px 60px rgba(15, 23, 42, 0.25)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ padding: '22px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
                                    Sayfa Rehberi
                                </div>
                                <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--color-text-primary)' }}>{guide.title}</h2>
                                <p style={{ margin: '8px 0 0', color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                                    {guide.intro}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeGuide}
                                title="Rehberi kapat"
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-border)',
                                    background: 'var(--color-bg-primary)',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <IconX size={18} stroke={1.8} />
                            </button>
                        </div>

                        <div style={{ padding: '22px 24px', overflowY: 'auto', display: 'grid', gap: '18px' }}>
                            {guide.sections.map((section) => (
                                <section key={section.title} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', background: 'var(--color-bg-primary)' }}>
                                    <h3 style={{ margin: '0 0 10px', fontSize: '15px', color: 'var(--color-text-primary)' }}>{section.title}</h3>
                                    <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.7 }}>
                                        {section.items.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </section>
                            ))}

                            <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'rgba(0, 133, 219, 0.08)', border: '1px solid rgba(0, 133, 219, 0.18)', color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                                Bu rehber ilk ziyarette otomatik açılır. Sonraki girişlerde sağdaki Rehber butonundan tekrar açabilirsiniz.
                            </div>
                        </div>

                        <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={closeGuide}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--color-accent-primary)',
                                    background: 'var(--color-accent-primary)',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 700
                                }}
                            >
                                Anladım
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


