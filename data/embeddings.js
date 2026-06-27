// Vector 2D tính sẵn cho các từ.
// Trục X ~ giới tính (nam dương / nữ âm), trục Y ~ vai vế / thứ bậc.
// Được thiết kế để phép tính loại suy (analogy) chạy đúng một cách trực quan.
export const WORD_VECTORS = {
  // Nhóm người + giới tính / thứ bậc
  "đàn ông": [2.0, 0.0],
  "đàn bà": [-2.0, 0.0],
  "vua": [2.0, 4.0],
  "nữ hoàng": [-2.0, 4.0],
  "hoàng tử": [2.0, 3.0],
  "công chúa": [-2.0, 3.0],
  "cha": [2.0, 1.2],
  "mẹ": [-2.0, 1.2],
  "con trai": [2.0, -2.0],
  "con gái": [-2.0, -2.0],
  "anh": [1.6, -0.6],
  "chị": [-1.6, -0.6],
  "ông": [2.0, 2.2],
  "bà": [-2.0, 2.2],

  // Nhóm động vật (cụm riêng, ở xa)
  "chó": [8.5, -6.0],
  "mèo": [9.2, -6.6],
  "hổ": [9.8, -5.2],
  "sư tử": [10.4, -5.8],
  "chim": [8.0, -7.2],

  // Nhóm món ăn (cụm riêng, ở xa phía kia)
  "cơm": [-9.0, -6.0],
  "phở": [-9.6, -6.6],
  "bánh mì": [-8.4, -7.0],
  "bún": [-9.2, -5.4],
};

// Vài phép loại suy được thiết kế sẵn để bấm là chạy
export const ANALOGY_PRESETS = [
  { a: "vua", b: "đàn ông", c: "đàn bà", expect: "nữ hoàng" },
  { a: "cha", b: "đàn ông", c: "đàn bà", expect: "mẹ" },
  { a: "con trai", b: "đàn ông", c: "đàn bà", expect: "con gái" },
  { a: "hoàng tử", b: "con trai", c: "con gái", expect: "công chúa" },
];
