const CAST_DETAIL_CONVERSION_ID = "AW-617366745/Ogx_CPfegLoDENmJsaYC";

type WindowWithGtag = Window & {
  gtag?: (...args: unknown[]) => void;
};

const getGtag = () => {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (window as WindowWithGtag).gtag;
};

/**
 * キャスト詳細リンクのタップイベントを広告コンバージョンとして送信する。
 * Google提供の `gtag_report_conversion` サンプルを Next.js 環境向けにアレンジ。
 */
export const reportCastDetailLinkTap = () => {
  const gtag = getGtag();
  if (typeof gtag !== "function") {
    return;
  }
  gtag("event", "conversion", {
    send_to: CAST_DETAIL_CONVERSION_ID,
  });
};

