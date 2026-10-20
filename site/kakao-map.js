// 브라우저용 JavaScript 키입니다. 카카오 콘솔에서 운영 도메인으로 제한합니다.
(() => {
 const container = document.getElementById('kakao-map');
 if (!container) return;
 const fail = () => { container.textContent = '지도를 불러오지 못했습니다. 아래 카카오맵 길찾기를 이용해 주세요.'; };
 const sdk = document.createElement('script');
 sdk.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=ef5e222f71c9a42768f368087831c621&libraries=services&autoload=false';
 sdk.onerror = fail;
 const timeout = setTimeout(fail, 15000);
 sdk.onload = () => { try { kakao.maps.load(() => {
 const geocoder = new kakao.maps.services.Geocoder();
 geocoder.addressSearch('서울특별시 송파구 가락로 45', (result,status) => {
 clearTimeout(timeout);
 if (status !== kakao.maps.services.Status.OK || !result.length) { fail(); return; }
 container.textContent = '';
 const point = new kakao.maps.LatLng(result[0].y,result[0].x);
 const map = new kakao.maps.Map(container,{center:point,level:3,scrollwheel:false});
 const marker = new kakao.maps.Marker({map,position:point});
 const label = new kakao.maps.InfoWindow({content:'<div style="padding:8px 12px;font-size:13px;white-space:nowrap;color:#203d34">신효데이케어센터 · 3층</div>'});
 label.open(map,marker);
 map.addControl(new kakao.maps.ZoomControl(),kakao.maps.ControlPosition.RIGHT);
 const recenter=()=>{map.relayout();map.setCenter(point);};
 if (window.ResizeObserver) new ResizeObserver(recenter).observe(container); else window.addEventListener('resize',recenter);
 container.dataset.loaded = 'true';
 });
 }); } catch { clearTimeout(timeout); fail(); } };
 document.head.appendChild(sdk);
})();
