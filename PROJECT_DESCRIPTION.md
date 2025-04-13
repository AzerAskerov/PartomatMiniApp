# PartoMat Telegram miniApp Layihə Təsviri

## LAYIHƏ İCMALI
PartoMat avtomobil hissələrini axtarmaq və sorğu yaratmaq üçün Telegram miniApp platformasında işləyən mobil tətbiqdir. Bu layihə iki istiqamətli bazarı bir araya gətirir: müştərilər tərəfindən sorğular və təchizatçılar tərəfindən cavablar. Telegram-ın miniApp platforması, tətbiqi yükləmədən dərhal istifadə edərək müştərilərə rahat giriş imkanı yaradır.

## TEXNİKİ SPESİFİKASİYALAR
- **Frontend**: Telegram miniApp (JavaScript, HTML, CSS)
- **Backend**: Serverless Firebase
- **Autentifikasiya**: Telegram-ın daxili autentifikasiyası
- **Verilənlər bazası**: Firebase Firestore (NoSQL)
- **Saxlama**: Firebase Storage
- **Mesajlaşma**: Firebase Cloud Messaging və Telegram-ın daxili bildiriş sistemi
- **Real-time xüsusiyyətləri**: Firestore dinləyiciləri

## DİZAYN SİSTEMİ
- **Rəng sxemi**: Mavi əsas (#3b82f6), ağ arxa fon, boz aksentlər
- **Tipoqrafiya**: Sistem şriftləri, aydın iyerarxiya ilə
- **Komponentlər**: Yuvarlaq küncler, zərif kölgələr, aydın vizual iyerarxiya
- **İkonlar**: Material və ya xüsusi ikon dəsti
- **Telegram tema uyğunluğu**: Açıq və qaranlıq Telegram temalarına uyğunlaşan dinamik interfeys

## ƏSAS İSTİFADƏÇI AXINLARI - MÜŞTƏRİ TƏTBIQI
1. **Telegram vasitəsilə daxil olma**: Yenidən qeydiyyat tələb etmir
2. **Avtomobil idarəetməsi**: Avtomobil əlavə etmə və seçim
3. **Hissə sorğusu yaratma**: Axtarış, şəkillə axtarış və sorğu formasından istifadə
4. **Satıcı cavablarını görmə**: Hər bir sorğu üçün bütün satıcı təkliflərini göstərmə
5. **Tətbiq daxilində mesajlaşma**: Satıcılarla birbaşa əlaqə
6. **Profil idarəetməsi**: İstifadəçi məlumatlarının idarəolunması

## ƏSAS İSTİFADƏÇİ AXINLARI - TƏCHİZATÇI TƏTBIQI
1. **Biznes profili qurma**: Telegram vasitəsilə daxil olma və biznes profili yaratma
2. **İxtisaslaşma konfiqurasiyası**: Avtomobil markaları, hissə kateqoriyaları və s. 
3. **Sorğu qəbulu və idarə edilməsi**: Müştəri sorğularını görmə və idarə etmə
4. **Cavab yaratma**: Müştərilərə təkliflər göndərmə
5. **Tətbiq daxilində müştərilərlə ünsiyyət**: Sualları cavablandırma və detalları dəqiqləşdirmə
6. **Biznes analitikası və abunəlik idarəetməsi**: Sorğu və cavab performansının izlənməsi

## TELEGRAM MİNİAPP ÜSTÜNLÜKLƏRİ
- **Sürətli başlanğıc**: Əlavə tətbiq yükləmədən dərhal istifadə imkanı
- **İnteqrasiya olunmuş ödənişlər**: Telegram-ın daxili ödəniş sistemi
- **Paylaşım imkanı**: Sorğuları asanlıqla Telegram qruplarında və kanallarda paylaşmaq
- **Aşağı giriş maneəsi**: İstifadəçilər üçün minimal əngəl
- **Aşağı inkişaf xərcləri**: Tək platformada istehsal, həm iOS həm də Android-də işləyir
- **Telegram əhatə dairəsi**: Mövcud istifadəçi bazasından faydalanma

## GƏLİR MODELİ
PartoMat Telegram miniApp tətbiqi üç səviyyəli abunəlik modeli təklif edir:

1. **Free Paket**: Yeni təchizatçılar üçün məhdud sorğu əhatəsi
2. **Standard Paket**: Orta səviyyəli təchizatçılar üçün genişləndirilmiş imkanlar
3. **Premium Paket**: Böyük təchizatçılar üçün limitsiz imkanlar və əlavə xidmətlər

## İLK FAZALAR
1. **MVP Buraxılışı**: Əsas funksionallıqla Telegram miniApp buraxılışı
2. **Bazar Validasiyası**: İlkin istifadəçilərdən geri bildiriş toplama
3. **Genişlənmə**: Əlavə xüsusiyyətlər və təkmilləşdirmələr
4. **Monetizasiya**: Təchizatçılar üçün abunəlik planlarının tətbiqi

Bu Telegram miniApp yanaşması, PartoMat-a sürətli bazara çıxış, az xərclə MVP-ni test etmək və avtomobil hissələri axtarışı problemini həll etmək üçün ideal imkan yaradır. 