"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube, { isValidYoutubeUrl } from "@tiptap/extension-youtube";
import { Placeholder } from "@tiptap/extensions";
import { IMAGE_ACCEPT } from "@/lib/product-images";
import { uploadProductImage } from "@/lib/upload-image";

type Props = {
  // 表單送出時用的欄位名稱，內容會放在隱藏欄位裡
  name: string;
  initialHtml: string;
  placeholder?: string;
};

// 像寫部落格一樣的編輯器：標題、粗體、清單、連結、多張圖片、YouTube 影片
export default function RichTextEditor({ name, initialHtml, placeholder }: Props) {
  const [html, setHtml] = useState(initialHtml);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  // 清除前的內容，按「復原內容」可以整篇拿回來（不受之後的編輯影響）
  const [cleared, setCleared] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"clear" | "revert" | null>(null);
  // 和上次儲存的內容不同時，才可以「還原上次儲存」
  const changed = html !== initialHtml;

  const editor = useEditor({
    // 伺服器端不先畫，避免和瀏覽器的內容對不起來
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image.configure({ allowBase64: false }),
      Youtube.configure({ nocookie: true, modestBranding: true, width: 640, height: 360 }),
      Placeholder.configure({ placeholder: placeholder ?? "開始撰寫產品介紹⋯" }),
    ],
    content: initialHtml,
    editorProps: { attributes: { class: "rich-text min-h-72 px-5 py-4 outline-none" } },
    onUpdate: ({ editor }) => setHtml(editor.isEmpty ? "" : editor.getHTML()),
  });

  // 一次可以選多張，依序上傳並插入到游標位置
  async function insertImages(files: FileList) {
    if (!editor) return;
    setError("");
    const errors: string[] = [];
    for (const file of Array.from(files)) {
      setUploading((n) => n + 1);
      const result = await uploadProductImage(file);
      setUploading((n) => n - 1);
      if (result.url) editor.chain().focus().setImage({ src: result.url, alt: "" }).run();
      else errors.push(result.error ?? "上傳失敗");
    }
    setError(errors.join(" "));
    if (fileRef.current) fileRef.current.value = "";
  }

  function clearAll() {
    if (!editor) return;
    setCleared(editor.getHTML());
    editor.chain().focus().clearContent(true).run();
  }

  function restoreCleared() {
    if (!editor || cleared === null) return;
    editor.chain().focus().setContent(cleared, { emitUpdate: true }).run();
    setCleared(null);
  }

  function revertToSaved() {
    if (!editor) return;
    editor.chain().focus().setContent(initialHtml, { emitUpdate: true }).run();
    setCleared(null);
  }

  function insertYoutube() {
    if (!editor) return;
    const url = window.prompt("貼上 YouTube 影片網址")?.trim();
    if (!url) return;
    if (!isValidYoutubeUrl(url)) {
      setError("這不是 YouTube 影片網址。");
      return;
    }
    setError("");
    editor.chain().focus().setYoutubeVideo({ src: url }).run();
  }

  function editLink() {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("連結網址（留空就是移除連結）", current ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url.trim() === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!url.startsWith("https://")) {
      setError("連結要以 https:// 開頭。");
      return;
    }
    setError("");
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white focus-within:border-brand">
      <input type="hidden" name={name} value={html} />
      {editor && (
        <Toolbar
          editor={editor}
          onImage={() => fileRef.current?.click()}
          onYoutube={insertYoutube}
          onLink={editLink}
          onClear={() => setConfirming("clear")}
          onRevert={() => setConfirming("revert")}
          canRevert={changed && initialHtml !== ""}
          uploading={uploading > 0}
        />
      )}
      {cleared !== null && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          <span>已清除所有內容。</span>
          <span className="flex items-center gap-3">
            <button type="button" onClick={restoreCleared} className="font-medium text-brand-navy underline underline-offset-4">
              復原內容
            </button>
            <button type="button" onClick={() => setCleared(null)} aria-label="關閉提示" className="text-amber-700/70 hover:text-amber-900">
              ✕
            </button>
          </span>
        </div>
      )}
      <ConfirmDialog
        open={confirming === "clear"}
        title="清除詳細介紹？"
        message="會清除編輯器裡的所有文字、圖片和影片。清除後可以按「復原內容」拿回來；按「儲存」之前網站上不會有變化。"
        confirmLabel="確定清除"
        onConfirm={() => {
          setConfirming(null);
          clearAll();
        }}
        onCancel={() => setConfirming(null)}
      />
      <ConfirmDialog
        open={confirming === "revert"}
        title="還原成上次儲存的內容？"
        message="這次還沒儲存的修改都會被取代。還原後一樣可以按 ↶ 復原。"
        confirmLabel="確定還原"
        onConfirm={() => {
          setConfirming(null);
          revertToSaved();
        }}
        onCancel={() => setConfirming(null)}
      />
      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => e.target.files?.length && insertImages(e.target.files)}
      />
      <EditorContent editor={editor} />
      {(error || uploading > 0) && (
        <p className={`border-t border-line px-5 py-2 text-xs ${error ? "text-red-600" : "text-ink/50"}`}>
          {error || `圖片上傳中（剩 ${uploading} 張）⋯`}
        </p>
      )}
    </div>
  );
}

function Toolbar({
  editor,
  onImage,
  onYoutube,
  onLink,
  onClear,
  onRevert,
  canRevert,
  uploading,
}: {
  editor: Editor;
  onImage: () => void;
  onYoutube: () => void;
  onLink: () => void;
  onClear: () => void;
  onRevert: () => void;
  canRevert: boolean;
  uploading: boolean;
}) {
  // 游標移動時更新按鈕的選取狀態
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      empty: e.isEmpty,
    }),
  });


  // danger：紅字的危險動作（例如清除內容）
  const groups: {
    label: string;
    title: string;
    active?: boolean;
    disabled?: boolean;
    danger?: boolean;
    // boxed：加外框，和格式按鈕區分（還原、清除）
    boxed?: boolean;
    onClick: () => void;
    className?: string;
  }[][] = [
    [
      { label: "H2", title: "大標題", active: state.h2, onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: "H3", title: "小標題", active: state.h3, onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    ],
    [
      { label: "B", title: "粗體", active: state.bold, className: "font-black", onClick: () => editor.chain().focus().toggleBold().run() },
      { label: "I", title: "斜體", active: state.italic, className: "italic", onClick: () => editor.chain().focus().toggleItalic().run() },
      { label: "U", title: "底線", active: state.underline, className: "underline", onClick: () => editor.chain().focus().toggleUnderline().run() },
      { label: "S", title: "刪除線", active: state.strike, className: "line-through", onClick: () => editor.chain().focus().toggleStrike().run() },
    ],
    [
      { label: "• 清單", title: "項目清單", active: state.bullet, onClick: () => editor.chain().focus().toggleBulletList().run() },
      { label: "1. 清單", title: "編號清單", active: state.ordered, onClick: () => editor.chain().focus().toggleOrderedList().run() },
      { label: "❝ 引言", title: "引言", active: state.quote, onClick: () => editor.chain().focus().toggleBlockquote().run() },
      { label: "― 分隔線", title: "分隔線", onClick: () => editor.chain().focus().setHorizontalRule().run() },
    ],
    [
      { label: "連結", title: "加入或移除連結", active: state.link, onClick: onLink },
      { label: uploading ? "上傳中⋯" : "插入圖片", title: "插入圖片（可一次選多張）", disabled: uploading, onClick: onImage },
      { label: "▶ YouTube", title: "插入 YouTube 影片", onClick: onYoutube },
    ],
    [
      { label: "↶", title: "復原", disabled: !state.canUndo, onClick: () => editor.chain().focus().undo().run() },
      { label: "↷", title: "重做", disabled: !state.canRedo, onClick: () => editor.chain().focus().redo().run() },
    ],
    [
      { label: "還原上次儲存", title: "還原成上次儲存的內容", disabled: !canRevert, boxed: true, onClick: onRevert },
      { label: "清除內容", title: "清除所有內容", disabled: state.empty, danger: true, boxed: true, onClick: onClear },
    ],
  ];

  return (
    <div role="toolbar" aria-label="編輯工具" className="flex flex-wrap items-center gap-1 border-b border-line bg-cream/60 px-2 py-1.5">
      {groups.map((group, i) => (
        <div key={i} className={`flex items-center border-r border-line pr-1 last:border-r-0 ${group.some((b) => b.boxed) ? "gap-1.5" : "gap-0.5"}`}>
          {group.map((b) => (
            <button
              key={b.title}
              type="button"
              title={b.title}
              aria-label={b.title}
              aria-pressed={b.active}
              disabled={b.disabled}
              onClick={b.onClick}
              className={`rounded-md px-2 py-1 text-xs transition-colors disabled:opacity-30 ${
                b.active
                  ? "bg-brand-navy text-white"
                  : b.danger
                    ? "text-red-600 hover:bg-red-50 hover:text-red-700"
                    : "text-ink/70 hover:bg-white hover:text-ink"
              } ${
                b.boxed ? (b.danger ? "border border-red-300 bg-white" : "border border-ink/20 bg-white") : ""
              } ${b.className ?? ""}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// 網站風格的確認視窗（取代瀏覽器內建的 confirm，不會被瀏覽器擋掉）
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-line bg-white p-6 text-left shadow-xl backdrop:bg-ink/40"
    >
      <p className="text-base font-bold text-ink">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          autoFocus
          className="rounded-full px-4 py-2 text-sm font-medium text-ink/60 hover:text-ink"
        >
          取消
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
