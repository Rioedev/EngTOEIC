# EngTOEIC — Product Requirements & Roadmap

> Tài liệu ghi nhớ dài hạn cho định hướng sản phẩm, phạm vi chức năng và thứ tự phát triển EngTOEIC.
>
> Cập nhật gần nhất: 2026-07-22.

## 1. Cách sử dụng tài liệu

Tài liệu này là nguồn tham chiếu chung khi thiết kế database, API và giao diện.

Quy ước trạng thái:

- `[x]`: đã có nền tảng hoặc đã hoàn thành.
- `[ ]`: chưa triển khai.
- `P0`: bắt buộc cho MVP.
- `P1`: cần có ngay sau MVP.
- `P2`: mở rộng sản phẩm.
- `P3`: ý tưởng dài hạn.

Khi hoàn thành một chức năng:

1. Đánh dấu checkbox.
2. Ghi đường dẫn route, component hoặc API liên quan.
3. Cập nhật phần “Nhật ký quyết định”.
4. Không xóa ý tưởng cũ; chuyển sang mục “Không làm/Hoãn” và ghi lý do.

## 2. Tầm nhìn sản phẩm

EngTOEIC là nền tảng tự học TOEIC tập trung vào hai trải nghiệm chính:

1. Học từ vựng chủ động theo hướng Quizlet: bộ thẻ, flashcard, Learn thích ứng, Spell, Test, Match và spaced repetition.
2. Luyện đề theo hướng Study4: thư viện đề, chọn Part, full test, audio, timer, autosave, answer sheet, chấm điểm và phân tích chi tiết.

Sản phẩm lấy cảm hứng từ luồng sử dụng của các nền tảng trên nhưng không sao chép giao diện, nội dung, thương hiệu hoặc tài sản độc quyền.

### Nguyên tắc sản phẩm

- Học ngắn nhưng đều mỗi ngày.
- Mỗi câu sai phải tạo ra một hành động ôn tập tiếp theo.
- Từ vựng và luyện đề phải liên thông.
- Tiến độ phải được lưu tự động.
- Giao diện thân thiện, ít áp lực và hoạt động tốt trên mobile.
- Giải thích đáp án quan trọng hơn việc chỉ hiển thị đúng/sai.
- Nội dung đề thi phải có nguồn và quyền sử dụng hợp lệ.

## 3. Hiện trạng dự án

### Đã có

- [x] Monorepo Next.js + NestJS + shared package.
- [x] Prisma và cấu hình PostgreSQL/Supabase.
- [x] Các model cơ bản: `User`, `Lesson`, `Question`, `TestAttempt`, `AttemptAnswer`.
- [x] Enum TOEIC Listening, Reading và Part 1–7.
- [x] API lấy danh sách và chi tiết bài học.
- [x] Practice demo dùng Zustand để chọn và nộp đáp án.
- [x] Trang chủ, theme màu, glass effect và responsive cơ bản.
- [x] Hình nền thay đổi theo sáng, chiều và tối.
- [x] Logo sư tử chibi và favicon.
- [x] Tách cache `.next-dev` và `.next` để dev/build không xung đột.
- [x] Nền dữ liệu Vocabulary MVP, seed 20 từ và API read-only — `apps/api/prisma/schema.prisma`, `GET /vocabulary-sets`, `GET /vocabulary-sets/:slug`.
- [x] Thư viện và chi tiết bộ từ responsive — `/vocabulary`, `/vocabulary/[setSlug]`.

### Chưa có

- [ ] Authentication thực tế.
- [ ] Hệ thống bộ từ vựng.
- [ ] Practice engine lấy dữ liệu thật từ API.
- [ ] Thư viện đề và cấu trúc một đề thi hoàn chỉnh.
- [ ] Lưu tiến độ học theo tài khoản.
- [ ] Admin quản lý nội dung.
- [ ] Chấm điểm TOEIC và báo cáo thống kê.

## 4. Vai trò người dùng

### Học viên

- Học từ vựng, làm bài, thi thử và xem tiến độ.
- Tạo bộ từ cá nhân, bookmark và ghi chú.

### Biên tập viên

- Tạo bài học, bộ từ, câu hỏi, transcript và lời giải.
- Upload hình ảnh/audio và gửi nội dung chờ duyệt.

### Quản trị viên

- Duyệt/xuất bản nội dung.
- Quản lý người dùng, phân quyền và báo cáo lỗi.
- Theo dõi thống kê hệ thống.

### Giáo viên — giai đoạn mở rộng

- Tạo lớp, giao bài và theo dõi tiến độ học viên.

## 5. Module tài khoản

### P0 — MVP

- [x] `AUTH-001` Đăng ký bằng email/mật khẩu qua Supabase Auth — `/login`.
- [x] `AUTH-002` Đăng nhập/đăng xuất bằng email/mật khẩu — `/login`, `POST /auth/signout`.
- [x] `AUTH-003` Đăng nhập Google qua Supabase Auth — đã có luồng `/auth/callback`, UI tạm ẩn cho tới khi provider được cấu hình.
- [ ] `AUTH-004` Quên và đặt lại mật khẩu.
- [x] `AUTH-005` Đồng bộ Supabase user với bảng `User` — `POST /auth/sync`.
- [ ] `AUTH-006` Bảo vệ route yêu cầu đăng nhập.

### P1

- [ ] `AUTH-101` Hồ sơ cá nhân và avatar.
- [ ] `AUTH-102` Mục tiêu điểm TOEIC.
- [ ] `AUTH-103` Ngày thi dự kiến.
- [ ] `AUTH-104` Mục tiêu số phút học mỗi ngày.
- [ ] `AUTH-105` Cài đặt ngôn ngữ, audio và accessibility.

## 6. Module từ vựng kiểu Quizlet

Tham khảo trải nghiệm: [Quizlet Study Modes](https://quizlet.com/en-gb/features/study-modes) và [Quizlet Learn](https://quizlet.com/features/learn).

### 6.1. Thư viện bộ từ

#### P0

- [x] `VOC-001` Danh sách bộ từ hệ thống — `/vocabulary`.
- [x] `VOC-002` Tìm kiếm theo tên/chủ đề — `/vocabulary?search=...`.
- [x] `VOC-003` Trang chi tiết bộ từ — `/vocabulary/[setSlug]`.
- [ ] `VOC-004` Hiển thị số từ và tiến độ thành thạo.
- [ ] `VOC-005` Bộ từ theo chủ đề TOEIC và Part.
- [ ] `VOC-006` Lưu bộ từ vào thư viện cá nhân.

#### P1

- [ ] `VOC-101` Tạo/sửa/xóa bộ từ cá nhân.
- [ ] `VOC-102` Public/private/unlisted.
- [ ] `VOC-103` Folder phân loại bộ từ.
- [ ] `VOC-104` Sao chép bộ từ công khai.
- [ ] `VOC-105` Import CSV/Excel hoặc dán danh sách từ.
- [ ] `VOC-106` Export bộ từ cá nhân.
- [ ] `VOC-107` Chia sẻ bằng URL.

### 6.2. Dữ liệu một từ

- [ ] `TERM-001` Từ/cụm từ tiếng Anh.
- [ ] `TERM-002` Nghĩa tiếng Việt.
- [ ] `TERM-003` Phiên âm IPA.
- [ ] `TERM-004` Loại từ.
- [ ] `TERM-005` Audio phát âm.
- [ ] `TERM-006` Ví dụ tiếng Anh và bản dịch.
- [ ] `TERM-007` Hình ảnh minh họa tùy chọn.
- [ ] `TERM-008` Collocation, synonym và antonym.
- [ ] `TERM-009` Tag chủ đề, Part và độ khó.
- [ ] `TERM-010` Ghi chú cá nhân.

### 6.3. Flashcard

#### P0

- [x] `FLASH-001` Lật thẻ term/definition — `/vocabulary/[setSlug]/flashcards`.
- [x] `FLASH-002` Điều hướng bằng nút, swipe và bàn phím — `FlashcardPlayer`.
- [x] `FLASH-003` Phát audio thủ công/tự động — ưu tiên `audioUrl`, fallback Web Speech API.
- [x] `FLASH-004` Đánh dấu “Đã biết” và “Chưa nhớ” trong phiên hiện tại.
- [x] `FLASH-005` Shuffle.
- [x] `FLASH-006` Học Anh → Việt hoặc Việt → Anh.
- [x] `FLASH-007` Lưu vị trí và tiến độ phiên học — lưu `currentTermId`/`currentIndex` theo tài khoản, cho phép tiếp tục hoặc học lại từ đầu.

#### P1

- [ ] `FLASH-101` Autoplay.
- [ ] `FLASH-102` Chỉ học từ starred/chưa nhớ.
- [ ] `FLASH-103` Fullscreen và phím tắt.
- [ ] `FLASH-104` Chế độ xem danh sách toàn bộ từ.

### 6.4. Learn thích ứng

#### P1

- [x] `LEARN-001` Trộn multiple choice, write, listen và true/false — `/vocabulary/[setSlug]/learn`.
- [x] `LEARN-002` Từ sai xuất hiện thường xuyên hơn — đưa lại vào hàng đợi sau hai câu.
- [x] `LEARN-003` Mục tiêu học 10/20/toàn bộ từ.
- [x] `LEARN-004` Trạng thái `NEW`, `LEARNING`, `FAMILIAR`, `MASTERED` — API tự thăng/hạ cấp theo kết quả.
- [x] `LEARN-005` Progress checkpoint — tự lưu hàng đợi, vị trí, điểm và từ sai; cho phép tiếp tục hoặc bỏ phiên Learn trong 7 ngày.
- [x] `LEARN-006` Yêu cầu gõ lại câu đúng sau khi trả lời sai.
- [x] `LEARN-007` Tăng độ khó từ nhận diện sang chủ động nhớ theo trạng thái từng từ.
- [x] `LEARN-008` Tách chế độ luyện riêng: Learn tổng hợp, Nghe & viết, Trắc nghiệm, Viết từ và Đúng/Sai.
- [x] `LEARN-009` Ghép thẻ theo vòng 6 cặp, ưu tiên nhóm từ mới ở vòng tiếp theo, chấm lượt ghép và đồng bộ từ hoàn thành.

### 6.5. Spaced repetition

#### P1

- [ ] `SRS-001` Lịch ôn theo từng từ và từng người dùng.
- [ ] `SRS-002` Rating: Again, Hard, Good, Easy.
- [ ] `SRS-003` Hàng đợi “Cần ôn hôm nay”.
- [ ] `SRS-004` Cập nhật interval, ease và nextReviewAt.
- [ ] `SRS-005` Thống kê retention và số từ đến hạn.
- [ ] `SRS-006` Chống cộng tiến độ sai khi học lặp liên tục.

### 6.6. Các chế độ luyện từ

- [ ] `VMODE-001` Write: nhìn nghĩa và nhập từ.
- [ ] `VMODE-002` Spell: nghe audio và nhập từ.
- [ ] `VMODE-003` Test: tạo bài kiểm tra từ bộ thẻ.
- [ ] `VMODE-004` Match: ghép term với definition theo thời gian.
- [ ] `VMODE-005` Multiple choice.
- [ ] `VMODE-006` True/False.
- [ ] `VMODE-007` Bảng thành tích Match cá nhân.

## 7. Module luyện đề kiểu Study4

Tham khảo trải nghiệm: [Thư viện đề TOEIC Study4](https://study4.com/tests/toeic/) và [các công cụ luyện đề Study4](https://study4.com/posts/1078/top-cac-websites-thi-thu-toeic-online-mien-phi/).

### 7.1. Thư viện đề

#### P0

- [ ] `EXAM-001` Danh sách đề thi.
- [ ] `EXAM-002` Tìm kiếm theo tên đề.
- [ ] `EXAM-003` Lọc theo bộ đề, năm, kỹ năng và Part.
- [ ] `EXAM-004` Hiển thị thời gian, số câu và số Part.
- [ ] `EXAM-005` Trang chi tiết đề.
- [ ] `EXAM-006` Đề đang làm dở và đề đã hoàn thành.

#### P1

- [ ] `EXAM-101` Lượt làm và điểm trung bình.
- [ ] `EXAM-102` Yêu thích đề.
- [ ] `EXAM-103` Đề được đề xuất theo điểm yếu.
- [ ] `EXAM-104` Tag nguồn, năm, format và độ khó.

### 7.2. Thiết lập phiên làm bài

- [ ] `SETUP-001` Full test 200 câu/120 phút.
- [ ] `SETUP-002` Chỉ Listening hoặc Reading.
- [ ] `SETUP-003` Chọn một hoặc nhiều Part.
- [ ] `SETUP-004` Chọn nhóm câu cụ thể.
- [ ] `SETUP-005` Chế độ luyện tập không giới hạn giờ.
- [ ] `SETUP-006` Chế độ thi thử có timer.
- [ ] `SETUP-007` Xáo trộn câu cho practice tùy chọn.

### 7.3. Test runner

#### P0

- [ ] `RUNNER-001` Render câu hỏi Part 1–7 đúng cấu trúc.
- [ ] `RUNNER-002` Chọn và thay đổi đáp án.
- [ ] `RUNNER-003` Previous/Next question.
- [ ] `RUNNER-004` Answer sheet theo số câu.
- [ ] `RUNNER-005` Timer.
- [ ] `RUNNER-006` Autosave local và server.
- [ ] `RUNNER-007` Khôi phục attempt khi refresh.
- [ ] `RUNNER-008` Nộp bài thủ công và tự động khi hết giờ.
- [ ] `RUNNER-009` Xác nhận trước khi nộp nếu còn câu trống.

#### Listening

- [ ] `LISTEN-001` Audio player cố định.
- [ ] `LISTEN-002` Play/pause và trạng thái loading/error.
- [ ] `LISTEN-003` Tốc độ 0.75×, 1×, 1.25×, 1.5× trong practice.
- [ ] `LISTEN-004` Quy tắc chỉ phát một lần trong mock-test nghiêm túc.
- [ ] `LISTEN-005` Hình ảnh cho Part 1.
- [ ] `LISTEN-006` Nhóm 3 câu cho Part 3–4.

#### Reading

- [ ] `READ-001` Part 5 câu đơn.
- [ ] `READ-002` Part 6 đoạn văn có nhiều chỗ trống.
- [ ] `READ-003` Part 7 single/double/triple passage.
- [ ] `READ-004` Layout chia đôi passage và câu hỏi.
- [ ] `READ-005` Zoom hình ảnh/tài liệu.

#### P1

- [ ] `RUNNER-101` Đánh dấu câu cần xem lại.
- [ ] `RUNNER-102` Highlight passage nhiều màu.
- [ ] `RUNNER-103` Ghi chú cá nhân.
- [ ] `RUNNER-104` Phím tắt A/B/C/D và điều hướng.
- [ ] `RUNNER-105` Cảnh báo mất kết nối và đồng bộ lại.

### 7.4. Chấm điểm và kết quả

#### P0

- [ ] `RESULT-001` Số câu đúng/sai/bỏ trống.
- [ ] `RESULT-002` Điểm Listening và Reading ước tính.
- [ ] `RESULT-003` Tổng điểm TOEIC ước tính.
- [ ] `RESULT-004` Độ chính xác từng Part.
- [ ] `RESULT-005` Thời gian hoàn thành.
- [ ] `RESULT-006` Review từng câu.
- [ ] `RESULT-007` Đáp án đúng và lời giải.
- [ ] `RESULT-008` Transcript sau khi nộp.

#### P1

- [ ] `RESULT-101` Thời gian làm từng câu/Part.
- [ ] `RESULT-102` So sánh với lần làm trước.
- [ ] `RESULT-103` Biểu đồ điểm mạnh/yếu.
- [ ] `RESULT-104` Làm lại chỉ các câu sai.
- [ ] `RESULT-105` Báo lỗi nội dung.
- [ ] `RESULT-106` Chia sẻ ảnh kết quả không lộ đáp án.

## 8. Liên kết từ vựng và luyện đề

Đây là luồng khác biệt quan trọng của EngTOEIC.

- [ ] `BRIDGE-001` Bôi đen từ trong passage để tra nghĩa.
- [ ] `BRIDGE-002` Thêm từ từ passage/transcript vào bộ thẻ.
- [ ] `BRIDGE-003` Tự tạo bộ “Từ sai trong [Tên đề]”.
- [ ] `BRIDGE-004` Gắn nguồn câu hỏi vào từ đã lưu.
- [ ] `BRIDGE-005` Ưu tiên ôn từ liên quan đến câu làm sai.
- [ ] `BRIDGE-006` Từ đã mastered giảm tần suất trong Learn.
- [ ] `BRIDGE-007` Từ điển mini không làm rời màn hình làm đề.

## 9. Bài học bổ trợ

### Ngữ pháp

- [ ] `GRAM-001` Bài học theo chủ đề ngữ pháp TOEIC.
- [ ] `GRAM-002` Ví dụ và lỗi thường gặp.
- [ ] `GRAM-003` Bài luyện ngắn sau mỗi bài.
- [ ] `GRAM-004` Liên kết câu sai Part 5–6 với bài ngữ pháp.

### Phát âm và Shadowing

- [ ] `SPEAK-001` Thu âm microphone.
- [ ] `SPEAK-002` Nghe lại bản ghi.
- [ ] `SPEAK-003` Shadowing theo từng câu.
- [ ] `SPEAK-004` Hiển thị transcript đồng bộ audio.
- [ ] `SPEAK-005` So sánh waveform cơ bản.
- [ ] `SPEAK-006` AI đánh giá phát âm, trọng âm và độ trôi chảy — P2.

### Dictation và video

- [ ] `DICT-001` Nghe và điền từ còn thiếu.
- [ ] `DICT-002` Kiểm tra từng câu.
- [ ] `VIDEO-001` Video bài giảng.
- [ ] `VIDEO-002` Ghi nhớ vị trí đã xem.
- [ ] `VIDEO-003` Quiz trong hoặc sau video.

## 10. Dashboard và phân tích

### P0

- [ ] `DASH-001` Tiếp tục bài gần nhất.
- [ ] `DASH-002` Số phút học hôm nay.
- [ ] `DASH-003` Tiến độ Listening/Reading.
- [ ] `DASH-004` Lịch sử practice/test.
- [ ] `DASH-005` Từ cần ôn hôm nay.

### P1

- [ ] `ANALYTICS-001` Độ chính xác theo Part.
- [ ] `ANALYTICS-002` Chủ đề thường sai.
- [ ] `ANALYTICS-003` Biểu đồ điểm theo tuần/tháng.
- [ ] `ANALYTICS-004` Ước tính trình độ hiện tại.
- [ ] `ANALYTICS-005` Gợi ý bài học tiếp theo.
- [ ] `ANALYTICS-006` Thời gian học và mức độ duy trì.

## 11. Sổ lỗi sai và bookmark

- [ ] `ERROR-001` Tự lưu câu sai.
- [ ] `ERROR-002` Phân loại theo Part/chủ đề/ngữ pháp.
- [ ] `ERROR-003` Ghi chú nguyên nhân sai.
- [ ] `ERROR-004` Làm lại theo lịch spaced repetition.
- [ ] `ERROR-005` Đánh dấu đã hiểu.
- [ ] `BOOKMARK-001` Bookmark câu hỏi, bài học và đề thi.

## 12. Gamification

### P1

- [ ] `GAME-001` XP theo hoạt động hợp lệ.
- [ ] `GAME-002` Level.
- [ ] `GAME-003` Streak theo ngày.
- [ ] `GAME-004` Nhiệm vụ hằng ngày.
- [ ] `GAME-005` Huy hiệu thành tích.
- [ ] `GAME-006` Thử thách tuần.

### P2

- [ ] `GAME-101` Leaderboard bạn bè/lớp học.
- [ ] `GAME-102` Mở khóa theme, lofi và background.
- [ ] `GAME-103` Match high score.
- [ ] `GAME-104` Chống gian lận XP.

## 13. Công cụ hỗ trợ học

- [ ] `TOOL-001` Pomodoro có lưu phiên học.
- [ ] `TOOL-002` Lofi và âm thanh môi trường.
- [ ] `TOOL-003` Lịch học.
- [ ] `TOOL-004` Nhắc học qua email/push.
- [ ] `TOOL-005` Ghi chú cá nhân.
- [ ] `TOOL-006` Tìm kiếm toàn hệ thống.
- [x] `TOOL-007` Theme màu và chất liệu glass.
- [x] `TOOL-008` Background sáng/chiều/tối.
- [ ] `TOOL-009` Dark/light theo hệ điều hành.
- [ ] `TOOL-010` Chế độ tập trung ẩn gamification.

## 14. Cộng đồng và lớp học — chức năng ngoài lề

### P2

- [ ] `SOCIAL-001` Theo dõi bạn học.
- [ ] `SOCIAL-002` Chia sẻ bộ từ.
- [ ] `SOCIAL-003` Bình luận bộ từ/bài học có kiểm duyệt.
- [ ] `SOCIAL-004` Nhóm học tập.
- [ ] `CLASS-001` Giáo viên tạo lớp.
- [ ] `CLASS-002` Học viên tham gia bằng link/code.
- [ ] `CLASS-003` Giao bộ từ, bài luyện hoặc đề thi.
- [ ] `CLASS-004` Deadline và nhắc bài.
- [ ] `CLASS-005` Báo cáo tiến độ lớp/học viên.

## 15. Trợ lý AI — chức năng dài hạn

### P2–P3

- [ ] `AI-001` Giải thích vì sao từng lựa chọn sai.
- [ ] `AI-002` Tạo ví dụ mới cho từ vựng.
- [ ] `AI-003` Tạo quiz từ bộ từ cá nhân.
- [ ] `AI-004` Phân tích mẫu lỗi của học viên.
- [ ] `AI-005` Đề xuất lịch học theo mục tiêu điểm/ngày thi.
- [ ] `AI-006` Chat tutor chỉ dựa trên nội dung đã duyệt.
- [ ] `AI-007` Chấm phát âm.
- [ ] `AI-008` OCR/import từ ảnh hoặc PDF do người dùng sở hữu.

Yêu cầu AI:

- Không tự khẳng định đáp án nếu thiếu dữ liệu.
- Phân biệt nội dung do AI sinh và nội dung đã được biên tập viên duyệt.
- Có giới hạn chi phí, rate limit và logging.
- Không gửi dữ liệu nhạy cảm của người dùng vào prompt.

## 16. Admin và quản trị nội dung

### P0

- [ ] `ADMIN-001` CRUD Lesson.
- [ ] `ADMIN-002` CRUD Question Part 1–7.
- [ ] `ADMIN-003` CRUD Exam và ExamSection.
- [ ] `ADMIN-004` CRUD VocabularySet và VocabularyTerm.
- [ ] `ADMIN-005` Upload audio/image lên Supabase Storage.
- [ ] `ADMIN-006` Draft → Review → Published → Archived.
- [ ] `ADMIN-007` Preview trước khi xuất bản.
- [ ] `ADMIN-008` Phân quyền ADMIN/EDITOR/LEARNER.

### P1

- [ ] `ADMIN-101` Import câu hỏi CSV/Excel/JSON.
- [ ] `ADMIN-102` Bulk edit và duplicate.
- [ ] `ADMIN-103` Quản lý báo lỗi nội dung.
- [ ] `ADMIN-104` Audit log.
- [ ] `ADMIN-105` Dashboard lượt học, lượt làm đề và retention.
- [ ] `ADMIN-106` Kiểm tra câu thiếu audio/transcript/explanation.

## 17. Subscription và vận hành thương mại — tùy chọn

### P2

- [ ] `BILLING-001` Gói Free/Premium.
- [ ] `BILLING-002` Giới hạn hợp lý theo feature, không chặn tiến độ đã lưu.
- [ ] `BILLING-003` Thanh toán và lịch sử giao dịch.
- [ ] `BILLING-004` Coupon/referral.
- [ ] `BILLING-005` Quản lý subscription.

Gợi ý phân chia:

- Free: flashcard, practice giới hạn hợp lý, một số đề miễn phí.
- Premium: Learn/SRS nâng cao, toàn bộ thư viện đề, phân tích sâu, AI pronunciation.

## 18. Mobile, PWA và thông báo — chức năng ngoài lề

- [ ] `PWA-001` Installable PWA.
- [ ] `PWA-002` Offline bộ từ đã tải.
- [ ] `PWA-003` Đồng bộ khi có mạng trở lại.
- [ ] `PWA-004` Push notification từ đến hạn và streak.
- [ ] `PWA-005` Background audio phù hợp quy định trình duyệt.
- [x] `MOBILE-001` Swipe flashcard — `FlashcardPlayer`.
- [ ] `MOBILE-002` Bottom navigation.
- [ ] `MOBILE-003` Test runner tối ưu màn hình nhỏ.

## 19. Mô hình dữ liệu dự kiến

### Vocabulary

- `VocabularySet`
- `VocabularyTerm`
- `VocabularySetTerm`
- `SavedVocabularySet`
- `VocabularyFolder`
- `UserTermProgress`
- `VocabularyStudySession`
- `VocabularyStudyAnswer`

Các trường quan trọng của `UserTermProgress`:

- `userId`
- `termId`
- `status`
- `easeFactor`
- `intervalDays`
- `repetitionCount`
- `lapseCount`
- `lastReviewedAt`
- `nextReviewAt`

### Exam

- `Exam`
- `ExamSection`
- `ExamQuestion`
- `TestAttempt` — mở rộng model hiện tại.
- `AttemptAnswer` — mở rộng model hiện tại.
- `QuestionBookmark`
- `QuestionHighlight`
- `QuestionNote`
- `QuestionReport`

Các trường cần bổ sung cho attempt:

- `mode`: PRACTICE/MOCK_TEST.
- `status`: IN_PROGRESS/SUBMITTED/EXPIRED.
- `startedAt`, `submittedAt`, `expiresAt`.
- `listeningScore`, `readingScore`.
- `currentQuestionId`.
- `settingsJson`.

### Learning analytics

- `DailyLearningStat`
- `LearningEvent`
- `UserAchievement`
- `DailyChallenge`
- `WrongAnswerReview`

Không lưu binary vào PostgreSQL; chỉ lưu URL và metadata của file Supabase Storage.

## 20. Route frontend dự kiến

```text
/
/login
/onboarding
/dashboard

/vocabulary
/vocabulary/[setSlug]
/vocabulary/[setSlug]/flashcards
/vocabulary/[setSlug]/learn
/vocabulary/[setSlug]/write
/vocabulary/[setSlug]/spell
/vocabulary/[setSlug]/test
/vocabulary/[setSlug]/match
/vocabulary/review
/library

/tests
/tests/[examSlug]
/tests/[examSlug]/setup
/attempts/[attemptId]
/attempts/[attemptId]/result
/attempts/[attemptId]/review

/lessons
/lessons/[lessonSlug]
/error-notebook
/analytics
/profile
/settings

/admin
/admin/lessons
/admin/questions
/admin/exams
/admin/vocabulary
/admin/reports
```

## 21. API dự kiến

```text
POST   /auth/sync

GET    /vocabulary-sets
POST   /vocabulary-sets
GET    /vocabulary-sets/:slug
PATCH  /vocabulary-sets/:id
DELETE /vocabulary-sets/:id
POST   /vocabulary-sets/:id/terms
POST   /vocabulary-sets/:id/import
GET    /vocabulary/review-queue
POST   /vocabulary/reviews

GET    /exams
GET    /exams/:slug
POST   /exams/:id/attempts
GET    /attempts/:id
PATCH  /attempts/:id/answers
POST   /attempts/:id/submit
GET    /attempts/:id/result
GET    /attempts/:id/review

POST   /questions/:id/bookmark
POST   /questions/:id/report
POST   /questions/:id/notes

GET    /analytics/overview
GET    /analytics/parts
GET    /analytics/vocabulary
```

Nguyên tắc API:

- Validate DTO ở NestJS.
- Không gửi `correctChoice` cho client trước khi attempt được nộp.
- Chấm điểm ở server.
- Answer autosave phải idempotent.
- Kiểm tra quyền sở hữu attempt/set/note.
- Pagination cho thư viện và admin.

## 22. Yêu cầu phi chức năng

### Bảo mật

- [ ] Supabase JWT validation ở NestJS.
- [ ] RBAC cho admin/editor.
- [ ] Rate limiting.
- [ ] Validate file type/kích thước upload.
- [ ] Không log token hoặc dữ liệu nhạy cảm.
- [ ] Chống truy cập đáp án trước khi nộp bài.

### Hiệu năng

- [ ] Audio/image dùng CDN và cache phù hợp.
- [ ] Lazy load passage/image không nằm trong viewport.
- [ ] Prefetch câu kế tiếp trong test runner.
- [ ] Không tải toàn bộ thư viện đề trong một request.
- [ ] Flashcard tương tác mượt ở mobile phổ thông.

### Accessibility

- [ ] Điều hướng hoàn toàn bằng bàn phím.
- [ ] Focus state rõ ràng.
- [ ] Không chỉ dùng màu để biểu thị đúng/sai.
- [ ] Transcript cho audio sau khi hoàn thành.
- [ ] Tôn trọng `prefers-reduced-motion`.
- [ ] Contrast đạt WCAG AA cho nội dung chính.

### Độ tin cậy

- [ ] Autosave có retry và trạng thái đồng bộ.
- [ ] Backup database.
- [ ] Migration có kiểm thử.
- [ ] Error monitoring.
- [ ] Audit log cho nội dung và quyền admin.

### Testing

- [ ] Unit test thuật toán SRS và quy đổi điểm.
- [ ] API integration test cho attempt/submit.
- [ ] E2E test cho flashcard và test runner.
- [ ] Test khôi phục khi refresh/mất mạng.
- [ ] Visual/responsive test các breakpoint chính.

## 23. Bản quyền và nội dung

- Không tự ý sao chép bộ đề ETS, audio, hình ảnh hoặc lời giải có bản quyền.
- Chỉ sử dụng nội dung tự biên soạn, được cấp phép hoặc thuộc phạm vi cho phép.
- `TOEIC` là nhãn hiệu của ETS; cần tuyên bố sản phẩm không liên kết/chứng thực bởi ETS nếu phù hợp.
- Mỗi `Exam`, `Question`, `AudioAsset` nên có trường nguồn, giấy phép và người biên tập.
- Có quy trình gỡ bỏ nội dung khi nhận khiếu nại.

## 24. Lộ trình phát triển đề xuất

### Milestone 0 — Nền tảng

- Auth và onboarding.
- Chuẩn hóa error handling/API client.
- Admin role tối thiểu.
- Seed dữ liệu demo hợp pháp.

### Milestone 1 — Vocabulary MVP

- VocabularySet/Term schema và API.
- Thư viện bộ từ.
- Flashcard.
- Đã biết/chưa nhớ.
- Lưu tiến độ.

### Milestone 2 — Vocabulary Learn

- Learn modes.
- Write, Spell, Match và Test.
- SRS queue và review history.
- Dashboard từ cần ôn.

### Milestone 3 — Practice engine

- Exam schema.
- Test library và setup.
- Runner Part 1–7.
- Audio, timer, answer sheet và autosave.

### Milestone 4 — Results

- Submit/chấm điểm server.
- Review, explanation và transcript.
- Analytics theo Part.
- Sổ lỗi sai.

### Milestone 5 — Liên thông

- Tra/lưu từ trong passage/transcript.
- Bộ từ tự động theo đề.
- Gợi ý ôn tập từ câu sai.
- Lộ trình theo mục tiêu điểm.

### Milestone 6 — Mở rộng

- Gamification.
- Pomodoro/lofi/schedule.
- Lớp học và giao bài.
- PWA/offline.
- AI pronunciation/tutor.
- Subscription nếu cần.

## 25. Tiêu chí MVP hoàn thành

MVP được xem là hoàn thành khi một người dùng có thể:

1. Đăng nhập.
2. Mở một bộ từ, học flashcard và thấy tiến độ được lưu.
3. Mở một đề TOEIC hợp lệ.
4. Chọn Part hoặc full test.
5. Làm bài có audio/timer và refresh không mất dữ liệu.
6. Nộp bài và nhận kết quả chấm từ server.
7. Xem đáp án, lời giải và transcript.
8. Xem lại lịch sử lần làm.
9. Lưu từ từ bài thi vào bộ flashcard cá nhân.
10. Admin có thể tạo và xuất bản dữ liệu mà không sửa trực tiếp database.

## 26. Việc nên làm tiếp theo

Ưu tiên đề xuất: xây vertical slice cho Vocabulary MVP.

1. [x] Thêm Prisma models `VocabularySet`, `VocabularyTerm`, `SavedVocabularySet`, `UserTermProgress` — `apps/api/prisma/schema.prisma`.
2. [x] Tạo NestJS module và API read-only — `apps/api/src/vocabulary`, `GET /vocabulary-sets`, `GET /vocabulary-sets/:slug`.
3. [x] Seed bộ `toeic-office-basics` gồm 20 từ — `apps/api/prisma/seed.js`.
4. [x] Tạo `/vocabulary` và `/vocabulary/[setSlug]` — responsive, có search, lọc Part và fallback demo.
5. [x] Tạo flashcard mode có keyboard/swipe/audio — `/vocabulary/[setSlug]/flashcards`.
6. [x] Lưu `NEW`/`LEARNING`/`FAMILIAR`/`MASTERED` theo user — `GET /vocabulary-sets/:slug/progress`, `PATCH /vocabulary-sets/:slug/terms/:termId/progress`.
7. [x] Lưu vị trí thẻ hiện tại để tiếp tục phiên học sau khi quay lại — `VocabularyStudySession`, `PATCH /vocabulary-sets/:slug/session`.
8. [ ] Sau khi vertical slice ổn định mới thêm Learn/SRS.

## 27. Nhật ký quyết định

| Ngày       | Quyết định                                                   | Lý do                                                                                                             |
| ---------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 2026-07-15 | Vocabulary lấy cảm hứng từ Quizlet                           | Bộ thẻ và nhiều study modes phù hợp học từ TOEIC                                                                  |
| 2026-07-15 | Test runner lấy cảm hứng từ Study4                           | Luồng thư viện đề, chọn Part, làm bài và review quen thuộc với người học Việt Nam                                 |
| 2026-07-15 | Từ vựng và câu sai phải liên thông                           | Biến việc làm đề thành dữ liệu ôn tập có hành động tiếp theo                                                      |
| 2026-07-15 | Supabase Storage lưu binary, PostgreSQL chỉ lưu URL/metadata | Phù hợp kiến trúc hiện tại và dễ phục vụ qua CDN                                                                  |
| 2026-07-15 | Chấm điểm ở server                                           | Tránh lộ đáp án và giữ kết quả nhất quán                                                                          |
| 2026-07-15 | Dùng UUID Supabase Auth làm `User.id`                        | Đồng nhất JWT `sub` với khóa người dùng, đơn giản hóa ownership và RLS                                            |
| 2026-07-15 | Google OAuth dùng PKCE và cookie SSR                         | Session hoạt động an toàn với Next.js server routes và có thể refresh qua middleware                              |
| 2026-07-22 | Vocabulary MVP lưu term trực tiếp trong một set              | Hoàn thành vertical slice bằng bốn model ưu tiên; bảng nối tái sử dụng term được hoãn đến khi có nhu cầu thực tế  |
| 2026-07-22 | Audio flashcard fallback bằng Web Speech API                 | Bộ demo chưa có audio asset; ưu tiên `audioUrl` khi nội dung thật có file và dùng giọng trình duyệt để phát triển |

## 28. Không làm hoặc hoãn

Chưa có quyết định loại bỏ chức năng nào. Khi hoãn hoặc loại bỏ, ghi rõ:

- Mã chức năng.
- Ngày quyết định.
- Lý do kỹ thuật/sản phẩm/chi phí.
- Điều kiện để xem xét lại.
