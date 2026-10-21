-- Seed nội dung TOEIC theo bộ sách Zenlish (sinh từ supabase/seed/toeic/content.json).
-- Lý thuyết là bản chép từ sách Zenlish (Foundation, Beginner, Camp Bomb Đọc,
-- Submarine Đọc) Đạt chụp/scan ngày 2026-10-21; link đề là bài miễn phí trên
-- zenlishtoeic.vn/stm-quizzes/<slug>/. Upsert theo khoá nên chạy lại an toàn;
-- đổi nội dung → sửa content.json rồi tạo migration seed mới, KHÔNG sửa file này.

insert into toeic_books (id, title, skill, level, sort_order, target, description) values
('foundation', 'Foundation', 'listening', 'Mất gốc', 1, 'Part 1 ≥ 5/6 · Part 2 ≥ 18/25', 'Ngữ âm (IPA, nối âm), Part 1 tranh người, Part 2 đủ các dạng câu hỏi.'),
('beginner', $md$Beginner's 350+$md$, 'listening', '0 → 350', 2, 'Part 3 ≥ 28/39 · Part 4 ≥ 18/30', 'Ôn Part 1–2 và học phương pháp Part 3 (học thuộc hội thoại), Part 4 (nghe nhắc lại).'),
('campbomb-lc', 'Camp Bomb · Nghe', 'listening', '450 → 600', 3, 'LC 65/100: P1 4 · P2 18 · P3 25 · P4 18', 'Sách toàn luyện đề — làm bài Ca_ LC trên Zenlish.'),
('submarine-lc', 'Submarine · Nghe', 'listening', '700+', 4, 'LC 80/100: P1 5 · P2 20 · P3 31 · P4 24', 'Sách toàn luyện đề — làm bài Sub_/Su_ LC trên Zenlish.'),
('campbomb-rc', 'Camp Bomb · Đọc', 'reading', '450 → 600', 5, 'RC 55/100: P5 18 · P6 8 · P7 29', 'Ngữ pháp Part 5 (từ loại, động từ, danh/đại từ, tính/trạng từ, giới từ, liên từ, MĐQH), Part 6, Part 7.'),
('submarine-rc', 'Submarine · Đọc', 'reading', '700+', 6, 'RC 72/100: P5 24 · P6 12 · P7 36', 'Phần mới so với Camp Bomb: V-ing/To V/PII, rút gọn mệnh đề, so sánh, đại từ nâng cao.')
on conflict (id) do update set
  title = excluded.title, skill = excluded.skill, level = excluded.level,
  sort_order = excluded.sort_order, target = excluded.target, description = excluded.description;

insert into toeic_lessons (id, book_id, lesson_no, title, part, kind, theory_md, checkpoint) values
('foundation-01', 'foundation', 1, 'Ngữ âm: nguyên âm đơn', null, 'theory', $md$## Bảng IPA (44 âm)

**Nguyên âm đơn (12):** /iː/ sheep · /ɪ/ ship · /ʊ/ good · /uː/ shoot · /e/ bed · /ə/ teacher · /ɜː/ bird · /ɔː/ door · /æ/ cat · /ʌ/ up · /ɑː/ far · /ɒ/ on

**Nguyên âm đôi (8):** /ɪə/ here · /eɪ/ wait · /ʊə/ tourist · /ɔɪ/ boy · /əʊ/ show · /eə/ hair · /aɪ/ my · /aʊ/ cow

**Phụ âm (24):**
| Cặp vô thanh / hữu thanh | | Âm còn lại | |
|---|---|---|---|
| /p/ pea – /b/ boat | /f/ fly – /v/ video | /m/ man | /h/ hat |
| /t/ tea – /d/ dog | /θ/ think – /ð/ this | /n/ now | /l/ love |
| /tʃ/ cheese – /dʒ/ June | /s/ see – /z/ zoo | /ŋ/ sing | /r/ red |
| /k/ car – /g/ go | /ʃ/ shall – /ʒ/ television | /w/ wet | /j/ yes |

## Nguyên âm đơn (Monophthongs)

| # | Âm | Từ ví dụ |
|---|---|---|
| 01 | /iː/ | see /siː/, agree /əˈɡriː/, eat /iːt/, seat /siːt/, team /tiːm/, field /fiːld/, piece /piːs/, these /ðiːz/, metre /ˈmiːtə/, secret /ˈsiːkrət/ |
| 02 | /ɪ/ | if /ɪf/, listen /ˈlɪsən/, miss /mɪs/, dinner /ˈdɪnə/, swim /swɪm/, busy /ˈbɪzi/, business /ˈbɪznɪs/, building /ˈbɪldɪŋ/, system /ˈsɪstəm/ |
| 03 | /uː/ | too /tuː/, group /ɡruːp/, shoe /ʃuː/, blue /bluː/, music /ˈmjuːzɪk/, new /njuː/, two /tuː/, fruit /fruːt/, juice /dʒuːs/ |
| 04 | /ʊ/ | full /fʊl/, sugar /ˈʃʊɡə/, book /bʊk/, foot /fʊt/, would /wʊd/, woman /ˈwʊmən/ |
| 05 | /ɑː/ | after /ˈɑːftə/, afternoon /ˌɑːftəˈnuːn/, ask /ɑːsk/, answer /ˈɑːnsə/, bath /bɑːθ/, bathroom /ˈbɑːθruːm/, can't /kɑːnt/, class /klɑːs/, dance /dɑːns/, fast /fɑːst/ |
| 06 | /ʌ/ | bus /bʌs/, colour /ˈkʌlə/, come /kʌm/, cup /kʌp/, front /frʌnt/ (phía trước), London /ˈlʌndən/, luck /lʌk/, Monday /ˈmʌndeɪ/, month /mʌnθ/, mother /ˈmʌðə/ |
| 07 | /ɒ/ | bottle /ˈbɒtəl/, box /bɒks/, chocolate /ˈtʃɒklət/, clock /klɒk/, coffee /ˈkɒfi/, copy /ˈkɒpi/, cost /kɒst/, cross /krɒs/ (băng qua), doctor /ˈdɒktə/, dog /dɒɡ/ |
| 08 | /ɔː/ | all /ɔːl/, ball /bɔːl/, call /kɔːl/, fall /fɔːl/ (mùa thu, rơi), tall /tɔːl/, wall /wɔːl/, water /ˈwɔːtə/, talk /tɔːk/, walk /wɔːk/, autumn /ˈɔːtəm/ (mùa thu) |
| 09 | /e/ | check /tʃek/, leg /leɡ/, letter /ˈletə/, red /red/, sentence /ˈsentəns/ (câu), bread /bred/, head /hed/, read (quá khứ) /red/, friend /frend/, any /ˈeni/ |
| 10 | /æ/ | back /bæk/, camera /ˈkæmrə/, factory /ˈfæktəri/, hat /hæt/, jam /dʒæm/ (mứt hoa quả), manager /ˈmænɪdʒə/, map /mæp/, plan /plæn/, traffic /ˈtræfɪk/ (giao thông) |
| 11 | /ɜː/ | bird /bɜːd/, first /fɜːst/, birthday /ˈbɜːθdeɪ/, circle /ˈsɜːkəl/, thirty /ˈθɜːti/, word /wɜːd/, work /wɜːk/, world /wɜːld/, worse /wɜːs/, worst /wɜːst/ |

**Cặp dễ nhầm khi nghe:** /iː/–/ɪ/ (seat – sit), /uː/–/ʊ/ (fool – full), /ɑː/–/ʌ/ (cart – cut), /ɔː/–/ɒ/, /e/–/æ/ (bed – bad), /ɜː/–/ɔː/ (work – walk ⚠️ rất hay gặp trong TOEIC).

## Sáu bước thoát mất gốc ngữ âm sau 2 tuần
1. Viết rõ mục tiêu và hạn, dán ở đầu giường, hình nền điện thoại, máy tính.
2. Tra phiên âm và nghĩa của tất cả từ trong giáo trình.
3. Đọc mỗi từ 30 lần, chú ý miệng, răng, lưỡi và hơi.
4. Quay video mỗi từ đọc 30 lần (không gian lận).
5. Chép toàn bộ audio giáo trình vào điện thoại.
6. Nghe lại audio đã học trước khi ngủ và lúc thức dậy.
$md$, 'Đọc đúng 11 nguyên âm đơn, phân biệt work/walk, seat/sit.'),
('foundation-02', 'foundation', 2, 'Nguyên âm đôi + phụ âm cơ bản', null, 'theory', $md$## Nguyên âm đôi + Phụ âm cơ bản

### Nguyên âm đôi (Diphthongs)
| # | Âm | Từ ví dụ |
|---|---|---|
| 12 | /ɪə/ | real, ear, beard (râu), clear, hear (nghe), nearly, year, beer, cheers (chúc mừng), here, we're |
| 13 | /eə/ | care, square (quảng trường), air, chair, fair, hair, stair (bậc thang), wear, where, aeroplane (máy bay) |
| 14 | /aɪ/ | like, time, white, die, dry (khô), July, why, high, night, right, buy |
| 15 | /eɪ/ | age, came, plane, table, rain, wait, day, play, say, grey, break (phá vỡ, nghỉ giải lao), great, eight, weight |
| 16 | /ɔɪ/ | coin, point (chỉ trỏ), voice, boy, enjoy, toy |
| 17 | /əʊ/ | no, cold, post, close (đóng; ở gần), drove /drəʊv/ (đã lái), home, phone, know, low (thấp), show (chương trình, chỉ ra), slow (chậm), boat /bəʊt/ (con thuyền), toe /təʊ/ (ngón chân) |
| 18 | /aʊ/ | how, now, vowel /ˈvaʊəl/ (nguyên âm), loud (to, ầm ĩ), mouth, sound |

### Phụ âm cơ bản
| # | Âm | Từ ví dụ |
|---|---|---|
| 1 | /p/ | pen, push (đẩy; ngược lại pull: kéo), stop, happy, stopping |
| 2 | /b/ | big, best, rob (cướp), robber (tên cướp), verb |
| 3 | /k/ | car, cat, careful, clean, close, keep, key, kind, kitchen, desk, like, talk, walk |
| 4 | /g/ | garden, glass, go, ago, hungry, bag, leg, egg (quả trứng), bigger |
| 5 | /f/ | feel, first, café (quán cà phê), after, leaf (lá), off, coffee, phone, autograph (chữ ký), laugh |
| 6 | /v/ | very, travel, every, have, leave |
| 7 | /s/ | sit, sister, bus, class, glasses, city, circle, pencil, place, police |
| 8 | /z/ | easy, husband, roses, zoo, zero, size, jazz /dʒæz/ (nhạc jazz) |
| 9 | /m/ | me, more, lemon /ˈlemən/ (chanh), swim, film, some, sometimes, summer |
| 10 | /n/ | new, now, sun, one, gone, dinner, sunny, knew, know, knife /naɪf/ (con dao) |
| 11 | /ŋ/ | evening, long, sing, singer, thing, bank, thanks, uncle |
| 12 | /h/ | hat, here, help, hot, how, behind, who, whose (của ai), whole (toàn bộ) |
| 13 | /l/ | learn, leave, language /ˈlæŋɡwɪdʒ/ (ngôn ngữ), lovely, alone, feel, help, tall, well, yellow |
| 14 | /r/ | red, ready, really, right, road, room, ferry (cái phà), sorry, wrap /ræp/ (gói), wrist /rɪst/ (cổ tay), write/written, wrote |

**Âm câm:** *wr-* → w câm (write, wrap, wrist) · *kn-* → k câm (know, knife, knew, kneel) · *wh-* trước o → đọc /h/ (who, whose, whole).
$md$, null),
('foundation-03', 'foundation', 3, 'Phụ âm nâng cao + nối âm', null, 'theory', $md$## Phụ âm nâng cao

| # | Âm | Từ ví dụ |
|---|---|---|
| 15 | /t/ | tea, till, ten, top (đỉnh), two, twenty, water, bit, complete /kəmˈpliːt/ (hoàn thành), eat, eight, light |
| 16 | /d/ | day, deep, do, door, did, food, good, head, ready, add, address, ladder /ˈlædə/ (cái thang) |
| 17 | /ʃ/ | shop, fashion, cash (tiền mặt), fresh (tươi, mới), wash, mushroom /ˈmʌʃruːm/ (nấm), ocean (đại dương), machine (máy móc), delicious, special, sugar, sure |
| 18 | /ʒ/ | television, Asia, usually |
| 19 | /tʃ/ | chips (khoai tây chiên), choose, march, which, future, question, catch, watch, kitchen |
| 20 | /dʒ/ | jam, jacket, jeans, job, jet /dʒet/ (máy bay phản lực), general, age, large, fridge /frɪdʒ/ (tủ lạnh) |
| 21 | /θ/ | thin, thanks, thirty, theatre /ˈθɪətə/ (nhà hát), thumb /θʌm/ (ngón cái), Thursday, thirsty (khát), three, both, month, mouth, north, south, birthday |
| 22 | /ð/ | this, that, these, those (những cái kia), then (sau đó), they, father, mother, brother, other, together, weather, without, breathe, with (với) |
| 23 | /w/ | week, wet (ướt), way (con đường, cách), warm, well, weather, windy (có gió), away (xa khỏi), always, twelve |
| 24 | /j/ | yes, yesterday, year, young, usual (thông thường), student, university, new, view, interview, beautiful, queue, Europe |

**Từ vựng Đạt ghi thêm:** interview (n) cuộc phỏng vấn, (v) phỏng vấn · interviewee (n) người được phỏng vấn · interviewer (n) người phỏng vấn · airport sân bay · airline hãng hàng không · pilot phi công · flight attendant tiếp viên hàng không · knee đầu gối.

## Phụ lục: Nối âm (Linking sounds)

**Quy tắc 1, phụ âm + nguyên âm:** phụ âm cuối của từ trước nối với nguyên âm đầu của từ sau.
- piece‿of paper · a book‿on the desk · the back‿of the chair · desserts‿are‿on display · such‿a · with‿an‿old friend · who‿is‿in · lead‿engineer · in charge‿of · it was‿a gift · which‿office‿is · five‿or six · wrapping book‿in paper · buildings‿are · a sheet‿of paper · the pies‿are being sliced · that was‿a client · right‿over there · fix‿it · leaves‿at two · in‿an‿hour · it's‿up to you (tùy bạn) · which‿is · get‿you

**Quy tắc 2, phụ âm + phụ âm giống nhau:** khi âm cuối của từ trước trùng âm đầu của từ sau thì chỉ phát âm một lần, ví dụ *bus stop* → /bʌstɒp/, *black car*, *good day*.
$md$, null),
('foundation-04', 'foundation', 4, 'Part 1: tranh chỉ người (1)', 1, 'theory', $md$## Giới thiệu
| Mục | Nội dung |
|---|---|
| Số câu | 6 (câu 1–6) |
| Dạng | Xem ảnh, nghe 4 đáp án, chọn câu mô tả đúng nhất |
| Nội dung đáp án | Hành động của một hay nhiều người, hoặc trạng thái, vị trí của vật, cảnh |
| Khung cảnh | Trong nhà (nhà hàng, nhà sách, văn phòng, rạp phim…) hoặc ngoài trời (bãi biển, bờ sông, công viên, quảng trường…) |
| Lời khuyên | Học thuộc từ và cụm từ mô tả hành động của người và trạng thái của vật |
| Mục tiêu của sách | 3/6 |

Ví dụ: ảnh 3 người đứng cạnh bàn có máy chiếu → đáp án (C) *They're standing near the table.*

**Cấu trúc câu gặp nhiều nhất:**
- Người đang làm gì: **S + is/are + V-ing** → *A woman is holding some containers.*
- Vật đang bị làm gì: **S + is/are being + V3** → *A cord is being plugged in.* (phải có người đang làm hành động đó trong ảnh)

## 20 động từ tả người (Language Building)
| # | Từ | Câu mẫu | Nghĩa / ghi chú |
|---|---|---|---|
| 1 | hold /həʊld/ | A woman is holding some containers. | cầm, nắm giữ; container: hộp đựng |
| 2 | point /pɔɪnt/ | One of the men is pointing at a document. | chỉ vào |
| 3 | reach /riːtʃ/ | A customer is reaching for some merchandise. | với tới; merchandise: hàng hóa |
| 4 | adjust /əˈdʒʌst/ | A band member is adjusting a microphone. | điều chỉnh |
| 5 | pass /pɑːs/ | A woman is passing a briefcase to a man. | đưa, chuyển; briefcase: cặp tài liệu |
| 6 | load /ləʊd/ | She is loading a box into a vehicle. | chất hàng; ngược lại unload: dỡ hàng |
| 7 | bend /bend/ | A woman is bending down to read a label. | cúi; label: nhãn mác |
| 8 | lean /liːn/ | He is leaning against the wall. = He's propped against the wall. | dựa, tựa |
| 9 | throw away /θrəʊ əˈweɪ/ | The woman is throwing something away. | vứt đi, bỏ đi |
| 10 | pack /pæk/ | Some men are packing their suitcases. | đóng gói, xếp đồ; suitcase: vali |
| 11 | fill /fɪl/ | She is filling up a cup. | đổ đầy |
| 12 | inspect /ɪnˈspekt/ | She's inspecting an item for sale. | kiểm tra, xem xét |
| 13 | trim /trɪm/ | Some workers are trimming the trees. | cắt tỉa |
| 14 | mow /məʊ/ | He's mowing the grass between the trees. | cắt cỏ (bằng máy) |
| 15 | perform /pəˈfɔːm/ | People are performing under a tent. | biểu diễn; tent: cái lều |
| 16 | shop /ʃɒp/ | Some people are shopping for food. | mua sắm |
| 17 | pour /pɔː/ | One of the women is pouring some water. | rót, đổ |
| 18 | face /feɪs/ | They are facing each other. | đối mặt, quay mặt về |
| 19 | copy /ˈkɒpi/ | A woman is copying some papers. | photo, sao chép |
| 20 | wear /weə/ | The men are wearing a tool belt. | mặc, đeo; tool belt: thắt lưng đồ nghề; helmet: mũ bảo hiểm |

**Ghi chú tay:** cụm *away* · take away: mang đi · pass away: qua đời · give away: tặng, cho không · go away: biến đi.
**Từ đồng nghĩa "hàng hóa":** item · goods · merchandise · purchase.

## Năm bước luyện Part 1 và Part 2 (giống nhau)
1. Nghe và chọn đáp án.
2. Check đáp án, đánh dấu câu sai.
3. Tra phiên âm, dịch nghĩa tất cả từ mới và đọc bản dịch.
4. **Nghe và nhắc lại một hơi:**
   - 4.1 Nhìn text, nghe rồi nhắc lại một hơi (cả tiếng Anh và tiếng Việt), không ngắt quãng. Câu dài thì chia 2 vế, mỗi vế đọc 10 lần một hơi, rồi ghép lại đọc 20 lần một hơi.
   - 4.2 **Không nhìn text**, nghe và nhắc lại một hơi, hiểu 100%. Đây là bước khó và lâu nhất nhưng giúp nghe hiểu bản chất, không phải bắt keyword rồi chọn bừa.
5. Quay video các câu khó, câu chưa chắc.
$md$, 'Trung bình 3 đề Actual ≥ 5/6.'),
('foundation-05', 'foundation', 5, 'Part 1: tranh chỉ người (2)', 1, 'theory', $md$## 20 động từ tả người (2)
| # | Từ | Câu mẫu | Nghĩa / ghi chú |
|---|---|---|---|
| 1 | place /pleɪs/ | He's placing a bottle on a counter. | đặt, để; counter: quầy |
| 2 | plug in /plʌɡ ɪn/ | A cord is being plugged in. | cắm điện; cord: dây điện |
| 3 | cross /krɒs/ | People are crossing the street. | băng qua |
| 4 | hang /hæŋ/ | They're hanging some clothes on a rack. | treo; rack: giá, kệ |
| 5 | fold /fəʊld/ | They're folding up a tent. | gấp; ngược lại unfold: mở ra |
| 6 | file /faɪl/ | The man is filing some documents. | sắp xếp hồ sơ; arrange: sắp xếp; organize: tổ chức |
| 7 | operate /ˈɒpəreɪt/ | He's operating some factory machinery. | vận hành |
| 8 | kneel /niːl/ | One of the men is kneeling on the ground. | quỳ gối |
| 9 | turn on /tɜːn ɒn/ | She is turning on a light. | bật; ngược lại turn off: tắt |
| 10 | store /stɔː/ | Some men are storing luggage above their seats. | cất giữ; luggage: hành lý |
| 11 | board /bɔːd/ | Passengers are boarding a bus. | lên (xe, tàu, máy bay); BOD = Board of Directors: ban giám đốc |
| 12 | relax /rɪˈlæks/ | Tourists are relaxing on the beach. | thư giãn |
| 13 | pick up /pɪk ʌp/ | He's picking up his briefcase. | cầm lên, nhặt lên; pick sb up: đón ai đó |
| 14 | push /pʊʃ/ | A woman is pushing a shopping cart. | đẩy; shopping cart: xe đẩy hàng |
| 15 | wipe /waɪp/ | A woman is wiping off a counter. | lau |
| 16 | lift /lɪft/ | A machine is lifting bags onto a shelf. | nâng; shelf: kệ |
| 17 | climb /klaɪm/ | They're climbing some steps. | leo, trèo; steps: bậc thang |
| 18 | exit /ˈeɡzɪt/ | People are exiting a theater. | rời khỏi; theater: nhà hát |
| 19 | put up /pʊt ʌp/ | The man is putting up a sign. | dựng lên, treo lên; sign: biển hiệu |
| 20 | take off /teɪk ɒf/ | He's taking off his hat. | cởi ra; ngược lại put on: mặc vào |

⚠️ **Bẫy hay gặp:** *wearing* (đang mặc, trạng thái) khác *putting on* (đang mặc vào, hành động). Ảnh người đã đội mũ sẵn thì chọn *wearing*, không chọn *putting on*.
$md$, null),
('foundation-06', 'foundation', 6, 'Part 2: tổng quan + câu hỏi Who', 2, 'theory', $md$## Tổng quan Part 2 (Hỏi – đáp)

| Mục | Nội dung |
|---|---|
| Số câu | 25 (câu 7–31) |
| Dạng | Nghe 1 câu hỏi và 3 đáp án, chọn câu phản hồi phù hợp nhất |
| Loại câu hỏi | Câu hỏi thông tin (Wh-), câu nghi vấn (Yes/No), câu lựa chọn, câu trần thuật, đề nghị, gợi ý |
| Câu trả lời | Cung cấp thông tin, hoặc phản hồi giao tiếp thường ngày; có thể **trực tiếp hoặc gián tiếp** |
| Lời khuyên | Đừng cố hiểu từng từ, hãy nắm nội dung chính và mục đích của câu hỏi và câu trả lời |
| Mục tiêu của sách | 12/25 |

Ví dụ: *Where does Mrs. Robertson live now?*
- A. Near the park. → trả lời trực tiếp ✅
- B. Right now, please. → trả lời cho câu When ❌
- C. Alex did. → trả lời cho câu Who ❌

**3 nhóm câu hỏi trong chương trình:**
1. 5W1H: Who, Where, When, What, Why, How (L6–L9)
2. Nghi vấn: Yes/No, lựa chọn, câu đuôi (L10)
3. Trần thuật (L11)

### Quy tắc chung cho mọi câu hỏi Wh- (rút ra từ L6–L9)
1. **Nghe ít nhất 4 từ đầu tiên**: từ để hỏi + từ đi kèm.
2. Câu hỏi Wh- **không trả lời bằng Yes/No** → loại ngay đáp án bắt đầu bằng Yes/No.
3. **Bẫy âm giống**: đáp án lặp lại từ hoặc âm giống câu hỏi thường là đáp án sai (retiring → tired, charge → charge, floor plan → floors, printer → print, order → order).
4. **Đáp án gián tiếp** thường đúng: "I'm not sure", "Let me check", "Ask the manager", "It hasn't been decided yet".

## Câu hỏi WHO

**Ví dụ (đáp án đúng in đậm):**
1. Who is retiring next month? → **B. I believe Careline is.** (A "tired" là bẫy âm của "retiring")
2. Who is in charge of designing the prototype? → **B. Our production department.** (A lặp từ "charge")
3. Who designed the floor plan? → **C. Mr. Bryson did.** (B lặp từ "floor")
4. Who should I tell if I want to leave early? → **A. Let your supervisor know.**

**Kiến thức cần nhớ:** nghe 4 từ đầu để xác định *ai làm việc gì*. Câu trả lời đúng thường là:
- Tên người (loại đáp án Yes/No)
- Chức vụ
- Chưa có ai, không ai làm, tôi tự làm
- Một nhóm người, một team, một công ty, một phòng ban
- Gợi ý hỏi ai, gặp ai, tìm ở đâu để biết thông tin

**Từ vựng chức vụ:** accountant (kế toán) · applicant (người nộp đơn) · candidate (ứng viên) · assistant (trợ lý) · coworker / colleague (đồng nghiệp) · director (giám đốc) · keynote speaker (diễn giả chính) · receptionist (lễ tân) · sales representative (nhân viên bán hàng) · spokesperson (người phát ngôn) · supervisor (người giám sát) · vice president (phó chủ tịch)

**Từ vựng phòng ban, tổ chức:** accounting department (phòng kế toán) · customer service department (phòng chăm sóc khách hàng) · finance department (phòng tài chính) · human resources / personnel department (phòng nhân sự) · maintenance department (phòng bảo trì) · marketing team (đội tiếp thị) · shipping department (phòng vận chuyển) · technical support team (đội hỗ trợ kỹ thuật) · headquarters (trụ sở chính) · main office (văn phòng chính) · branch (office) (chi nhánh) · catering company (công ty cung cấp đồ ăn uống)

**Ghi chú:** in charge of: chịu trách nhiệm · charge (n): phí · prototype: nguyên mẫu · floor plan: sơ đồ mặt bằng · affordable: giá phải chăng · appointment: cuộc hẹn · retire: nghỉ hưu.
$md$, null),
('foundation-07', 'foundation', 7, 'Part 2: Where + When', 2, 'theory', $md$## Câu hỏi WHERE + WHEN

**Ví dụ (đáp án đúng in đậm):**
1. When do you start work in the morning? → **B. At 8 o'clock.**
2. Where is the manager's office? → **A. Right across the hall.**
3. When does Mr. Cho want to pick up his cake? → **B. He said he'd be in around 3 o'clock.**
4. Where is the supermarket? → **C. Down the street from my office.**

### Câu hỏi WHERE
Nghe 4 từ đầu. Câu trả lời đúng thường là:
- Cụm chỉ địa điểm có giới từ in/on/at
- Có người khác sẽ giúp tìm thông tin
- Địa điểm chưa được quyết định (hasn't / haven't)
- Phải kiểm tra lại, tìm lại mới trả lời được

**Giới từ địa điểm:** in: quốc gia, thành phố, không gian 3 chiều · on: đường phố, bề mặt · at: địa điểm, địa chỉ cụ thể. Thêm: in front of >< behind · between A and B · near · next to / beside · above >< under · by.

**Cụm trả lời trực tiếp:** upstairs (trên tầng) · in a drawer (trong ngăn kéo) · in the file cabinet (trong tủ hồ sơ) · in the supply room (trong phòng kho) · in your mailbox (trong hộp thư) · near the entrance (gần lối vào) · on Fifth Avenue (trên đại lộ số 5) · on the second floor · right across the hall (ngay bên kia hành lang) · right next to the park · the shop next door · to the right of the elevator (bên phải thang máy) · in Coriboo Park · in Milan

**Cụm trả lời gián tiếp:** It's only available online. (chỉ có trên mạng) · Jason had it yesterday. · Our supervisor should know. · Go to the personnel department. · I'm going there now. · Try the security office. (thử hỏi phòng an ninh) · Check this brochure. (xem tờ quảng cáo này) · Leave them on my desk. (left: để lại, bỏ lại)

### Câu hỏi WHEN
Nghe từ để hỏi + từ chỉ thời gian. Câu trả lời đúng thường là:
- Cụm thời gian có ngày tháng, khoảng thời gian trong tương lai gần
- Cụm có giới từ chỉ thời gian
- Sự việc không còn diễn ra: discontinued, canceled, delayed, called off
- Câu hỏi ngược lại, thể hiện bất ngờ hoặc muốn làm rõ trước khi trả lời

**Giới từ thời gian:** on: ngày, thứ · in: năm, mùa, tháng, khoảng thời gian · at: giờ giấc.

⚠️ **Phân biệt thì:** *When did…?* (quá khứ) → trả lời "yesterday, last week, two days ago" · *When will…?* (tương lai) → "tomorrow, next week, in two days".

_(Trang từ vựng II.2 WHEN chưa chụp.)_
$md$, null),
('foundation-08', 'foundation', 8, 'Part 2: What / Which', 2, 'theory', $md$## Câu hỏi WHAT / WHICH

**Ví dụ (đáp án đúng in đậm):**
1. What time does the train arrive? → **A. It should be here soon.** (gián tiếp)
2. What is the topic of today's seminar? → **B. I am not sure.** (gián tiếp)
3. Which orders still need to be processed? → **C. Those over there.** (A lặp từ "order")
4. Which printer should we order? → **A. Let's get the latest model.** (B lặp âm "print")

**Kiến thức cần nhớ:** nghe 4 từ đầu, tìm **danh từ hoặc động từ đi kèm** What/Which.
- Danh từ đi kèm quyết định câu trả lời: What **time** → giờ · What **cost** → giá · What **type** → loại · Which **restaurant** → nhà hàng
- Động từ đi kèm quyết định câu trả lời: What do you **think** → ý kiến

**Cụm hay gặp:** What time · What date · What floor (tầng nào) · What kind / type (loại nào) · Which department (phòng nào) · Which restaurant · Which caterer (bên phục vụ ăn uống nào) · Which food supplier (nhà cung cấp thực phẩm nào) · Which menu item · What's the price / cost of A? · What was the topic of A? (chủ đề) · What's the best way to…? · What is A like? · What should I do with A? · What did he…? · What happened at A? · What should I include in A? · What do you think of / about A?

**Ghi chú:** hasn't been finalized: chưa hoàn thiện, chưa chốt · luncheon: bữa trưa (trang trọng).
$md$, null),
('foundation-09', 'foundation', 9, 'Part 2: Why + How', 2, 'theory', $md$## Câu hỏi WHY + HOW

**Ví dụ (đáp án đúng in đậm):**
1. How can we increase our sales? → **B. Let's ask the marketing department.**
2. How many employees do you have? → **A. About five hundred.**
3. Why is there an extra chair in your office? → **B. We needed it for a meeting.**
4. Why don't we meet at the front entrance? → **A. That's a good idea.** (Why don't we = gợi ý → đồng ý/từ chối)

### Câu hỏi WHY
| Câu hỏi | Câu trả lời đúng |
|---|---|
| Why + động từ chính | because + lý do |
| Why + V-ed (bị động, quá khứ) | to V: mục đích |
| **Why don't you/we…?** = lời gợi ý | Đang kiểm tra, cân nhắc… để giải thích |
| | Cảm thán đồng ý hoặc từ chối (That's a good idea / Sounds great / Sorry, I can't) |
| | Câu có "not" để giải thích lý do: haven't, didn't, couldn't, wasn't… |

**Cụm lý do:** due to a scheduling conflict (do trùng lịch) · because of the bad weather · because I got stuck in traffic (tắc đường) · the budget's not big enough (ngân sách không đủ) · to discuss A · for some renovations (để cải tạo) · so (that) they can meet the deadline
**Cụm gián tiếp:** We're looking into that. (xem xét) · We're investigating it. (điều tra) · We're still deciding. (quyết định) · It's under review. (đang xem xét) · I had a meeting with a client. · I was out on holiday. · He was on vacation. · He left early. · He's out of the office.

### Câu hỏi HOW
| Câu hỏi | Câu trả lời đúng |
|---|---|
| How + adv / adj (How many, How long…) | Dựa vào adv/adj đi kèm |
| How + V: cách làm việc gì | Dựa vào động từ đi kèm |
| How + V: cảm nhận về điều gì | Dùng adj diễn tả cảm nhận |
| How about + V-ing: gợi ý | Đồng ý / từ chối |

**Cặp hỏi – đáp:** How many – around twenty / a few · How much – twenty euros each (giá tiền) · How often – a few times a day (tần suất) · How long – a few more days (bao lâu) · How soon – in about an hour (= when, bao lâu nữa) · How far – about a mile (khoảng cách; mile ≈ 1,6 km)
**Câu mẫu:** How will we get to A from B? – We'll take a taxi. · How can we improve A? – By advertising online. · How did you like A? – I had a great time. · How is A going? – I'm almost finished with it. (A đến đâu rồi)
$md$, null),
('foundation-10', 'foundation', 10, 'Part 2: Yes/No, lựa chọn, câu đuôi', 2, 'theory', $md$## Câu hỏi NGHI VẤN (Yes/No, lựa chọn, câu đuôi)

**Ví dụ (đáp án đúng in đậm):**
1. Are you interested in books? → **A. Not really. I prefer music.** (B "booked" bẫy âm "books"; C "interesting" bẫy âm "interested")
2. Did you give him the letter? → **B. Sorry, I forgot.** (C lặp từ "letter")
3. You're on holiday next month, aren't you? → **B. Actually, it's next week.** (sửa lại thông tin; A sai thì: "just got back" là quá khứ)
4. Can I offer you coffee or tea? → **C. I'd like some tea, please.** (câu lựa chọn → chọn một trong hai)

**Kiến thức cần nhớ:** nghe **động từ hoặc danh từ chính**, thường nằm ở **giữa và cuối câu** (khác câu Wh- là nghe 4 từ đầu). Câu trả lời đúng thường là:
- Yes/No để xác nhận, kèm thêm một vế mở rộng
- Từ cảm thán đồng ý hoặc từ chối: Sorry, Thanks, Great, I'll be happy to…
- Trả lời xác nhận trực tiếp vào thông tin chính trong câu hỏi

⚠️ **Câu lựa chọn A or B:** đáp án đúng thường chọn A, chọn B, chọn cả hai (both), không chọn cái nào (neither), hoặc "I don't mind / Either is fine". **Không** trả lời Yes/No.

### Dạng nghi vấn thông thường
| Câu hỏi | Câu trả lời mẫu |
|---|---|
| Do you want [need] to do A? | Yes, that'd be great. (có thì tốt quá) |
| Do you want me to do A? | Yes, I'd appreciate that. (cảm ơn, tôi rất trân trọng) |
| Do you have A? | How many do you need? |
| Did you buy [get] A? | Yes, last week. |
| Have you finished A? | I did that this morning. |
| Have you seen A yet? | No, I'm going to see it tomorrow. |
| Are you available for A? | Yes, I'd be happy to. |
| Is there A in the store? | You can follow me. |

**Đồng ý:** Sure. / Okay. / All right. / I think so.
**Phủ định:** Not yet. / Not really. / Unfortunately.

### Câu hỏi đuôi (Tag question)
Câu hỏi đuôi trả lời **giống câu Yes/No thường**, bỏ qua phần đuôi (doesn't it, right, isn't she…) và chỉ xét nội dung chính.

| Câu hỏi | Câu trả lời mẫu |
|---|---|
| The bank opens at 9, doesn't it? | I'm sure it does. |
| Tim is leading the training, right? | Yes, that's what I heard. |
| I can leave my bag here, can't I? | Of course you can. |
| You finished the report, didn't you? | No, I'll do it tonight. |
| You've sent the invoice, haven't you? | No, not yet. / No, John did. |
| Ms. Shin is in the office, isn't she? | No, she's on vacation. |
| This is the last interview, isn't it? | No, there's one more. |
| There are folders in the supply room, right? | No, I used the last one. |
$md$, null),
('foundation-11', 'foundation', 11, 'Part 2: câu trần thuật', 2, 'theory', $md$## Câu TRẦN THUẬT

**Ví dụ (đáp án đúng in đậm):**
1. I've finished the review you asked for. → **B. That was quick!** (cảm thán)
2. This room seems really warm. → **C. I'll turn on a fan.** (đưa giải pháp; A "seamless" bẫy âm "seems", B "real" bẫy âm "really")
3. I don't see your car parked outside this morning. → **A. John gave me a ride today.** (giải thích lý do; B "park" bẫy âm "parked")
4. I'll be returning Ron Stover's call. → **C. He's not in, but may I take a message?**

**Kiến thức cần nhớ:** câu trần thuật là dạng **khó nhất** của Part 2 vì không có từ để hỏi. Dựa vào **4 từ đầu** để đoán ý ngầm của người nói:
| Ý ngầm của câu | Câu trả lời đúng |
|---|---|
| **Thông báo một nội dung mới** | Xác nhận theo ý ngầm đó bằng cụm cảm thán đồng ý, hoặc nêu cảm nhận cá nhân |
| **Tìm kiếm sự đồng tình** | Đồng ý / không đồng ý (It really is. / I agree with you.) |
| **Yêu cầu, đề nghị một việc** | Đưa giải pháp, hoặc câu hỏi ngược lại thể hiện bất ngờ |

**Câu mẫu:**
| Câu trần thuật | Câu trả lời mẫu |
|---|---|
| I can't open the file. | Sorry, I'll try sending it again. |
| The copier is broken. | Call the technician. (gọi cho kỹ thuật viên) |
| I'm afraid I won't join you. | I'm sorry to hear that. (tôi e rằng tôi không thể tham gia) |
| I'm having trouble doing A. | I can help you with that. |
| We're out of flyers. (hết tờ rơi) | There's a printer in my office. (in thêm) |
| We need to buy a new blender. (máy xay) | That's a good idea. |
| We should call off the meeting. (hủy = cancel) | I agree with you. |
| We're going out for dinner tonight. | That sounds nice. |
| The deadline is on Monday. | Where did you hear that? (câu hỏi ngược) |
| Our online business is growing faster this year. | It really is. |
| Our sales are low. | I'll look at the results again. |
$md$, null),
('foundation-12', 'foundation', 12, 'Final Test Part 1 + 2', null, 'practice', $md$Sách là đề tổng hợp → làm các bài BTVN bên dưới. Kiểm tra đầu ra: Part 1 + Part 2 của một đề ETS mới.
$md$, 'Part 1 ≥ 5/6 · Part 2 ≥ 18/25 trên đề ETS.'),
('beginner-01', 'beginner', 1, 'Part 1: luyện đề tổng hợp', 1, 'practice', $md$## Mở đầu sách

**Cấu trúc đề TOEIC L&R:** LC 45 phút, 100 câu (P1: 6, P2: 25, P3: 39, P4: 30). RC 75 phút, 100 câu (P5: 30, P6: 16, P7: 29 câu đoạn đơn + 25 câu đoạn đôi/ba). Tổng 200 câu, 120 phút, 990 điểm.

**11 chủ đề thường gặp:**
| Chủ đề | Nội dung |
|---|---|
| Corporate Development | Research, product development |
| Dining Out | Business and informal lunches, banquets, receptions |
| Entertainment | Cinema, theater, music, art, exhibition, museum, media |
| Finance and Budgeting | Banking, investment, tax, accounting |
| General Business | Contract, negotiation, merger, marketing, sales, warranties, business planning, conferences, labor relation |
| Health | Medical insurance, visiting a doctor/dentist/clinic |
| Housing / Corporate Property | Construction, specification, buying and renting, electric and gas services |
| Office | Board/committee meeting, letters, telephone calls, faxes, emails, office equipment |
| Personnel | Recruiting, hiring, retiring, salary, promotion, job application |
| Purchasing | Shopping, ordering, supplying, shipping, invoice |
| Travel | Train, airplane, taxi, ferry, car rental |

**5 bước Automatic Listening (học từ vựng kết hợp nghe hiểu):**
1. Nghe và chọn đáp án.
2. Đối chiếu với transcript: đánh dấu từ mới, từ không biết cách phát âm, chép lại những chỗ chưa nghe ra.
3. Tra phiên âm, dịch nghĩa, luyện đọc từ mới.
4. Nghe và nhắc lại theo audio, đúng ngữ âm, ngữ điệu, tốc độ.
5. Quay video: nghe, nhắc lại và dịch lại mà không nhìn transcript.
$md$, null),
('beginner-02', 'beginner', 2, 'Part 2: Who + Where + When', 2, 'practice', $md$Lý thuyết Part 2 đã học kỹ ở **Foundation L6–L11** — ở đây chỉ đọc lướt, làm bài web để luyện thêm.
$md$, null),
('beginner-03', 'beginner', 3, 'Part 2: What/Which + Why + How', 2, 'practice', $md$Lý thuyết Part 2 đã học kỹ ở **Foundation L6–L11** — ở đây chỉ đọc lướt, làm bài web để luyện thêm.
$md$, null),
('beginner-04', 'beginner', 4, 'Part 2: câu nghi vấn Yes/No', 2, 'practice', $md$Lý thuyết Part 2 đã học kỹ ở **Foundation L6–L11** — ở đây chỉ đọc lướt, làm bài web để luyện thêm.
$md$, null),
('beginner-05', 'beginner', 5, 'Part 2: câu đuôi, trần thuật', 2, 'practice', $md$Lý thuyết Part 2 đã học kỹ ở **Foundation L6–L11** — ở đây chỉ đọc lướt, làm bài web để luyện thêm.
$md$, null),
('beginner-06', 'beginner', 6, 'Luyện đề tổng hợp Part 1 + 2', null, 'practice', null, null),
('beginner-07', 'beginner', 7, 'Part 2 Middle Test + mở đầu Part 3', 3, 'theory', $md$## Part 3: Hội thoại

### Giới thiệu Part 3
| Mục | Nội dung |
|---|---|
| Số câu | 39 (câu 32–70), 13 đoạn hội thoại × 3 câu hỏi |
| Dạng câu hỏi | Giống Part 4: **(1) Ý chính** · **(2) Chi tiết** (ngày, giờ, địa điểm, tên) · **(3) Suy luận** · **(4) Chức năng/mục đích câu nói** · **(5) Biểu đồ, lịch trình** |
| Nội dung | Công việc (lịch họp, dự án, khách hàng) · Cuộc sống hằng ngày (đặt chỗ nhà hàng, mua vé, gọi dịch vụ) · Vấn đề cần giải quyết (trục trặc kỹ thuật, phàn nàn, thay đổi lịch trình) · Biểu đồ (lịch họp, hóa đơn, danh sách công việc) |
| Lời khuyên | Hiểu 100% nội dung đoạn, luyện nghe nhắc lại từng câu tới mức thuộc lòng từng đoạn đã học |
| Mục tiêu của sách | 20/39 |

**Ghi chú tay của Đạt:**
- **Quy tắc 4P** để nắm nội dung một đoạn hội thoại: **People** (ai nói, quan hệ gì) · **Place** (ở đâu) · **Problem** (vấn đề gì) · **Plan** (sẽ làm gì tiếp theo, thường là câu hỏi cuối).
- Cấu trúc nhờ vả hay gặp: **have sb do sth** (nhờ ai làm gì) → *I had John wash my car.* · **have sth done (by sb)** (để việc gì được làm) → *I have my car washed.*

### Sáu bước học thuộc lòng một đoạn hội thoại Part 3
1. **Dịch câu hỏi và các đáp án** để biết hết, hiểu hết trước khi nghe.
2. Nghe và chọn đáp án.
3. Tra phiên âm từ mới, chỗ nào có nối âm thì ghi lại.
4. Dịch để **hiểu hết nội dung** cả đoạn (có bản dịch sẵn thì chỉ cần đọc lại).
5. **Học thuộc lòng:**
   - 5.1 Nhìn text, nghe và đọc lại từng câu trôi chảy, **20 lần mỗi câu**, tới khi thuộc và hiểu không cần nhìn text → thuộc từng lời thoại → thuộc cả đoạn.
   - 5.2 Nghe lại một lần **không nhìn text** để chắc đã hiểu 100%. Chưa hiểu hết thì quay lại bước 3, 4, 5.1.
6. **Quay video** đọc thuộc lòng cả đoạn bằng tiếng Anh, không bật audio.

**Bí mật của sách:**
- 10 đoạn đầu học rất lâu, có khi mất 1 tiếng mới thuộc một đoạn. Sau 10 đoạn chỉ còn 20–30 phút mỗi đoạn.
- Mục tiêu 450–500: học thuộc **30 đoạn**. Mục tiêu 600: **40 đoạn**.
- 700–800+: cần chiến thuật khác, học ở sách Submarine.

**Khác nhau giữa Part 3 và Part 4 trong phương pháp của sách:** Part 3 phải **học thuộc lòng** cả đoạn, quay video không bật audio. Part 4 chỉ cần **nghe nhắc lại và dịch từng câu**, không cần thuộc lòng.

_(Chưa chụp: lý thuyết riêng của L7–L9, nếu có.)_
$md$, 'Học thuộc 30 đoạn hội thoại Part 3 (mục tiêu 450–500).'),
('beginner-08', 'beginner', 8, 'Part 3: thực hành (1)', 3, 'practice', $md$Áp dụng 6 bước học thuộc lòng Part 3 ở Lesson 7.
$md$, null),
('beginner-09', 'beginner', 9, 'Part 3: thực hành (2)', 3, 'practice', $md$Áp dụng 6 bước học thuộc lòng Part 3 ở Lesson 7.
$md$, null),
('beginner-10', 'beginner', 10, 'Part 4: giới thiệu + thực hành (1)', 4, 'theory', $md$## Part 4: Độc thoại

### Giới thiệu Part 4
| Mục | Nội dung |
|---|---|
| Số câu | 30 (câu 71–100), 10 bài nói × 3 câu hỏi |
| Dạng câu hỏi | **Dạng 1, Ý chính (Main Idea):** mục đích chính của bài nói |
| | **Dạng 2, Chi tiết (Details):** ngày, giờ, địa điểm, tên |
| | **Dạng 3, Suy luận (Inference):** thông tin gián tiếp, phải suy ra từ những gì nghe được |
| | **Dạng 4, Chức năng (Function/Purpose):** lý do người nói nói một câu cụ thể ("Why does the speaker say…?") |
| | **Dạng 5, Hình ảnh (Chart/Graph):** nối thông tin bài nói với biểu đồ hoặc lịch trình đi kèm |
| Nội dung | Công việc (lịch họp, dự án, khách hàng) · Cuộc sống hằng ngày (đặt chỗ nhà hàng, mua vé, gọi dịch vụ) · Vấn đề cần giải quyết (trục trặc kỹ thuật, phàn nàn, thay đổi lịch trình) · Biểu đồ (lịch họp, hóa đơn, danh sách công việc) |
| Lời khuyên | Hiểu 100% nội dung bài, luyện nghe nhắc lại từng câu tới mức thuộc lòng từng đoạn đã học |
| Mục tiêu của sách | 15/30 |

**Mẹo làm bài (Claude bổ sung, sách chưa ghi ở trang này):**
- **Đọc trước 3 câu hỏi** trong lúc audio đọc hướng dẫn, gạch keyword.
- Câu hỏi thường đi **theo thứ tự thông tin** trong bài: câu 1 nằm ở đầu bài, câu 3 nằm ở cuối.
- Câu ý chính, mục đích → nghe kỹ **1–2 câu đầu** bài nói.
- Câu "What will the listeners do next?" → nghe **câu cuối**.
- Câu biểu đồ → nhìn biểu đồ trước, đáp án thường **không được nói thẳng** mà phải nối từ thông tin nghe với biểu đồ.

### Sáu bước luyện Part 4 tại nhà
1. **Dịch câu hỏi và các đáp án** để đảm bảo biết hết, hiểu hết trước khi nghe.
2. Nghe và chọn đáp án.
3. Tra phiên âm từ mới, chỗ nào có nối âm thì ghi lại.
4. Dịch để **hiểu hết nội dung** cả bài (có bản dịch sẵn thì chỉ cần đọc lại).
5. **Nghe nhắc lại:**
   - 5.1 Nhìn text, nghe và đọc lại từng câu trôi chảy, **20 lần mỗi câu**, tới khi thuộc và hiểu mà không cần nhìn text. Làm lần lượt từng câu đến hết bài.
   - 5.2 Nghe lại một lần **không nhìn text** để chắc đã hiểu 100%. Chưa hiểu hết thì quay lại bước 3, 4, 5.1.
6. **Quay video:** nghe, nhắc lại và dịch từng câu cả tiếng Anh và tiếng Việt. Không cần học thuộc lòng như Part 3.

**Bí mật của sách:** muốn đạt 450–500 TOEIC cần quay video nghe nhắc lại và dịch **ít nhất 20 đoạn** Part 4.
$md$, 'Quay video nghe nhắc lại + dịch ít nhất 20 đoạn Part 4.'),
('beginner-11', 'beginner', 11, 'Part 4: thực hành (2)', 4, 'practice', $md$Áp dụng 6 bước luyện Part 4 ở Lesson 10.
$md$, null),
('beginner-12', 'beginner', 12, 'Demo Test', null, 'practice', $md$Không có trên web → làm một đề ETS LC thay thế.
$md$, 'Part 3 ≥ 28/39 · Part 4 ≥ 18/30 trên đề ETS.'),
('beginner-13', 'beginner', 13, 'Final Test', null, 'practice', $md$Không có trên web → bỏ qua.
$md$, null),
('campbomb-lc-01', 'campbomb-lc', 1, 'Part 1&2 (1): luyện đề', null, 'practice', $md$Sách Camp Bomb Nghe toàn là đề → làm trực tiếp trên Zenlish, chữa theo 5 bước Part 1–2 (Foundation) hoặc 6 bước Part 3/Part 4 (Beginner).

> ⚠️ Bài này thực chất là **ETS 2020 Test 1** — nếu đã làm thì bỏ qua.
$md$, null),
('campbomb-lc-02', 'campbomb-lc', 2, 'Part 1&2 (2): luyện đề', null, 'practice', $md$Sách Camp Bomb Nghe toàn là đề → làm trực tiếp trên Zenlish, chữa theo 5 bước Part 1–2 (Foundation) hoặc 6 bước Part 3/Part 4 (Beginner).
$md$, null),
('campbomb-lc-03', 'campbomb-lc', 3, 'Part 3 (1): luyện đề', 3, 'practice', $md$Sách Camp Bomb Nghe toàn là đề → làm trực tiếp trên Zenlish, chữa theo 5 bước Part 1–2 (Foundation) hoặc 6 bước Part 3/Part 4 (Beginner).
$md$, null),
('campbomb-lc-04', 'campbomb-lc', 4, 'Part 3 (2): luyện đề', 3, 'practice', $md$Sách Camp Bomb Nghe toàn là đề → làm trực tiếp trên Zenlish, chữa theo 5 bước Part 1–2 (Foundation) hoặc 6 bước Part 3/Part 4 (Beginner).
$md$, null),
('campbomb-lc-05', 'campbomb-lc', 5, 'Part 3 (3): luyện đề', 3, 'practice', $md$Sách Camp Bomb Nghe toàn là đề → làm trực tiếp trên Zenlish, chữa theo 5 bước Part 1–2 (Foundation) hoặc 6 bước Part 3/Part 4 (Beginner).
$md$, null),
('campbomb-lc-06', 'campbomb-lc', 6, 'Part 4 (1): luyện đề', 4, 'practice', $md$Sách Camp Bomb Nghe toàn là đề → làm trực tiếp trên Zenlish, chữa theo 5 bước Part 1–2 (Foundation) hoặc 6 bước Part 3/Part 4 (Beginner).
$md$, null),
('campbomb-lc-07', 'campbomb-lc', 7, 'Part 4 (2): luyện đề', 4, 'practice', $md$Sách Camp Bomb Nghe toàn là đề → làm trực tiếp trên Zenlish, chữa theo 5 bước Part 1–2 (Foundation) hoặc 6 bước Part 3/Part 4 (Beginner).
$md$, null),
('campbomb-lc-08', 'campbomb-lc', 8, 'Luyện đề tổng hợp', null, 'practice', $md$Sách Camp Bomb Nghe toàn là đề → làm trực tiếp trên Zenlish, chữa theo 5 bước Part 1–2 (Foundation) hoặc 6 bước Part 3/Part 4 (Beginner).
$md$, null),
('submarine-lc-01', 'submarine-lc', 1, 'Part 1&2 (1): luyện đề', 1, 'practice', $md$Sách Submarine Nghe toàn là đề → làm trực tiếp trên Zenlish.
$md$, null),
('submarine-lc-02', 'submarine-lc', 2, 'Part 1&2 (2): luyện đề', 1, 'practice', $md$Sách Submarine Nghe toàn là đề → làm trực tiếp trên Zenlish.
$md$, null),
('submarine-lc-03', 'submarine-lc', 3, 'Part 3 (1): luyện đề', 3, 'practice', $md$Sách Submarine Nghe toàn là đề → làm trực tiếp trên Zenlish.
$md$, null),
('submarine-lc-04', 'submarine-lc', 4, 'Part 3 (2): luyện đề', 3, 'practice', $md$Sách Submarine Nghe toàn là đề → làm trực tiếp trên Zenlish.
$md$, null),
('submarine-lc-05', 'submarine-lc', 5, 'Part 3 (3): luyện đề', 3, 'practice', $md$Sách Submarine Nghe toàn là đề → làm trực tiếp trên Zenlish.
$md$, null),
('submarine-lc-06', 'submarine-lc', 6, 'Part 4 (1): luyện đề', 4, 'practice', $md$Sách Submarine Nghe toàn là đề → làm trực tiếp trên Zenlish.
$md$, null),
('submarine-lc-07', 'submarine-lc', 7, 'Part 4 (2): luyện đề', 4, 'practice', $md$Sách Submarine Nghe toàn là đề → làm trực tiếp trên Zenlish.
$md$, null),
('submarine-lc-08', 'submarine-lc', 8, 'Part 4 (3): luyện đề', 4, 'practice', $md$Sách Submarine Nghe toàn là đề → làm trực tiếp trên Zenlish.
$md$, null),
('campbomb-rc-01', 'campbomb-rc', 1, 'Part 5: Từ loại & cấu trúc câu', 5, 'theory', $md$## Giới thiệu Part 5 (sách Camp Bomb Reading)

| Mục | Nội dung |
|---|---|
| Số câu | 30 (câu 101–130) |
| Nội dung đáp án | Từ loại, giới từ, liên từ, ngữ pháp, từ vựng |
| Lời khuyên | Đề tập trung chủ yếu kiểm tra **ngữ pháp và từ vựng** · Xây nền ngữ pháp trước, bổ trợ từ mới sau · Nắm chắc **vị trí và chức năng của các từ loại** cơ bản · Luyện phân tích thành phần câu · Học từ mới **theo cụm** · Phân bổ thời gian: **không quá 30 giây/câu** |
| Mục tiêu của sách | 18/30 |

## Ba bước luyện Part 5 (khung chung cho mọi dạng)
1. **Làm bài:** chia câu thành cụm **S, V, O, C, M** (M = bổ ngữ/trạng ngữ), khoanh tròn **động từ chính** → phân tích → chọn → mở đáp án, đếm số câu đúng, ghi vào sheet theo dõi.
2. **Chữa bài:** dịch nghĩa từ mới trong câu hỏi + xác định 4 đáp án thuộc loại gì (từ loại / thì / đại từ quan hệ…).
3. **Dịch nghĩa:** quay video dịch toàn bộ các câu vừa chữa (chỉ tới đâu dịch tới đó).

## Từ loại & Cấu trúc câu

**8 từ loại**
| Từ loại | Phân loại | Ví dụ |
|---|---|---|
| Danh từ | đếm được / không đếm được | price, discount, refund, permit, result · **không đếm được:** information, equipment, access, baggage/luggage, machinery, staff |
| Đại từ | nhân xưng · bất định · chỉ định · nghi vấn · quan hệ | I/you · any, some, none, somebody, each, most · this/that · who/what · who/whom/whose/which/that |
| Động từ | nội động từ (không tân ngữ) · ngoại động từ (có tân ngữ) | The sun **rises** in the East. · People can **see** the sun. |
| Tính từ | bổ nghĩa trực tiếp cho danh từ · bổ nghĩa cho chủ ngữ | a **kind** teacher · My teacher is **kind**. |
| Trạng từ | bổ nghĩa cho động từ / tính từ / trạng từ khác / cụm từ / cả mệnh đề | **really** loves · **very** beautiful · **very** well · **right** after class · **Finally**, she has mastered English |
| Giới từ | đứng trước danh từ, đại từ, V-ing; đi kèm động từ thành cụm cố định | **in** the theater · **before** going · put **off** |
| Liên từ | đẳng lập (for, and, nor, but, or, yet, so) · tương hỗ (not only…but also, both…and) · phụ thuộc (though, because, while, until, if, whether) | |
| Hạn định từ | mạo từ (a/an/the) · tính từ sở hữu (my, your…) · từ định lượng (each, every, some, most) | |

**Cụm từ và mệnh đề**
- **Cụm từ:** từ 2 từ trở lên, **không** có quan hệ chủ ngữ – động từ.
- **Mệnh đề:** từ 2 từ trở lên, **có** chủ ngữ – động từ.
- Cả hai đều có thể làm chức năng danh từ / tính từ / trạng từ: *to drink a cup of coffee* (cụm DT) · *that she wants…* (mệnh đề DT) · *from the café* (cụm TT) · *that he made for her* (mệnh đề TT) · *on the sofa* (cụm trạng) · *while she listens to music* (mệnh đề trạng).

**5 cấu trúc câu cơ bản**
| Loại động từ | Cấu trúc | Ví dụ | Động từ thường gặp |
|---|---|---|---|
| Nội động từ | S + V | He runs very fast. | arrive, come, go, rise, sit, sleep, walk, work |
| Nội động từ (linking) | S + V + C | He looks happy. | be, become, remain, stay, seem, taste, smell, feel, look, sound |
| Ngoại động từ | S + V + O | He learns English. | do, draw, put, raise, read, stay, study, wash |
| Ngoại động từ | S + V + O + O | He gave me a book. | offer, buy, give, make, show, teach, send, ask |
| Ngoại động từ | S + V + O + C | He considered the idea interesting. | make, call, keep, consider, find |

> RC 1 không có trên web → luyện thêm bằng các file "Part 5" (đề Cô Mai Phương) trong Project.
$md$, null),
('campbomb-rc-02', 'campbomb-rc', 2, 'Part 5: Động từ', 5, 'theory', $md$## Động từ

**3 dạng câu hỏi chia động từ trong Part 5**
1. **Chia thì:** *Last week, three staff members ___ …* → dấu hiệu "last week" → **volunteered**.
2. **Hòa hợp S – V:** *The sales associates often ___ …* → chủ ngữ số nhiều → **discuss**.
3. **Chủ động / bị động:** *A special sale on stationery ___ on the site yesterday.* → không có tân ngữ sau chỗ trống → **was announced**.

**Phân loại động từ:** động từ thường (V, Vpast, PII, V-ing) · trợ động từ (be, do, have) · modal (can, could, may, might, will, should, have to, ought to + V nguyên mẫu) · linking verb (be, become, get, grow, appear, seem, feel, look).

**Bảng 9 thì hay gặp trong TOEIC**
| | Quá khứ | Hiện tại | Tương lai |
|---|---|---|---|
| Đơn (to be) | was/were | am/is/are | will be |
| Đơn (V thường) | Ved/cột 2 | V/Vs,es | will V |
| Tiếp diễn (be + Ving) | was/were + Ving | am/is/are + Ving | will be + Ving |
| Hoàn thành (have + PII) | had PII | has/have PII | will have PII |

**Dấu hiệu nhận biết**
- Hiện tại đơn: always, currently, generally, often, regularly, usually, every day/year
- Quá khứ đơn: ago, once, previously, recently, then, yesterday
- Tương lai đơn: shortly, soon, tomorrow, next month · tương lai gần: be going to V (kế hoạch có trước)
- Hiện tại hoàn thành: for, since, over the last…, never, ever, before, just, already, yet
- Quá khứ hoàn thành: hành động xảy ra **trước** một hành động/thời điểm khác trong quá khứ (*had already taken off before she arrived*)
- Tương lai hoàn thành: xong trước một mốc tương lai (*by next year*)
- Hoàn thành tiếp diễn (have been / had been / will have been + Ving): kéo dài liên tục tới một mốc.

**Hòa hợp về thì**
| Ngữ cảnh | Mệnh đề chính | Mệnh đề phụ / thời gian | Ví dụ |
|---|---|---|---|
| Hành động ở hiện tại | HTĐ | HTĐ | He works while she studies. |
| Song song trong quá khứ | QKĐ | QKĐ | They played while we watched. |
| Xảy ra trước trong quá khứ | QKHT | QKĐ | He had left before I arrived. |
| Liên tiếp | QKĐ | QKĐ | She finished and then went home. |
| Trước – sau rõ ràng | HTHT | HTĐ / HTTD | I have finished my work, so I am relaxing now. |
| **Hành động ở tương lai** | TLĐ | **HTĐ** (không dùng will sau when/if/before/after/until) | I will call you when I **arrive**. |
| Điều kiện loại 1 | If + HTĐ | will V | If it rains, we will cancel the trip. |
| Điều kiện loại 2 | If + QKĐ | would V | If I were rich, I would travel the world. |
| Điều kiện loại 3 | If + QKHT | would have V3 | If he had studied, he would have passed. |

**Hòa hợp chủ ngữ – động từ**
| Trường hợp | Chia động từ |
|---|---|
| Danh từ số ít, danh từ không đếm được, he/she/it, someone, anybody | số ít (thêm -s/-es) |
| Danh từ số nhiều, they/we, many, both, several | số nhiều |
| Danh từ tập thể (team, staff, family, police) | cả nhóm → số ít · từng thành viên → số nhiều |
| Đại từ bất định (everyone, someone, nothing, each, either, neither) | luôn số ít |
| Either…or / Neither…nor | chia theo **chủ ngữ gần nhất** (*Either the manager or the employees **are**…*) |

**Câu bị động:** S + V + O → **O + be + V3/ed (+ by S)**
| Thì | Bị động |
|---|---|
| HTĐ / QKĐ / TLĐ | am/is/are V3 · was/were V3 · will be V3 |
| Tiếp diễn | is being V3 · was being V3 · will be being V3 |
| Hoàn thành | has been V3 · had been V3 · will have been V3 |
| Modal (ghi chú tay) | modal + be + V3 (*should be checked*) |

**3 bước làm dạng chia động từ chính**
- Xác định dấu hiệu thì (yesterday, already, currently, by next year…).
- Chủ động hay bị động: **sau chỗ trống có tân ngữ → chủ động; không có tân ngữ → bị động (be + V3)**.
- Hòa hợp S–V: chủ ngữ số ít → V-s/es (hiện tại đơn); số nhiều → V nguyên; danh từ không đếm được → số ít.
- Ví dụ: *A special sale on stationery / ___ / on the site / yesterday.* → "yesterday" loại D (hiện tại) · sau trống là "on", không tân ngữ → bị động, loại B · chủ ngữ số ít → loại C → **A. was announced**.

> Quy tắc ghép: bài web **RC k** = Lesson k trong sách (đã đối chiếu câu hỏi RC 2 = L2).
$md$, null),
('campbomb-rc-03', 'campbomb-rc', 3, 'Part 5: Danh từ, Đại từ', 5, 'theory', $md$## Danh từ, Đại từ

**A. Danh từ**
- **Đuôi danh từ:** chỉ người/nghề: -ist, -er, -or, -ant (artist, editor, assistant, consultant) · từ động từ: -tion, -sion (attention, competition, division, inspection, application, decision) · từ tính từ: -ness, -ity, -ty (kindness, lateness, clarity, security, capacity, loyalty).
- **Danh từ đặc biệt (trông như tính từ):** -ive: executive, incentive, native, relative, representative, perspective · -al: arrival, dismissal, physical, proposal, potential, approval · -ant/-ent: accountant, applicant, patient, resident.
- **Phân biệt danh từ người / vật:** apply → applicant / application · consult → consultant / consultation · instruct → instructor / instruction · participate → participant / participation · assist → assistant / assistance · employ → employer, employee / employment · invest → investor / investment · supervise → supervisor / supervision.
- **Chức năng:** chủ ngữ · tân ngữ của động từ hoặc giới từ · bổ ngữ (*Mr. Smith is a very nice **employer***).
- **Hạn định từ + N:** a/an/the · this/that/these/those · my/your/his/her/its/our/their.

**Từ định lượng**
| Từ | Đi với | Ví dụ |
|---|---|---|
| each / every / another | danh từ **số ít** | Each person needs a ticket. · another product |
| little / a little / much | danh từ **không đếm được** | a little information · much money |
| few / a few / many / several | danh từ **số nhiều** | a few employees · several cities |
| some / most / all | không đếm được hoặc số nhiều | Most advice… · Some of the stories… |

**B. Đại từ**
| Chủ ngữ | Tân ngữ | Tính từ sở hữu (+N) | Đại từ sở hữu | Phản thân |
|---|---|---|---|---|
| I | me | my | mine | myself |
| you | you | your | yours | yourself/yourselves |
| we | us | our | ours | ourselves |
| they | them | their | theirs | themselves |
| he | him | his | his | himself |
| she | her | her | hers | herself |
| it | it | its | its | itself |

- Đại từ sở hữu = tính từ sở hữu + N (*he is borrowing **mine** = my bicycle*).
- Phản thân: nhấn mạnh (*washed the dishes **himself***) · chủ ngữ = tân ngữ (*introduced himself*) · cụm cố định: **by oneself** (một mình), **for oneself** (cho chính mình), **by itself** (tự nó).
- **Đại từ không xác định:**
  - 2 người/vật: **one – the other**
  - 3: **one – another – the other**
  - nhiều hơn 3: one – another · one – others · one – **the others** (tất cả phần còn lại) · some – the others
  - **each other** (2 người) · **one another** (nhiều người)

**3 bước làm dạng từ loại**
- Nhìn **trước và sau** chỗ trống → dựa vào vị trí, chức năng để xác định từ loại cần điền → loại trừ → xét nghĩa.
- Ví dụ: *the ___ of dairy products* → kẹp giữa hạn định từ và giới từ → danh từ (loại V-ing, to V) → distribution (sự phân phối) hay distributor (nhà phân phối) → chủ ngữ là "company" → **distributor**.
$md$, null),
('campbomb-rc-04', 'campbomb-rc', 4, 'Part 5: Tính từ, Trạng từ', 5, 'theory', $md$## Tính từ, Trạng từ

**A. Tính từ**
| Vị trí | Ví dụ |
|---|---|
| Trước danh từ, sau đại từ bất định | durable furniture · something durable |
| Sau linking verb (appear, be, become, look, remain, seem) | has become **careful** |
| Bổ nghĩa cho tân ngữ sau consider, keep, find, make, see | found the car **defective** |

- **Đuôi tính từ:** -able/-ible (available) · -ful (beautiful) · -less (useless) · -ive (exclusive) · -ous (dangerous) · -en (golden) · -al (essential) · -ary (imaginary).
- **Đuôi -ly nhưng là TÍNH TỪ:** costly, friendly, orderly, timely, daily, weekly, monthly, yearly.
- **Tính từ dễ nhầm:** comparative / comparable · economic (kinh tế) / economical (tiết kiệm) · sensitive (nhạy cảm) / sensible (hợp lý) · considerate (chu đáo) / considerable (đáng kể) · respectable (đáng kính) / respectful (lễ phép) / respective (tương ứng) · confident (tự tin) / confidential (bảo mật).

**B. Trạng từ**: bổ nghĩa cho động từ, tính từ, trạng từ khác, cụm từ hoặc cả mệnh đề (*Actually, she was promoted*).
- already (khẳng định) · yet (phủ định, nghi vấn) · still (cả hai).
- very, much (much + so sánh hơn: *much faster*), so…that, too…to.
- Tần suất (đứng trước V thường, sau to be): always, usually, often, sometimes, seldom, hardly ever, rarely, never.
- **Cặp nghĩa đặc biệt:** hard (chăm) – **hardly** (hầu như không) · near – **nearly** (gần như) · late – **lately** (gần đây) · short – **shortly** (sớm thôi).
- **Vừa là tính từ vừa là trạng từ:** fast, early, hard, high, late.

⚠️ **Sách Camp Bomb không có phần SO SÁNH** → học ở submarine-notes mục 7.2.
$md$, null),
('campbomb-rc-05', 'campbomb-rc', 5, 'Part 5: Giới từ, Cụm giới từ', 5, 'theory', $md$## Giới từ, Cụm giới từ

Giới từ + danh từ / đại từ / **V-ing** (không + mệnh đề). Cụm giới từ làm tính từ (*The book **on the desk***) hoặc trạng từ (*solved it **by himself***).

**Thời gian**
| Giới từ | Dùng | Ví dụ |
|---|---|---|
| at / in / on | giờ · buổi, tháng, mùa, năm · thứ, ngày | at 7 o'clock, in April, on Sunday |
| **by** / until (till) | hạn chót (xong trước) / kéo dài tới | finish **by** Thursday · open **until** 11 |
| from / since | từ (bắt đầu) / từ khi (+ HTHT) | effective **from** Monday · **since** last October |
| **for** / **during** | + khoảng thời gian (số) / + sự kiện | **for** three days · **during** the conference |
| in / **within** | sau (bao lâu nữa) / trong vòng | in thirty minutes · **within** thirty minutes |
| over / through | trong suốt (khoảng vừa qua) / đến hết | **over** the last three months · **through** next Friday |

**Nơi chốn, định hướng:** at, in · above / below · beneath / on · over / under · between (2) / among (≥3) · behind / in front of · beside, by, next to · against · around · near · throughout · for, toward, to · into / out of · through · across · along.

**Phương tiện, mục đích, nguyên nhân:** by (bằng cách + V-ing) · for (vì mục đích) · with (bằng dụng cụ) · at (ngạc nhiên **at**) · for (bị hủy **for** lý do) · from (mệt **from**) · about, of, on (thảo luận **on**).

**Giới từ đặc biệt (hay ra trong TOEIC):** as (với tư cách) · except (for) · notwithstanding (bất chấp) · concerning = regarding (về) · considering (xét tới) · excluding / including · following (sau khi).
**Cụm giới từ:** because of = due to · in addition to = besides · in spite of = despite · instead of · thanks to.

**3 bước làm dạng từ vựng (liên từ, giới từ)**
- Dịch câu → xác định cần **liên từ** hay **giới từ**: liên từ nối **hai mệnh đề**; giới từ đi với **cụm danh từ hoặc V-ing**.
- Ví dụ: *___ the weather is getting warmer, more people prefer outdoor activities.* → nghĩa "bởi vì" → loại However, Whatever → sau trống là mệnh đề → **Now that** (không phải Because of).
$md$, null),
('campbomb-rc-06', 'campbomb-rc', 6, 'Part 5: Liên từ, mệnh đề trạng ngữ, danh ngữ', 5, 'theory', $md$## Liên từ đẳng lập, tương hỗ, mệnh đề trạng ngữ, mệnh đề danh ngữ

**Liên từ đẳng lập (FANBOYS):** for, and, nor, but, or, so, yet — nối từ, cụm, câu.

**Liên từ tương hỗ**
- **Both A and B** → động từ số nhiều.
- **Either A or B / Neither A nor B / Not only A but (also) B / Not A but B** → chia theo **B**.
- **B as well as A** → chia theo **B**.

**Mệnh đề danh ngữ:** that + mệnh đề (*That the sun rises in the East is a fact*) · **whether/if** (*Whether he likes my idea is uncertain* — đầu câu chỉ dùng whether) · từ để hỏi (*Can you tell me **when** the manager will be back?*).

**Mệnh đề trạng ngữ** (liên từ + S + V)
| Ý nghĩa | Liên từ |
|---|---|
| Thời gian | after, as, before, when, while, since, as soon as |
| Lý do | as, because, since, **now that** |
| Điều kiện | if, **once**, **unless**, in case, **provided that** |
| Nhượng bộ | although, though, even though, even if, notwithstanding that |
| Mục đích | so that |
| Kết quả | so … that |

**⭐ Liên từ (+ mệnh đề) vs giới từ (+ cụm danh từ)**
| Liên từ + S + V | Giới từ + N / V-ing |
|---|---|
| because, since, as | because of, due to |
| although, though, even though, even if | despite, in spite of |
| while | during |

**Trạng từ liên kết** (đứng đầu câu, có dấu phẩy, KHÔNG nối 2 mệnh đề thành 1 câu): thêm vào: moreover, besides, furthermore · đối lập: however, nevertheless · kết quả: therefore, as a result · ví dụ: for example, for instance.
$md$, null),
('campbomb-rc-07', 'campbomb-rc', 7, 'Part 5: Mệnh đề quan hệ, rút gọn', 5, 'theory', $md$## Mệnh đề quan hệ, rút gọn MĐQH

**Đại từ quan hệ**
| Từ | Thay cho | Vai trò | Theo sau |
|---|---|---|---|
| who | người | chủ ngữ | động từ |
| whom | người | tân ngữ | S + V |
| which | vật | chủ ngữ / tân ngữ | V hoặc S + V |
| that | người & vật | thay who/whom/which (MĐ xác định) | V hoặc S + V |
| whose | người & vật | sở hữu | **câu hoàn chỉnh** (whose + N + V…) |

**Xác định vs không xác định**
- Xác định: không có dấu phẩy, bỏ đi câu mất nghĩa; dùng được **that**; có thể lược đại từ khi làm tân ngữ (*The desk I bought…*).
- Không xác định: có dấu phẩy, **không dùng that**, không lược được.

**Trạng từ quan hệ:** when (thời gian) = on/in which · where (nơi chốn) = in/at which · why (lý do) = for which.
- **Đại từ quan hệ** + câu **thiếu** thành phần · **trạng từ quan hệ** + câu **hoàn chỉnh** (*the floor **which** she parked her car on* vs *the garage **where** he parked his car*).

**Rút gọn MĐQH**
- Nghĩa **chủ động** → **V-ing**: The dog which is barking → The dog **barking**.
- Nghĩa **bị động** → **V3/ed**: The skirt that was ordered → The skirt **ordered** last weekend.

**3 bước làm dạng đại từ quan hệ**
- Trước chỗ trống là người → who, whom, whose, that · là vật → which, whose, that.
- Sau chỗ trống là **động từ** → who/which/that (chủ ngữ) · **thiếu tân ngữ** → whom/which/that · **câu hoàn chỉnh** → **whose**.

**3 bước làm dạng rút gọn MĐQH**
- Câu đã có động từ chính chia thì → loại các đáp án chia thì.
- Sau chỗ trống **có tân ngữ** → chủ động → **V-ing** · **không có tân ngữ** → bị động → **V3**.
- Ví dụ: *The woman ___ our dinner is very attractive.* → đã có "is" · sau trống là tân ngữ "our dinner" → **cooking**.
$md$, null),
('campbomb-rc-08', 'campbomb-rc', 8, 'Part 6', 6, 'theory', $md$## Part 6

| Mục | Nội dung |
|---|---|
| Số câu | 16 (131–146), 4 đoạn × 4 câu |
| Dạng | Đoạn văn khuyết 4 chỗ: chọn từ đúng ngữ pháp/từ vựng; mỗi đoạn có **1 câu điền cả câu** |
| Lời khuyên | Đọc lướt cả đoạn trước để nắm nội dung rồi mới trả lời. **≤ 30 giây/câu ngữ pháp, ≤ 1 phút/câu điền câu** |
| Mục tiêu | 8/16 |

**3 bước luyện Part 6:** (1) đọc hiểu, chọn đáp án không tra từ điển → check, ghi điểm · (2) chữa: đánh mũi tên các cụm dịch ngược + dịch từ mới, tóm tắt đoạn theo ý mình, dịch đủ 4 đáp án của cả 4 câu · (3) quay video dịch đoạn vừa chữa.

> ⚠️ Web ghi RC 8 là Part 5 (sách là Part 6) — kiểm tra lại khi làm.
$md$, null),
('campbomb-rc-09', 'campbomb-rc', 9, 'Part 7: giới thiệu, Email/Letter', 7, 'theory', $md$## Giới thiệu Part 7

**Số lượng:** đoạn đơn 10 bài / 29 câu (mục tiêu 18) · đoạn đôi 2 bài × 5 câu = 10 câu (mục tiêu 5) · đoạn ba 3 bài × 5 câu = 15 câu (mục tiêu 6). Tổng 54 câu, mục tiêu 29.

**6 dạng câu hỏi**
| Dạng | Cách làm | Dấu hiệu |
|---|---|---|
| 1. Ý chính, mục đích | Thông tin thường ở **đầu đoạn**; đọc lướt (skim) | What is the article **about**? · **purpose** · **Why** was this memo written? |
| 2. Thông tin chi tiết (~50%) | Đọc câu hỏi trước, nhớ keyword, **scan** tìm vị trí rồi đọc kỹ | What is **stated**… · When/Who… · Which is **NOT true**… |
| 3. Suy luận (~10%) | Suy ra từ ý ẩn | **imply**, **inferred**, **most likely**, **suggest**, **probably** |
| 4. Từ đồng nghĩa | Tìm vị trí từ, đọc cả câu để chọn nét nghĩa hợp ngữ cảnh | The word "X" in paragraph 2, line 7, is **closest in meaning to** |
| 5. Hàm ý câu nói (chat) | Dựa vào ngữ cảnh và lời đáp của người khác | At 2:15, what does Mark **mean** when he writes "…"? |
| 6. Chèn câu | Hiểu bố cục; chú ý đại từ, liên từ, trạng từ quan hệ để loại vị trí sai | In which of the positions marked [1]–[4] does the following sentence best belong? |

**Các dạng văn bản và chủ đề hay gặp**
| Loại | Bố cục | Chủ đề |
|---|---|---|
| Email / Letter | người gửi, nhận, chủ đề → lý do viết → lời hứa, kế hoạch, yêu cầu | đồng nghiệp (dự án, lịch, công tác) · khách hàng (cập nhật dịch vụ, xác nhận đơn, phàn nàn, hỗ trợ) · tuyển dụng (thư xin việc, hẹn phỏng vấn, hướng dẫn nhân viên mới) |
| Notice | thông báo chính → chi tiết → liên hệ | cơ quan (thi công, giảm giá, lịch khai trương) · doanh nghiệp (chính sách mới, khách hàng thân thiết, chi nhánh mới, thu hồi sản phẩm lỗi, tuyển dụng) |
| Memo | gửi toàn bộ nhân viên → giới thiệu thay đổi → chi tiết, số liệu | thay đổi trong công ty, chuyển văn phòng, sửa chữa, lịch họp, quy định mới, khách đến thăm, nhân viên mới |
| Article / News / Press release | giới thiệu chung → sơ lược → chi tiết, trích dẫn | tình hình hoạt động, sáp nhập/mua lại, sự kiện, sản phẩm mới, nhân vật (nghỉ hưu, vị trí mới) |
| Job advertisement | thu hút → mô tả công việc, yêu cầu, phúc lợi → cách ứng tuyển, hạn nộp | tuyển thời vụ / tuyển có kinh nghiệm |
| Web page | giới thiệu sản phẩm/dịch vụ → giải thích → liên hệ | quảng cáo, giới thiệu công ty |
| Message chain / Chat | vấn đề → thảo luận → yêu cầu | đồng nghiệp (dự án), nhân viên – khách (khiếu nại), sếp – nhân viên (giao việc, lịch) |
| Review | đánh giá sau khi dùng, mức độ hài lòng | sự cố khi dùng sản phẩm |

**3 bước luyện Part 7:** (1) đọc hiểu, chọn đáp án không tra từ điển → check · (2) chữa: đánh mũi tên cụm dịch ngược + từ mới, tóm tắt văn bản, **highlight keyword câu hỏi** → dịch ngắn gọn câu hỏi, **highlight + đánh số vị trí đáp án** trong bài, **gạch keyword sai** ở 3 đáp án sai · (3) quay video dịch.

_(Chưa có: L10–L12, các bài Part 7 theo chủ đề. Nếu chỉ là bài đọc mẫu thì không cần scan, làm trên web.)_

> ⚠️ Web ghi RC 9 là Part 6 — kiểm tra lại khi làm.
$md$, null),
('campbomb-rc-10', 'campbomb-rc', 10, 'Part 7 đoạn đơn', 7, 'practice', $md$Lý thuyết Part 7 (6 dạng câu hỏi, các loại văn bản) ở **Lesson 9**. Sách phần này chưa scan — làm bài web và chữa theo 3 bước Part 7.
$md$, null),
('campbomb-rc-11', 'campbomb-rc', 11, 'Part 7 đoạn đôi', 7, 'practice', $md$Lý thuyết Part 7 (6 dạng câu hỏi, các loại văn bản) ở **Lesson 9**. Sách phần này chưa scan — làm bài web và chữa theo 3 bước Part 7.
$md$, null),
('campbomb-rc-12', 'campbomb-rc', 12, 'Part 7 đoạn ba', 7, 'practice', $md$Lý thuyết Part 7 (6 dạng câu hỏi, các loại văn bản) ở **Lesson 9**. Sách phần này chưa scan — làm bài web và chữa theo 3 bước Part 7.
$md$, null),
('campbomb-rc-13', 'campbomb-rc', 13, 'Part 5 & 6: luyện đề', 5, 'practice', null, null),
('campbomb-rc-14', 'campbomb-rc', 14, 'Part 7: luyện đề', 7, 'practice', null, null),
('campbomb-rc-15', 'campbomb-rc', 15, 'Part 5 & 6: luyện đề', 5, 'practice', $md$⚠️ Web ghi RC 15 là Part 7.
$md$, null),
('campbomb-rc-16', 'campbomb-rc', 16, 'Part 7: luyện đề', 7, 'practice', $md$⚠️ Web ghi RC 16 là Part 5 + 6.
$md$, null),
('submarine-rc-01', 'submarine-rc', 1, 'Cấu trúc câu, Động từ', 5, 'theory', $md$## Các dạng câu hỏi thường gặp Part 5 (bảng tổng quan, trang 8)

| Dạng | Ví dụ | Đáp án |
|---|---|---|
| Từ loại | The manager gave an ___ speech. | inspiring (adj) |
| Đại từ | Each employee must submit ___ report. | their |
| Chia động từ | By the time we arrived, the meeting ___ already. | had started |
| Giới từ | She is responsible ___ handling complaints. | for |
| Liên từ | The project was delayed ___ the weather conditions were unexpected. | because |
| Rút gọn mệnh đề | The manager, ___ at the seminar, gave an inspiring speech. | speaking |
| So sánh | This product is much ___ than the previous version. | better |
| Từ vựng | The company decided to ___ the outdated system. | revise |

Mục tiêu Part 5 của Submarine: **24/30**.

Phần cấu trúc câu và động từ **trùng Camp Bomb Đọc L1 + L2** — mở lại 2 bài đó để ôn.
$md$, null),
('submarine-rc-02', 'submarine-rc', 2, 'Động từ đặc biệt: V-ing, To V, PII', 5, 'theory', $md$## Động từ đặc biệt: V-ing, To V, PII (MỚI)

**3 dạng câu chia động từ phụ**
1. **Cấu trúc cố định:** *Online shoppers… tend ___ the business low ratings.* → **to give** (tend to V).
2. **Rút gọn mệnh đề quan hệ chủ động:** *Travelers ___ the local airport complain…* → **using**.
3. **Rút gọn mệnh đề quan hệ bị động:** *A thunderstorm ___ by gusty winds is expected…* → **accompanied**.

### Động từ + To V
| Động từ + to V | Động từ + tân ngữ + to V |
|---|---|
| tend to V: có xu hướng | advise sb to V: khuyên |
| decide to V: quyết định | allow sb to V: cho phép |
| expect to V: mong đợi | ask sb to V: yêu cầu |
| hope to V: hy vọng | encourage sb to V: khuyến khích |
| learn to V: học | expect sb to V: mong ai |
| manage to V: xoay sở | help sb (to) V: giúp |
| need to V: cần | invite sb to V: mời |
| offer to V: đề nghị (làm gì) | need sb to V: cần ai |
| plan to V: dự định | order sb to V: ra lệnh |
| prepare to V: chuẩn bị | permit sb to V: cho phép |
| promise to V: hứa | remind sb to V: nhắc nhở |
| want to V: muốn | tell sb to V: bảo |
| wish to V: mong muốn | want sb to V: muốn ai |

### Động từ + V-ing
| Động từ + V-ing | Động từ + tân ngữ + V-ing (giác quan, bắt gặp) |
|---|---|
| avoid: tránh | catch sb V-ing: bắt gặp ai đang |
| consider: cân nhắc | discover sb V-ing: phát hiện |
| delay: trì hoãn | feel sb V-ing: cảm thấy |
| deny: phủ nhận | find sb V-ing: thấy |
| discuss: thảo luận | hear sb V-ing: nghe thấy |
| enjoy: thích | notice sb V-ing: để ý |
| finish: hoàn thành | see sb V-ing: nhìn thấy |
| keep: tiếp tục | smell sb V-ing: ngửi thấy |
| mind: phiền | watch / observe sb V-ing: quan sát |
| suggest: đề xuất | |

**⚠️ "to" là GIỚI TỪ → + V-ing (ghi chú tay của Đạt):** **commit to** V-ing/N (cam kết) · **dedicate / devote to** V-ing/N (cống hiến) · **contribute to** V-ing (đóng góp). Thêm hay gặp: look forward to, be used to, object to.

### Rút gọn mệnh đề quan hệ
Chủ động → **V-ing** (*The girl sitting over there…*) · bị động → **V3/ed** (*The skirt ordered last weekend…*). (Chi tiết: campbomb-notes L7.)

### Rút gọn mệnh đề trạng ngữ cùng chủ ngữ (MỚI)
Khi 2 mệnh đề **cùng chủ ngữ**, rút gọn mệnh đề trạng ngữ:
| Cách | Dùng khi | Cấu trúc | Ví dụ |
|---|---|---|---|
| **V-ing** | 2 hành động đồng thời / liên tiếp (chủ động) | When S + V, S + V → **V-ing**, S + V | When he opened his restaurant, he recruited two investors → **Opening** his own restaurant, he recruited… |
| **Having + V3** | hành động rút gọn xảy ra **trước** | After S + had V3, S + V → **Having V3**, S + V | **Having finished** cleaning the room, she enjoyed a coffee. |
| **V3/ed** | bị động | When/After S + be + V3, S + V → **V3**, S + V | **Signed**, the contract was finalized. |

**Ghi chú tay của Đạt:** to V → mục đích · V-ing → chủ động · PII → bị động.

### Ba bước làm dạng chia V phụ
1. Chia câu S, V, O, C, M · xác định **câu đã có V chính (chia thì) chưa**:
   - Chưa có → chia thì như dạng V chính (xem campbomb-notes L2).
   - Có rồi → loại các đáp án chia thì → sang bước tiếp.
2. Xác định động từ phụ thuộc nhóm nào: **cấu trúc cố định** (help sb do, try to do, enjoy doing…) · **rút gọn chủ động (V-ing)** · **rút gọn bị động (PII)**.
3. Ví dụ: *Travelers ___ the local airport in Hopkins complain…* → V chính là "complain" → loại A (use), D (will use) → sau trống có tân ngữ "the local airport" → **B. using**.
$md$, null),
('submarine-rc-03', 'submarine-rc', 3, 'Từ loại: Danh từ, Tính từ, Trạng từ', 5, 'theory', $md$## Từ loại (chỉ phần MỚI so với Camp Bomb)

**3 dạng câu hỏi từ loại**
1. **Từ loại:** compete / competition / competitively / competitive → xét vị trí chỗ trống.
2. **Từ loại + dịch nghĩa:** interpreter / interpret / interpreting / interpretation → A và D đều là danh từ → phân biệt nghĩa (người / sự việc).
3. **Từ loại + cấu trúc câu:** signed / signing / signature / to sign → nhiều dạng động từ → xác định cấu trúc câu.

**Cụm danh từ (Noun phrase):** **Hạn định từ + (Adv) + (Adj) + N** → *your motorbike, a student book, a well-known singer*.
Ghi chú tay của Đạt: HĐT + adv + adj + **N phụ** + **N chính** (+ giới từ…) · N phụ thường số ít (sales, savings, sports là ngoại lệ).
**Danh từ ghép:** (N phụ) + N chính → boyfriend, bus station, bookstore, sunrise.

**Ghi chú tay về trạng từ:** hard/hardly (hầu như không) · high (adj, adv) / highly (rất) · late / lately (gần đây) · near / nearly (gần như) · **N + ly → tính từ** (timely: kịp thời, costly, friendly…).

Phần còn lại trùng **Camp Bomb Đọc L3 + L4**.
$md$, null),
('submarine-rc-04', 'submarine-rc', 4, 'Giới từ, Liên từ', 5, 'theory', $md$## Giới từ, Liên từ (chỉ phần MỚI)

**Giới từ:** giới từ đơn (about, for, in, on, within…) và **giới từ ghép** (because of, in front of, on behalf of…).
**2 dạng câu hỏi giới từ:** (1) chọn giữa các giới từ → nắm nét nghĩa + cụm cố định · (2) **giới từ vs liên từ phụ thuộc** (despite / nevertheless / although / however) → nhìn sau chỗ trống là **mệnh đề hay cụm danh từ**.

**3 dạng câu hỏi liên từ:** (1) đẳng lập (so / but / and / or) · (2) tương hỗ (neither / both / either / not only) → tìm cặp từ trong câu · (3) phụ thuộc (as if / even though / while / because) → hiểu cấu trúc và nghĩa.

**Mệnh đề danh ngữ (Noun clause):**
- **That-clause** → ý kiến, sự thật (believe, think, know…)
- **Whether/If-clause** → không chắc chắn, lựa chọn (not sure, decide, wonder…)
- **Wh-clause** → ai, cái gì, khi nào, ở đâu.

**Liên từ vs trạng từ liên kết:** *I support his idea **because** it is innovative.* (nối 2 mệnh đề) · *His idea is innovative. **Therefore**, I support it.* (đứng đầu câu mới).

Ghi chú tay: **whether … or …** (liệu rằng A hay B) · **no sooner + had S V3 … than S V2** (vừa mới … thì) · **not only … but (also)**: không những … mà còn.

(Bảng mệnh đề trạng ngữ, liên từ tương hỗ, MĐQH: xem campbomb-notes L6–L7.)

Phần còn lại trùng **Camp Bomb Đọc L5 + L6 + L7**.
$md$, null),
('submarine-rc-05', 'submarine-rc', 5, 'Đại từ, Câu so sánh', 5, 'theory', $md$## Đại từ, Câu so sánh

### Đại từ (phần MỚI so với Camp Bomb)
| Từ | Dùng | Ví dụ |
|---|---|---|
| **some** | câu khẳng định | I have **some** books. |
| **any** | phủ định, nghi vấn, điều kiện | I didn't have **any** money. · Do you have **any** pens? · …if you have **any**. |
| **each, everyone, everything** | luôn coi là **số ít** | **Each** has its own bar code. · **Everyone** is entitled to his or her own opinion. |
| **all** | số ít hoặc số nhiều | **all** were interesting · **All** you need **is** a student ID. |
| **those** (+ who) | = những người | **Those** individuals who are interested… |

**Ghi chú tay của Đạt (another / other / the other):**
- **another** + N số ít (một cái khác, chưa xác định)
- **other** + N số nhiều / N không đếm được (những cái khác) · **others** = other + N số nhiều (đứng một mình)
- **the other** + N (cái còn lại, xác định) · **the others** = những cái còn lại

**Ví dụ đề (đáp án):** *Because of management's high expectations, ___ were obligated…* → **we** (chủ ngữ) · *Mr. Taylor was able to purchase tickets, but ___ were not as fortunate* → **others** · *___ individuals who are interested… must sign up* → **Those** · *write the essays by ___* → **themselves** · *asked to see ___ building* → **another**.

### Câu so sánh (MỚI, trước đây còn thiếu)
| Loại | Cấu trúc | Ví dụ |
|---|---|---|
| **So sánh bằng** | **as + adj/adv + as** | She is **as tall as** her brother. · He runs **as quickly as** I do. |
| | the same + N + as (ghi chú tay) | the same size as |
| **So sánh hơn** | adj ngắn + **-er** + than · **more** + adj dài + than | **taller than** · **more interesting than** |
| | **more / fewer / less + N + than** (ghi chú tay) | fewer employees than |
| **So sánh nhất** | **the** + adj ngắn + **-est** · **the most** + adj dài | **the smartest** student · **the most expensive** restaurant |
| **So sánh kép** (ghi chú tay) | **The + so sánh hơn + S V, the + so sánh hơn + S V** | *The more I learn, the more I know.* |

- Tính từ ngắn: 1–2 âm tiết (tall, small) · tính từ dài: từ 3 âm tiết (beautiful, interesting).
- **Từ nhấn mạnh so sánh hơn** (ghi chú tay): **much, far, a little, slightly** (+ even, a lot, still) → *much better*. ⚠️ **Không dùng "very"** trước so sánh hơn.
- Bất quy tắc (Claude bổ sung): good/well → better → best · bad/badly → worse → worst · many/much → more → most · little → less → least · far → farther/further → farthest/furthest.

**Ví dụ đề (đáp án):** *This book is the ___ detailed one that I am familiar with* → **most** · *The laptop that Sara is using is as ___ as any other laptop* → **reliable** (as + adj + as) · *The salespeople… are ___ more informed than…* → **much** · *…resulted in more production problems ___ had ever occurred before* → **than** · *The more I read about that businesswoman, the more ___ I am* → **impressed**.
$md$, null),
('submarine-rc-06', 'submarine-rc', 6, 'Thực hành Part 5', 5, 'practice', null, null),
('submarine-rc-07', 'submarine-rc', 7, 'Part 6', 6, 'theory', $md$## L7–L8. Part 6, Part 7
Trùng campbomb-notes L8–L9. Khác biệt duy nhất là **mục tiêu**:
- Part 6: **14/16** (L7 Submarine) hoặc 12/16 (bảng mục tiêu khóa).
- Part 7: đoạn đơn 7 + 7 + 7, đoạn đôi 7/10, đoạn ba 8/15 → **36/54**.

L9 Part 7 đoạn đôi trong bản scan chỉ có bài đọc mẫu (email + lịch tour, hóa đơn + email, email vé máy bay + tin nhắn) → không chép, làm bài web Su_Lesson 13_RC 9_P7.

Lý thuyết Part 6 xem **Camp Bomb Đọc L8**.
$md$, null),
('submarine-rc-08', 'submarine-rc', 8, 'Part 7 đoạn đơn', 7, 'practice', $md$Lý thuyết Part 7 xem **Camp Bomb Đọc L9**. Mục tiêu Submarine: Part 7 ≥ 36/54.
$md$, null),
('submarine-rc-09', 'submarine-rc', 9, 'Part 7 đoạn đôi', 7, 'practice', $md$Lý thuyết Part 7 xem **Camp Bomb Đọc L9**. Mục tiêu Submarine: Part 7 ≥ 36/54.
$md$, null),
('submarine-rc-10', 'submarine-rc', 10, 'Part 7 đoạn ba', 7, 'practice', $md$Lý thuyết Part 7 xem **Camp Bomb Đọc L9**. Mục tiêu Submarine: Part 7 ≥ 36/54.
$md$, null),
('submarine-rc-11', 'submarine-rc', 11, 'Part 5 & 6: luyện đề', 5, 'practice', null, null),
('submarine-rc-12', 'submarine-rc', 12, 'Part 7: luyện đề', 7, 'practice', null, null),
('submarine-rc-13', 'submarine-rc', 13, 'Part 5 & 6: luyện đề', 7, 'practice', $md$Web ghi RC 13 là Part 7.
$md$, null),
('submarine-rc-14', 'submarine-rc', 14, 'Part 7: luyện đề', 5, 'practice', $md$Web ghi RC 14 là Part 5 + 6.
$md$, null),
('submarine-rc-15', 'submarine-rc', 15, 'Part 5 & 6: luyện đề', 7, 'practice', $md$Web ghi RC 15 là Part 7.
$md$, null),
('submarine-rc-16', 'submarine-rc', 16, 'Part 7: luyện đề', 7, 'practice', $md$Không có bài web riêng — dùng BTVN RC P7.
$md$, null)
on conflict (id) do update set
  book_id = excluded.book_id, lesson_no = excluded.lesson_no, title = excluded.title,
  part = excluded.part, kind = excluded.kind, theory_md = excluded.theory_md,
  checkpoint = excluded.checkpoint;

insert into toeic_quizzes (slug, lesson_id, title, kind, part, question_count, sort_order) values
('fo_lesson-4_actual-1', 'foundation-04', 'Actual 1', 'lesson', 1, null, 1),
('fo_lesson-4_actual-2', 'foundation-04', 'Actual 2', 'lesson', 1, null, 2),
('fo_lesson-4_actual-3', 'foundation-04', 'Actual 3', 'lesson', 1, null, 3),
('fo_btvn-04_part-1_test-1', 'foundation-04', 'BTVN 04 · Part 1 · Test 1', 'homework', 1, null, 4),
('fo_btvn-04_part-1_test-2', 'foundation-04', 'BTVN 04 · Part 1 · Test 2', 'homework', 1, null, 5),
('fo_btvn-04_part-1_test-3', 'foundation-04', 'BTVN 04 · Part 1 · Test 3', 'homework', 1, null, 6),
('fo_btvn-04_part-1_test-4', 'foundation-04', 'BTVN 04 · Part 1 · Test 4', 'homework', 1, null, 7),
('fo_lesson-5_actual-1', 'foundation-05', 'Actual 1', 'lesson', 1, null, 1),
('fo_lesson-5_actual-2', 'foundation-05', 'Actual 2', 'lesson', 1, null, 2),
('fo_lesson-5_actual-3', 'foundation-05', 'Actual 3', 'lesson', 1, null, 3),
('fo_btvn-05_part-1_test-5', 'foundation-05', 'BTVN 05 · Part 1 · Test 5', 'homework', 1, null, 4),
('fo_btvn-05_part-1_test-6', 'foundation-05', 'BTVN 05 · Part 1 · Test 6', 'homework', 1, null, 5),
('fo_btvn-05_part-1_test-7', 'foundation-05', 'BTVN 05 · Part 1 · Test 7', 'homework', 1, null, 6),
('fo_lesson-6_practice', 'foundation-06', 'Practice', 'lesson', 2, null, 1),
('fo_btvn-06_part-1_test-8', 'foundation-06', 'BTVN 06 · Part 1 · Test 8', 'homework', 1, null, 2),
('fo_btvn-06_part-1_test-9', 'foundation-06', 'BTVN 06 · Part 1 · Test 9', 'homework', 1, null, 3),
('fo_btvn-06_part-1_test-10', 'foundation-06', 'BTVN 06 · Part 1 · Test 10', 'homework', 1, null, 4),
('fo_lesson-7_practice', 'foundation-07', 'Practice', 'lesson', 2, null, 1),
('fo_btvn-07', 'foundation-07', 'BTVN 07 · Part 2', 'homework', 2, null, 2),
('fo_lesson-8_practice', 'foundation-08', 'Practice', 'lesson', 2, null, 1),
('fo_btvn-08_part-2', 'foundation-08', 'BTVN 08 · Part 2', 'homework', 2, null, 2),
('fo_btvn-08_part-1_test-1', 'foundation-08', 'BTVN 08 · Part 1 · Test 1', 'homework', 1, null, 3),
('fo_btvn-08_part-1_test-2', 'foundation-08', 'BTVN 08 · Part 1 · Test 2', 'homework', 1, null, 4),
('fo_lesson-9_practice', 'foundation-09', 'Practice', 'lesson', 2, null, 1),
('fo_btvn-09_part-2-2', 'foundation-09', 'BTVN 09 · Part 2', 'homework', 2, null, 2),
('fo_lesson-10_practice', 'foundation-10', 'Practice', 'lesson', 2, null, 1),
('fo_btvn-10_part-2', 'foundation-10', 'BTVN 10 · Part 2', 'homework', 2, null, 2),
('fo_lesson-11_practice', 'foundation-11', 'Practice', 'lesson', 2, null, 1),
('fo_btvn-11_part-2', 'foundation-11', 'BTVN 11 · Part 2', 'homework', 2, null, 2),
('fo_btvn-12_part-2', 'foundation-12', 'BTVN 12 · Part 2', 'homework', 2, null, 1),
('fo_btvn-12_part-1_test-1', 'foundation-12', 'BTVN 12 · Part 1 · Test 1', 'homework', 1, null, 2),
('fo_btvn-12_part-1_test-2', 'foundation-12', 'BTVN 12 · Part 1 · Test 2', 'homework', 1, null, 3),
('fo_btvn-13_part-2', 'foundation-12', 'BTVN 13 · Part 2', 'homework', 2, null, 4),
('fo_btvn-14_part-2', 'foundation-12', 'BTVN 14 · Part 2', 'homework', 2, null, 5),
('be_lesson-1_actual-test-1', 'beginner-01', 'Actual Test 1', 'lesson', 1, null, 1),
('be_lesson-1_actual-test-2', 'beginner-01', 'Actual Test 2', 'lesson', 1, null, 2),
('be_lesson-1_actual-test-3', 'beginner-01', 'Actual Test 3', 'lesson', 1, null, 3),
('be_btvn-01_part-1_test-1', 'beginner-01', 'BTVN 01 · Part 1 · Test 1', 'homework', 1, null, 4),
('be_btvn-01_part-1_test-2', 'beginner-01', 'BTVN 01 · Part 1 · Test 2', 'homework', 1, null, 5),
('be_btvn-01_part-1_test-3', 'beginner-01', 'BTVN 01 · Part 1 · Test 3', 'homework', 1, null, 6),
('be_btvn-01_part-1_test-4', 'beginner-01', 'BTVN 01 · Part 1 · Test 4', 'homework', 1, null, 7),
('be_lesson-2_actual-test', 'beginner-02', 'Actual Test', 'lesson', 2, null, 1),
('be_btvn-02_part-1', 'beginner-02', 'BTVN 02 · Part 1', 'homework', 1, null, 2),
('be_btvn-02_part-2', 'beginner-02', 'BTVN 02 · Part 2', 'homework', 2, null, 3),
('be_lesson-3_actual-test', 'beginner-03', 'Actual Test', 'lesson', 2, null, 1),
('be_btvn-03_part-1', 'beginner-03', 'BTVN 03 · Part 1', 'homework', 1, null, 2),
('be_btvn-03_part-2', 'beginner-03', 'BTVN 03 · Part 2', 'homework', 2, null, 3),
('be_lesson-4_actual-test', 'beginner-04', 'Actual Test', 'lesson', 2, null, 1),
('be_btvn-04_part-1', 'beginner-04', 'BTVN 04 · Part 1', 'homework', 1, null, 2),
('be_btvn-04_part-2', 'beginner-04', 'BTVN 04 · Part 2', 'homework', 2, null, 3),
('be_lesson-5_actual-test', 'beginner-05', 'Actual Test', 'lesson', 2, null, 1),
('be_btvn-05_part-1', 'beginner-05', 'BTVN 05 · Part 1', 'homework', 1, null, 2),
('be_btvn-05_part-2', 'beginner-05', 'BTVN 05 · Part 2', 'homework', 2, null, 3),
('be_lesson-6_part-1', 'beginner-06', 'Part 1', 'lesson', 1, null, 1),
('be_lesson-6_part-2', 'beginner-06', 'Part 2', 'lesson', 2, null, 2),
('be_btvn-06_part-1', 'beginner-06', 'BTVN 06 · Part 1', 'homework', 1, null, 3),
('be_btvn-06_part-2', 'beginner-06', 'BTVN 06 · Part 2', 'homework', 2, null, 4),
('be_lesson-7_part-3', 'beginner-07', 'Part 3', 'lesson', 3, null, 1),
('be_btvn-07_part-1', 'beginner-07', 'BTVN 07 · Part 1', 'homework', 1, null, 2),
('be_btvn-07_part-2', 'beginner-07', 'BTVN 07 · Part 2', 'homework', 2, null, 3),
('be_lesson-8_part-3', 'beginner-08', 'Part 3', 'lesson', 3, null, 1),
('be_btvn-08_part-1', 'beginner-08', 'BTVN 08 · Part 1', 'homework', 1, null, 2),
('be_btvn-08_part-2', 'beginner-08', 'BTVN 08 · Part 2', 'homework', 2, null, 3),
('be_lesson-9_part-3', 'beginner-09', 'Part 3', 'lesson', 3, null, 1),
('be_btvn-09_part-3', 'beginner-09', 'BTVN 09 · Part 3', 'homework', 3, null, 2),
('be_lesson-10_part-4', 'beginner-10', 'Part 4', 'lesson', 4, null, 1),
('be_btvn-10_part-3', 'beginner-10', 'BTVN 10 · Part 3', 'homework', 3, null, 2),
('be_btvn-11_part-3', 'beginner-10', 'BTVN 11 · Part 3', 'homework', 3, null, 3),
('be_lesson-11_part-4', 'beginner-11', 'Part 4', 'lesson', 4, null, 1),
('be_btvn-13_part-4', 'beginner-11', 'BTVN 13 · Part 4', 'homework', 4, null, 2),
('be_btvn-14_part-4', 'beginner-11', 'BTVN 14 · Part 4', 'homework', 4, null, 3),
('test-1-ets-2020', 'campbomb-lc-01', 'Lesson 1 LC (ETS 2020 Test 1)', 'lesson', null, null, 1),
('test-2-ets-2020', 'campbomb-lc-01', 'BTVN 01 LC (ETS 2020 Test 2)', 'homework', null, null, 2),
('part-1-test-6-ets-2020', 'campbomb-lc-02', 'Lesson 2 LC (ETS 2020 Test 6 · P1)', 'lesson', 1, null, 1),
('ca_btvn-02', 'campbomb-lc-02', 'BTVN 02 LC', 'homework', null, null, 2),
('ca_lesson-3_part-3_lc', 'campbomb-lc-03', 'Lesson 3 · Part 3', 'lesson', 3, null, 1),
('ca_btvn-03', 'campbomb-lc-03', 'BTVN 03 LC', 'homework', null, null, 2),
('ca_lesson-4_part-3', 'campbomb-lc-04', 'Lesson 4 · Part 3', 'lesson', 3, null, 1),
('ca_btvn-04', 'campbomb-lc-04', 'BTVN 04 LC', 'homework', null, null, 2),
('ca_lesson-5_part-3', 'campbomb-lc-05', 'Lesson 5 · Part 3', 'lesson', 3, null, 1),
('ca_btvn-05', 'campbomb-lc-05', 'BTVN 05 LC', 'homework', null, null, 2),
('ca_lc_btvn-10_part-3', 'campbomb-lc-05', 'LC BTVN 10 · Part 3', 'homework', 3, null, 3),
('ca_lc_btvn-11_part-3', 'campbomb-lc-05', 'LC BTVN 11 · Part 3', 'homework', 3, null, 4),
('ca_lc_btvn-12_part-3', 'campbomb-lc-05', 'LC BTVN 12 · Part 3', 'homework', 3, null, 5),
('ca_lc_btvn-14_part-3', 'campbomb-lc-05', 'LC BTVN 14 · Part 3', 'homework', 3, null, 6),
('ca_lc_btvn-15_part-3', 'campbomb-lc-05', 'LC BTVN 15 · Part 3', 'homework', 3, null, 7),
('ca_lc_btvn-18_part-3', 'campbomb-lc-05', 'LC BTVN 18 · Part 3', 'homework', 3, null, 8),
('ca_lc_btvn-19_part-3', 'campbomb-lc-05', 'LC BTVN 19 · Part 3', 'homework', 3, null, 9),
('ca_lesson-6_part-4', 'campbomb-lc-06', 'Lesson 6 · Part 4', 'lesson', 4, null, 1),
('ca_btvn-06', 'campbomb-lc-06', 'BTVN 06 LC', 'homework', null, null, 2),
('ca_lesson-6_part-4-2', 'campbomb-lc-07', 'Lesson 7 · Part 4', 'lesson', 4, null, 1),
('ca_btvn-07', 'campbomb-lc-07', 'BTVN 07 LC', 'homework', null, null, 2),
('ca_lc_btvn-22_part-4', 'campbomb-lc-07', 'LC BTVN 22 · Part 4', 'homework', 4, null, 3),
('ca_lc_btvn-23_part-4', 'campbomb-lc-07', 'LC BTVN 23 · Part 4', 'homework', 4, null, 4),
('ca_lc_btvn-25_part-4', 'campbomb-lc-07', 'LC BTVN 25 · Part 4', 'homework', 4, null, 5),
('ca_lc_btvn-26_part-4', 'campbomb-lc-07', 'LC BTVN 26 · Part 4', 'homework', 4, null, 6),
('ca_lc_btvn-27_part-4', 'campbomb-lc-07', 'LC BTVN 27 · Part 4', 'homework', 4, null, 7),
('ca_lc_btvn-29_part-4', 'campbomb-lc-07', 'LC BTVN 29 · Part 4', 'homework', 4, null, 8),
('ca_lc_btvn-31_part-4', 'campbomb-lc-07', 'LC BTVN 31 · Part 4', 'homework', 4, null, 9),
('ca_lc_btvn-33_part-4', 'campbomb-lc-07', 'LC BTVN 33 · Part 4', 'homework', 4, null, 10),
('ca_lc_btvn-30', 'campbomb-lc-07', 'LC BTVN 30', 'homework', 4, null, 11),
('ca_lesson-8_lc', 'campbomb-lc-08', 'Lesson 8 LC', 'lesson', null, null, 1),
('ca_btvn-08', 'campbomb-lc-08', 'BTVN 08 LC', 'homework', null, null, 2),
('ca_btvn-09', 'campbomb-lc-08', 'BTVN 09 LC', 'homework', null, null, 3),
('sub_lesson-1_part-1', 'submarine-lc-01', 'Lesson 1 · Part 1', 'lesson', 1, null, 1),
('sub_btvn-01_part-1', 'submarine-lc-01', 'BTVN 01 · Part 1', 'homework', 1, null, 2),
('sub_lesson-2_part-1', 'submarine-lc-02', 'Lesson 2 · Part 1', 'lesson', 1, null, 1),
('sub_btvn-02_part-1', 'submarine-lc-02', 'BTVN 02 · Part 1', 'homework', 1, null, 2),
('su_lesson-3_part-3', 'submarine-lc-03', 'Lesson 3 · Part 3', 'lesson', 3, null, 1),
('sub_btvn-03', 'submarine-lc-03', 'BTVN 03', 'homework', null, null, 2),
('su_lesson-4_part-3', 'submarine-lc-04', 'Lesson 4 · Part 3', 'lesson', 3, null, 1),
('sub_btvn-04', 'submarine-lc-04', 'BTVN 04', 'homework', null, null, 2),
('su_lesson-5_part-3', 'submarine-lc-05', 'Lesson 5 · Part 3', 'lesson', 3, null, 1),
('sub_btvn-05', 'submarine-lc-05', 'BTVN 05', 'homework', null, null, 2),
('su_lesson-6_part-4', 'submarine-lc-06', 'Lesson 6 · Part 4', 'lesson', 4, null, 1),
('sub_btvn-06', 'submarine-lc-06', 'BTVN 06', 'homework', null, null, 2),
('su_lesson-7_part-4', 'submarine-lc-07', 'Lesson 7 · Part 4', 'lesson', 4, null, 1),
('sub_btvn-07', 'submarine-lc-07', 'BTVN 07', 'homework', null, null, 2),
('su_lesson-8_part-4', 'submarine-lc-08', 'Lesson 8 · Part 4', 'lesson', 4, null, 1),
('sub_btvn-08', 'submarine-lc-08', 'BTVN 08', 'homework', null, null, 2),
('sub_btvn-09', 'submarine-lc-08', 'BTVN 09', 'homework', null, null, 3),
('su_lc_btvn-10', 'submarine-lc-08', 'LC BTVN 10', 'homework', null, null, 4),
('su_lc_btvn-11', 'submarine-lc-08', 'LC BTVN 11', 'homework', null, null, 5),
('su_lc_btvn-12', 'submarine-lc-08', 'LC BTVN 12', 'homework', null, null, 6),
('su_lc_btvn-13', 'submarine-lc-08', 'LC BTVN 13', 'homework', null, null, 7),
('su_lc_btvn-14', 'submarine-lc-08', 'LC BTVN 14', 'homework', null, null, 8),
('su_lc_btvn-15', 'submarine-lc-08', 'LC BTVN 15', 'homework', null, null, 9),
('su_lc_btvn-17', 'submarine-lc-08', 'LC BTVN 17', 'homework', null, null, 10),
('su_lc_btvn-18', 'submarine-lc-08', 'LC BTVN 18', 'homework', null, null, 11),
('su_lc_btvn-19', 'submarine-lc-08', 'LC BTVN 19', 'homework', null, null, 12),
('su_lc_btvn-21', 'submarine-lc-08', 'LC BTVN 21', 'homework', null, null, 13),
('su_lc_btvn-22', 'submarine-lc-08', 'LC BTVN 22', 'homework', null, null, 14),
('su_lc_btvn-23', 'submarine-lc-08', 'LC BTVN 23', 'homework', null, null, 15),
('su_lc_btvn-25', 'submarine-lc-08', 'LC BTVN 25', 'homework', null, null, 16),
('su_lc_btvn-26', 'submarine-lc-08', 'LC BTVN 26', 'homework', null, null, 17),
('su_lc_btvn-27', 'submarine-lc-08', 'LC BTVN 27', 'homework', null, null, 18),
('su_lc_btvn-29', 'submarine-lc-08', 'LC BTVN 29', 'homework', null, null, 19),
('su_lc_btvn-30', 'submarine-lc-08', 'LC BTVN 30', 'homework', null, null, 20),
('su_lc_btvn-31', 'submarine-lc-08', 'LC BTVN 31', 'homework', null, null, 21),
('su_lc_btvn-33', 'submarine-lc-08', 'LC BTVN 33', 'homework', null, null, 22),
('ca_lesson-3_rc-2_thuc-hanh-p5', 'campbomb-rc-02', 'RC 2 · Thực hành P5', 'lesson', 5, 20, 1),
('ca_lesson-4_rc-3_thuc-hanh-p5', 'campbomb-rc-03', 'RC 3 · Thực hành P5', 'lesson', 5, null, 1),
('ca_lesson-6_rc-4_thuc-hanh-p5', 'campbomb-rc-04', 'RC 4 · Thực hành P5', 'lesson', 5, null, 1),
('ca_lesson-7_rc-5_thuc-hanh-p5', 'campbomb-rc-05', 'RC 5 · Thực hành P5', 'lesson', 5, null, 1),
('ca_lesson-9_rc-6_thuc-hanh-p5', 'campbomb-rc-06', 'RC 6 · Thực hành P5', 'lesson', 5, null, 1),
('ca_lesson-10_rc-7_thuc-hanh-p5', 'campbomb-rc-07', 'RC 7 · Thực hành P5', 'lesson', 5, 19, 1),
('ca_btvn-15_rc_thuc-hanh-p5', 'campbomb-rc-07', 'BTVN 15 · RC P5', 'homework', 5, null, 2),
('ca_btvn-30_rc_thuc-hanh-p5', 'campbomb-rc-07', 'BTVN 30 · RC P5', 'homework', 5, null, 3),
('ca_btvn-34_rc_thuc-hanh-p5', 'campbomb-rc-07', 'BTVN 34 · RC P5', 'homework', 5, null, 4),
('ca_lesson-12_rc-8_thuc-hanh-p5', 'campbomb-rc-08', 'RC 8 · Thực hành P5', 'lesson', 5, null, 1),
('ca_btvn-17_rc_thuc-hanh-p6-test-1', 'campbomb-rc-08', 'BTVN 17 · RC P6 · Test 1', 'homework', 6, null, 2),
('ca_btvn-17_rc_thuc-hanh-p6-test-2', 'campbomb-rc-08', 'BTVN 17 · RC P6 · Test 2', 'homework', 6, null, 3),
('ca_btvn-18_rc_thuc-hanh-p6-test-1', 'campbomb-rc-08', 'BTVN 18 · RC P6 · Test 1', 'homework', 6, null, 4),
('ca_btvn-18_rc_thuc-hanh-p6-test-2', 'campbomb-rc-08', 'BTVN 18 · RC P6 · Test 2', 'homework', 6, null, 5),
('ca_btvn-30_rc_thuc-hanh-p6', 'campbomb-rc-08', 'BTVN 30 · RC P6', 'homework', 6, null, 6),
('ca_btvn-34_rc_thuc-hanh-p6', 'campbomb-rc-08', 'BTVN 34 · RC P6', 'homework', 6, null, 7),
('ca_lesson-13_rc-9_thuc-hanh-p6', 'campbomb-rc-09', 'RC 9 · Thực hành P6', 'lesson', 6, null, 1),
('ca_lesson-15_rc-10-_-thuc-hanh-p7', 'campbomb-rc-10', 'RC 10 · Thực hành P7', 'lesson', 7, null, 1),
('ca_lesson-16_rc-11_-thuc-hanh-p7', 'campbomb-rc-11', 'RC 11 · Thực hành P7', 'lesson', 7, null, 1),
('ca_lesson-18_rc-12_thuc-hanh-p7', 'campbomb-rc-12', 'RC 12 · Thực hành P7', 'lesson', 7, null, 1),
('ca_btvn-19_rc_thuc-hanh-p7', 'campbomb-rc-12', 'BTVN 19 · RC P7', 'homework', 7, null, 2),
('ca_btvn-21_rc_thuc-hanh-p7', 'campbomb-rc-12', 'BTVN 21 · RC P7', 'homework', 7, null, 3),
('ca_btvn-22_rc_thuc-hanh-p7', 'campbomb-rc-12', 'BTVN 22 · RC P7', 'homework', 7, null, 4),
('ca_btvn-23_rc_thuc-hanh-p7', 'campbomb-rc-12', 'BTVN 23 · RC P7', 'homework', 7, null, 5),
('ca_btvn-25_rc_thuc-hanh-p7', 'campbomb-rc-12', 'BTVN 25 · RC P7', 'homework', 7, null, 6),
('ca_btvn-26_rc_thuc-hanh-p7', 'campbomb-rc-12', 'BTVN 26 · RC P7', 'homework', 7, null, 7),
('ca_btvn-27_rc_thuc-hanh-p7', 'campbomb-rc-12', 'BTVN 27 · RC P7', 'homework', 7, null, 8),
('ca_btvn-29_rc_thuc-hanh-p7', 'campbomb-rc-12', 'BTVN 29 · RC P7', 'homework', 7, null, 9),
('ca_btvn-31_rc_thuc-hanh-p7', 'campbomb-rc-12', 'BTVN 31 · RC P7', 'homework', 7, null, 10),
('ca_btvn-33_rc_thuc-hanh-p7', 'campbomb-rc-12', 'BTVN 33 · RC P7', 'homework', 7, null, 11),
('ca_lesson-21_rc-13_thuc-hanh-p5', 'campbomb-rc-13', 'RC 13 · P5', 'lesson', 5, null, 1),
('ca_lesson-21_rc-13_thuc-hanh-p6', 'campbomb-rc-13', 'RC 13 · P6', 'lesson', 6, null, 2),
('ca_lesson-22_rc-14_thuc-hanh-p7', 'campbomb-rc-14', 'RC 14 · P7', 'lesson', 7, null, 1),
('ca_lesson-24_rc-15_thuc-hanh-p7', 'campbomb-rc-15', 'RC 15 · P7', 'lesson', 7, null, 1),
('ca_lesson-25_rc-16_thuc-hanh-p5', 'campbomb-rc-16', 'RC 16 · P5', 'lesson', 5, null, 1),
('ca_lesson-25_rc-16_thuc-hanh-p6', 'campbomb-rc-16', 'RC 16 · P6', 'lesson', 6, null, 2),
('su_lesson-1_rc-1_thuc-hanh-p5', 'submarine-rc-01', 'RC 1 · Thực hành P5', 'lesson', 5, null, 1),
('su_lesson-3_rc-2_thuc-hanh-p5', 'submarine-rc-02', 'RC 2 · Thực hành P5', 'lesson', 5, null, 1),
('su_lesson-4_rc-3_thuc-hanh-p5', 'submarine-rc-03', 'RC 3 · Thực hành P5', 'lesson', 5, null, 1),
('su_lesson-6_rc-4_thuc-hanh-p5', 'submarine-rc-04', 'RC 4 · Thực hành P5', 'lesson', 5, null, 1),
('su_lesson-7_rc-5_thuc-hanh-p5', 'submarine-rc-05', 'RC 5 · Thực hành P5', 'lesson', 5, null, 1),
('su_lesson-9_rc-6_thuc-hanh-p5', 'submarine-rc-06', 'RC 6 · Thực hành P5', 'lesson', 5, null, 1),
('su_btvn-04_rc_thuc-hanh-p5', 'submarine-rc-06', 'BTVN 04 · RC P5', 'homework', 5, null, 2),
('su_btvn-09_rc_thuc-hanh-p5', 'submarine-rc-06', 'BTVN 09 · RC P5', 'homework', 5, null, 3),
('su_btvn-26_rc_thuc-hanh-p5', 'submarine-rc-06', 'BTVN 26 · RC P5', 'homework', 5, null, 4),
('su_btvn-30_rc_thuc-hanh-p5', 'submarine-rc-06', 'BTVN 30 · RC P5', 'homework', 5, null, 5),
('su_btvn-34_rc_thuc-hanh-p5', 'submarine-rc-06', 'BTVN 34 · RC P5', 'homework', 5, null, 6),
('su_lesson-10_rc-7_thuc-hanh-p6_test-1', 'submarine-rc-07', 'RC 7 · P6 · Test 1', 'lesson', 6, null, 1),
('su_lesson-10_rc-7_thuc-hanh-p6_test-2', 'submarine-rc-07', 'RC 7 · P6 · Test 2', 'lesson', 6, null, 2),
('su_btvn-13_rc_thuc-hanh-p6_test-3', 'submarine-rc-07', 'BTVN 13 · RC P6 · Test 3', 'homework', 6, null, 3),
('su_btvn-13_rc_thuc-hanh-p6_test-4', 'submarine-rc-07', 'BTVN 13 · RC P6 · Test 4', 'homework', 6, null, 4),
('su_btvn-14_rc_thuc-hanh-p6_test-5', 'submarine-rc-07', 'BTVN 14 · RC P6 · Test 5', 'homework', 6, null, 5),
('su_btvn-14_rc_thuc-hanh-p6_test-6', 'submarine-rc-07', 'BTVN 14 · RC P6 · Test 6', 'homework', 6, null, 6),
('su_btvn-26_rc_thuc-hanh-p6', 'submarine-rc-07', 'BTVN 26 · RC P6', 'homework', 6, null, 7),
('su_btvn-30_rc_thuc-hanh-p6', 'submarine-rc-07', 'BTVN 30 · RC P6', 'homework', 6, null, 8),
('su_lesson-12_rc-8_thuc-hanh-p7', 'submarine-rc-08', 'RC 8 · Thực hành P7', 'lesson', 7, null, 1),
('su_lesson-13_rc-9_thuc-hanh-p7', 'submarine-rc-09', 'RC 9 · Thực hành P7', 'lesson', 7, null, 1),
('su_lesson-15_rc-10_thuc-hanh-p7', 'submarine-rc-10', 'RC 10 · Thực hành P7', 'lesson', 7, null, 1),
('su_btvn-15_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 15 · RC P7', 'homework', 7, null, 2),
('su_btvn-17_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 17 · RC P7', 'homework', 7, null, 3),
('su_btvn-18_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 18 · RC P7', 'homework', 7, null, 4),
('su_btvn-19_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 19 · RC P7', 'homework', 7, null, 5),
('su_btvn-21_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 21 · RC P7', 'homework', 7, null, 6),
('su_btvn-22_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 22 · RC P7', 'homework', 7, null, 7),
('su_btvn-23_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 23 · RC P7', 'homework', 7, null, 8),
('su_btvn-25_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 25 · RC P7', 'homework', 7, null, 9),
('su_btvn-27_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 27 · RC P7', 'homework', 7, null, 10),
('su_btvn-29_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 29 · RC P7', 'homework', 7, null, 11),
('su_btvn-31_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 31 · RC P7', 'homework', 7, null, 12),
('su_btvn-33_rc_thuc-hanh-p7', 'submarine-rc-10', 'BTVN 33 · RC P7', 'homework', 7, null, 13),
('su_lesson-18-_rc-11_thuc-hanh-part-5', 'submarine-rc-11', 'RC 11 · P5', 'lesson', 5, null, 1),
('su_lesson-18_rc-11_thuc-hanh-part-6', 'submarine-rc-11', 'RC 11 · P6', 'lesson', 6, null, 2),
('su_lesson-19_rc-12_thuc-hanh-part-7', 'submarine-rc-12', 'RC 12 · P7', 'lesson', 7, null, 1),
('su_lesson-21_rc-13_thuc-hanh-part-7', 'submarine-rc-13', 'RC 13 · P7', 'lesson', 7, null, 1),
('su_lesson-22-_-rc-14-_-thuc-hanh-part-5', 'submarine-rc-14', 'RC 14 · P5', 'lesson', 5, null, 1),
('su_lesson-22-_-rc-14-_-thuc-hanh-part-6', 'submarine-rc-14', 'RC 14 · P6', 'lesson', 6, null, 2),
('su_lesson-24_rc-15_thuc-hanh-p7', 'submarine-rc-15', 'RC 15 · P7', 'lesson', 7, null, 1)
on conflict (slug) do update set
  lesson_id = excluded.lesson_id, title = excluded.title, kind = excluded.kind,
  part = excluded.part, question_count = excluded.question_count, sort_order = excluded.sort_order;
