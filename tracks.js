// Lộ trình học — giúp người mới không bị choáng với hơn 20 phòng.
// Mỗi lộ trình là một danh sách id phòng theo thứ tự gợi ý đi.
import { tx } from "./i18n.js";

export const TRACKS = {
  beginner: {
    icon: "🌱",
    label: { vi: "Người mới", en: "Beginner" },
    desc: { vi: "5 phòng cốt lõi để nắm ý tưởng lớn nhất về AI, đi trong ~10 phút.", en: "5 core rooms for the big ideas, ~10 minutes." },
    rooms: ["teachable", "neural-net", "tokenizer", "next-token", "summary"],
  },
  full: {
    icon: "🧭",
    label: { vi: "Đầy đủ", en: "Full journey" },
    desc: { vi: "Toàn bộ hành trình — mọi khái niệm, mọi phòng.", en: "The whole journey — every concept, every room." },
    rooms: null, // null = tất cả các phòng
  },
  dev: {
    icon: "⌨️",
    label: { vi: "Cho lập trình viên", en: "For developers" },
    desc: { vi: "Tập trung vào thứ đang dùng khi xây app AI: token, embeddings, RAG, fine-tuning, agents…", en: "Focused on what you use to build AI apps: tokens, embeddings, RAG, fine-tuning, agents…" },
    rooms: ["tokenizer", "embeddings", "attention", "next-token", "rag", "finetune", "agents", "multimodal", "chatbot", "summary"],
  },
};

// Lấy danh sách id phòng cho một lộ trình (fallback: tất cả).
export function trackRoomIds(trackKey, allRooms) {
  const t = TRACKS[trackKey];
  if (!t || !t.rooms) return allRooms.map((r) => r.id);
  return t.rooms;
}

// Nhãn ngắn hiển thị (đã dịch).
export function trackLabel(trackKey) {
  const t = TRACKS[trackKey];
  return t ? tx(t.label) : "";
}
