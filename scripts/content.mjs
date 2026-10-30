export const programs = [
 {slug:'cognition',title:'인지 프로그램',summary:'그림 맞추기와 놀이, 손으로 만들고 표현하는 활동을 소개합니다.',image:'photo-class.jpg',alt:'그림 맞추기에 참여하는 인지교실 모습',sections:[['함께 생각하고 표현하는 시간','기존 센터 소개에는 그림 맞추기와 놀이 중심의 인지교실, 만들기와 미술 중심의 작업활동이 안내되어 있습니다. 익숙한 활동을 통해 참여하는 즐거움과 성취감을 나눕니다.'],['활동 내용','그림 맞추기와 인지놀이, 색색의 재료를 활용한 만들기와 표현 활동을 살펴보실 수 있습니다. 활동별 진행 일정과 참여 방법은 상담 시 확인해 주세요.'],['참여 전 상담','어르신이 좋아하는 활동, 의사소통 방식, 시력·청력과 손 사용의 어려움을 알려주세요. 실제 참여 가능한 활동과 지원 범위는 센터와 상담해 주세요.']]},
 {slug:'movement',title:'신체·운동 프로그램',summary:'어르신의 상태에 맞춰 몸을 움직이는 체육교실과 신체활동을 안내합니다.',image:'photo-exercise.jpg',alt:'앉은 자세로 공을 움직이는 체육교실',sections:[['함께 몸을 움직이는 시간','센터는 어르신의 상태에 맞춘 체육교실·신체활동을 소개하고 있습니다. 기존 활동 사진에서는 앉은 자세로 공을 움직이는 모습을 확인할 수 있습니다.'],['활동과 공간','홈페이지에 소개된 운동공간과 체육교실을 바탕으로 이용 상담을 받으실 수 있습니다. 구체적인 운동 종류와 기구 이용 조건, 진행 횟수는 센터에 확인해 주세요.'],['참여 전 상담','보행 시 필요한 도움, 최근 낙상 경험, 통증이나 운동 시 주의사항을 상담 때 알려주세요. 실제 참여 가능 범위는 개별 확인이 필요합니다.']]},
 {slug:'care',title:'맞춤형 돌봄',summary:'일상생활과 인지·정서·신체 활동을 연결하는 안심토탈케어를 안내합니다.',image:'facility-rest.jpg',alt:'커튼으로 구분된 센터 휴식공간',sections:[['일상을 이어가는 안심토탈케어','센터는 어르신을 삶의 주체로 존중하며 일상생활 동작과 인지·정서·신체 활동을 연결하는 돌봄을 소개하고 있습니다. 생활공간·운동공간·휴식공간을 갖추고 있습니다.'],['우리 가족에게 필요한 지원 확인','이동, 식사, 휴식에서 필요한 도움과 생활 습관을 상담 때 알려주세요. 구체적인 제공 서비스와 지원 가능 범위는 건강 상태와 이용 조건에 따라 센터에서 확인해 주세요.'],['보호자 상담과 이용 안내','희망 이용 요일, 돌봄이 필요한 상황, 송영 필요 여부를 정리해 문의해 주세요. 이용 조건·서류·비용·방문 일정을 확인한 뒤 이용 계획을 상담합니다.']]}
];
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function normalize(page,kind) {
 const p=page.properties||{};
 const text=(key,type='rich_text')=>(p[key]?.[type]||[]).map(x=>x.plain_text??x.text?.content??'').join('');
 if(p.Published?.checkbox!==true || page.archived || page.in_trash) return null;
 const title=text('Name','title'),summary=text('Summary'),body=text('Body'),slug=text('Slug');
 if(!title || !summary) throw Error('Published content requires Name and Summary');
 if(title.length>200 || summary.length>600 || body.length>20000) throw Error('Content exceeds limits');
 if(kind==='programs' && !programs.some(x=>x.slug===slug)) throw Error('Invalid program Slug');
 if(kind==='news' && !/^[a-f0-9-]{32,36}$/i.test(page.id||''))throw Error('Invalid news ID');
 const date=p.Date?.date?.start;
 if(kind==='news' && !/^\d{4}-\d{2}-\d{2}$/.test(date||'')) throw Error('News requires Date without time');
 return {id:page.id,slug:kind==='news'?page.id.replaceAll('-',''):slug,title,summary,body,date};
}
export async function queryNotion(id,token,fetcher=fetch) {
 if(!/^[a-f0-9-]{32,36}$/i.test(id)) throw Error('Invalid data source ID');
 const rows=[];let cursor;
 for(let i=0;i<100;i++) {
  let response;
  for(let attempt=0;attempt<4;attempt++) {
   response=await fetcher(`https://api.notion.com/v1/data_sources/${id}/query`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:JSON.stringify({page_size:100,filter:{property:'Published',checkbox:{equals:true}},...(cursor?{start_cursor:cursor}:{})}),signal:AbortSignal.timeout(30000)});
   if(response.ok || (response.status!==429 && response.status<500)) break;
   await new Promise(r=>setTimeout(r,Math.min(10000,1000*2**attempt)));
  }
  if(!response.ok) throw Error(`Notion request failed (${response.status}); content not published`);
  const data=await response.json();rows.push(...data.results);
  if(!data.has_more)return rows;
  if(!data.next_cursor)throw Error('Missing Notion pagination cursor');cursor=data.next_cursor;
 }
 throw Error('Notion content exceeds pagination limit');
}
