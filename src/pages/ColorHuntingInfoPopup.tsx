import type { ReactNode } from "react";
import { InfoPopup, type InfoPopupProps } from "../components";
import "./ColorHuntingInfoPopup.css";

export type ColorHuntingInfoPopupProps = Omit<InfoPopupProps, "children" | "title"> & {
  title?: string;
};

const PROFILE_LINKS: readonly {
  href: string;
  label: ReactNode;
}[] = [
  { href: "https://www.behance.net/Oyoung50", label: "@OYOUNG" },
  { href: "https://github.com/moreal", label: "@moreal" },
];

export function ColorHuntingInfoPopup({
  closeLabel = "컬러헌팅 정보 닫기",
  title = "컬러헌팅(Color Hunting)",
  ...popupProps
}: ColorHuntingInfoPopupProps) {
  return (
    <InfoPopup closeLabel={closeLabel} title={title} {...popupProps}>
      <div className="color-hunting-info-content">
        <p>
          컬러헌팅(Color Hunting)이란
          <br />
          특정한 색상을 정해 일상이나 자연 속에서 보물찾기하듯 찾고, 사진으로 기록하며 주변 환경을
          새롭게 관찰하는 활동입니다.
        </p>
        <p className="color-hunting-info-privacy">
          (p.s. 사진은 외부로 업로드되지 않고 사용 중인 기기 안에서만 처리됩니다! 걱정하지 마세요!)
        </p>
        <ul aria-label="프로필 링크" className="color-hunting-profile-links">
          {PROFILE_LINKS.map((link) => (
            <li key={link.href}>
              <a
                className="color-hunting-profile-link"
                href={link.href}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </InfoPopup>
  );
}
