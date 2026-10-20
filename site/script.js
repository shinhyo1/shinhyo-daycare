// 실제 확인된 값만 입력하세요. 빈 값은 클릭할 수 없는 상태로 유지됩니다.
// 검색엔진용 본문·연락처·구조화 데이터는 index.html에도 직접 반영하세요.
const CONTACT = {
  phone: "", // 예시 형식: 국가번호 또는 지역번호를 포함한 숫자와 하이픈
  map: "",
  blog: "",
  place: "",
  kakao: ""
};
const labels = {phone:"전화 상담하기",map:"지도에서 위치 보기 ↗",blog:"네이버 블로그 ↗",place:"네이버 플레이스 ↗",kakao:"카카오채널 ↗"};
for (const [key, value] of Object.entries(CONTACT)) {
  if (!value) continue;
  let href;
  if (key === "phone") {
    if (!/^\+?[0-9][0-9\s-]{6,20}$/.test(value)) continue;
    href = "tel:" + value.replace(/[\s-]/g, "");
  } else {
    try { const url = new URL(value); if (url.protocol !== "https:") continue; href = url.href; } catch { continue; }
  }
  document.querySelectorAll('[data-link="' + key + '"]').forEach(link => {
    link.href = href; link.removeAttribute("aria-disabled"); link.textContent = labels[key];
    if (key !== "phone") { link.target = "_blank"; link.rel = "noopener noreferrer"; link.setAttribute("aria-label", labels[key] + " (새 창)"); }
  });
}
const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
menu.hidden = false;
navigation.classList.add("is-collapsed");
menu.addEventListener("click", () => {
  const expanded = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(expanded));
  navigation.classList.toggle("is-collapsed", !expanded);
});
navigation.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
  navigation.classList.add("is-collapsed"); menu.setAttribute("aria-expanded", "false");
}));
