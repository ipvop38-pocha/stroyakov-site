// Only explicit dimensions, series and generic labels from reviewed warehouse titles.
// Composition, adhesive class and manufacturer use limits are supplied separately.
const n = value => String(Number(String(value).replace(',', '.'))).replace('.', ',');
const norm = value => value.toLowerCase().replace(/ё/g,'е').replace(/[×*]/g,'x').replace(/(\d)\s*х\s*(?=\d)/g,'$1x');
export function selectionInventoryFacets(product) {
 const {name,subgroup:g,category}=product; const t=norm(name);const f={};
 const set=(k,v)=>{if(v!==undefined&&v!=='')f[k]=[String(v)];};
 const dims=t.match(/(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)(?:\s*x\s*(\d+(?:[.,]\d+)?))?/);
 const d=dims?dims.slice(1).filter(Boolean).map(n):[];
 const size=(arr)=>arr.join(' × ');
 const mm=t.match(/(?:^|[^\d.,])(\d+(?:[.,]\d+)?)\s*мм/);
 const metres=t.match(/(?:,\s*|длина\s*|рулон\s*)(\d+(?:[.,]\d+)?)\s*м(?:$|[^а-яa-z²2³3])/);
 const pack=t.match(/(\d+)\s*шт/);if(pack)set('packing',`${pack[1]} шт.`);
 const weight=t.match(/(\d+(?:[.,]\d+)?)\s*г(?:$|[^а-я/])/);if(weight&&['Монтажные пены','Пены-клеи','Монтажные клеи'].includes(g))set('packing',`${n(weight[1])} г`);
 if(metres)set('stockLength',n(metres[1]));
 if(['Гипсокартон','OSB','Шифер','Потолочные плиты','Минеральная вата','XPS'].includes(g)) {
  if(d.length===3){set('sheetSize',size(d.slice(0,2)));set('thickness',d[2]);}
  else if(mm)set('thickness',n(mm[1]));
 }
 if(g==='Минеральная вата')set('series',name.match(/Izolife\s+([^,]+)/i)?.[1]);
 if(g==='Подложки'){set('productType',/фольгирован/.test(t)?'Фольгированная':'Вспененный полиэтилен');if(mm)set('thickness',n(mm[1]));}
 if(g==='Маяки металлические'||g==='Маяки ПВХ'){
  set('beaconHeight',t.match(/(?:,\s*)(6|10)\s*мм/)?.[1]);set('metalThickness',t.match(/толщина\s+(0[.,]\d+)/)?.[1]);
 }
 if(['Уголки ПВХ','Уголки металлические'].includes(g)){
  if(d.length)set('profileSize',size(d.slice(0,2)));
  if(g==='Уголки ПВХ')set('productType',/сетк/.test(t)?'С армирующей сеткой':/маяк/.test(t)?'С маяком':'Штукатурный уголок');
  const th=t.match(/толщина\s*(\d+(?:[.,]\d+)?)\s*мм/);if(th)set('thickness',n(th[1]));
 }
 if(g==='Подвесы'){set('productType','Прямой подвес');set('thickness',t.match(/толщина\s*(\d+(?:[.,]\d+)?)/)?.[1]);const len=t.match(/,\s*(\d{2,3})\s*мм/);if(len)set('length',len[1]);}
 if(g==='Соединители и удлинители')set('productType',/удлинитель/.test(t)?'Удлинитель':'Соединитель «Краб»');
 if(g==='Оконные профили')set('productType','Примыкающий с сеткой');
 if(['Саморезы','Дюбели','Заклёпки'].includes(g)){
  if(d.length>=2){set('diameter',d[0]);set('length',d[1]);}
  if(g==='Саморезы')set('fastenerType',/кровельн/.test(t)?'Кровельный':/прессшайб/.test(t)?(/сверло/.test(t)?'Прессшайба, сверло':'Прессшайба, острый'):/редким шагом/.test(t)?'Редкий шаг':/\bln\b/.test(t)?'LN':/по металлу/.test(t)?'Для ГКЛ / по металлу':undefined);
 }
 if(g==='Ленты'){
  const width=t.match(/(\d+(?:[.,]\d+)?)\s*мм/);if(width)set('width',n(width[1]));
  const len=t.match(/(?:x|,|рулон)\s*(\d+(?:[.,]\d+)?)\s*м(?:$|[^а-яa-z²])/);if(len)set('rollLength',n(len[1]));
  if(/бумажн/.test(t))set('purpose','Бумажная для швов');if(/antidust/.test(t))set('purpose','Перфорированная');
 }
 if(g==='Сетки и стеклохолст'){
  if(/шарнирн/.test(t)){set('purpose','Металлическая шарнирная');set('density','Не применяется');set('meshCell','Переменная ячейка');}
  if(/кладочн/.test(t))set('density','Не применяется');
  if(/стеклохолст/.test(t))set('meshCell','Без ячеек');
  const cell=t.match(/ячейка\s+(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)/);if(cell)set('meshCell',`${n(cell[1])} × ${n(cell[2])}`);
  const den=t.match(/(\d+)\s*г\/м²/);if(den)set('density',den[1]);
  const len=t.match(/(?:x|,|рулон)\s*(\d+)\s*м(?:$|[^а-яa-z²])/);if(len)set('rollLength',len[1]);
  if(/кладочн/.test(t))set('rollLength','Не применяется');
 }
 if(['Шпатели','Кисти','Валики','Ножи и лезвия'].includes(g)){
  const measure=t.match(/,\s*(\d+)\s*(?:мм|x)/);if(measure)set('width',measure[1]);
  if(g==='Кисти'&&d.length===2)set('width',d[1]);
  if(g==='Шпатели'){set('productType',/зубчат/.test(t)?'Зубчатый':'Гладкий');set('toothSize',/зубчат/.test(t)?(t.match(/зуб\s+(\d+)\s*x\s*(\d+)/)?.slice(1).join(' × ')):'Без зубьев');}
  if(g==='Ножи и лезвия')set('productType',/^лезвия/.test(t)?'Сменные лезвия':'Нож');
 }
 if(g==='Ёмкости'){
  set('productType',/^ведро/.test(t)?'Ведро':/^кювета/.test(t)?'Малярная кювета':/прямоугольн/.test(t)?'Таз прямоугольный':'Таз круглый');
  if(/^кювета/.test(t))set('volume','Не применяется');else set('volume',t.match(/(\d+)\s*л/)?.[1]);
 }
 if(g==='Мешки'){
  set('color',/зелен/.test(t)?'Зелёный':'Белый');if(d.length)set('sheetSize',size(d.map(v=>n(Number(v.replace(',','.'))*10))));
 }
 if(g==='Пистолеты для пены')set('material',/пластиков/.test(t)?'Пластиковый корпус':/стальной/.test(t)?'Стальной корпус':undefined);
 if(g==='Защитные плёнки'){
  set('productType',/стрейч/.test(t)?'Стрейч-плёнка':/лент/.test(t)?'Укрывная с лентой':'Полиэтиленовая техническая');
  set('filmThickness',t.match(/(\d+)\s*мкм/)?.[1]);
  if(d.length===2){set('width',n(Number(d[0].replace(',','.'))*1000));set('rollLength',d[1]);}else if(mm)set('width',n(mm[1]));
 }
 if(g==='Отрезные диски'&&d.length===3){set('diameter',d[0]);set('thickness',d[1]);set('boreDiameter',d[2]);}
 if(g==='Буры и свёрла'){
  const bore=t.match(/(\d+)\s*x\s*(\d+)\/(\d+)\s*мм/);if(bore){set('diameter',bore[1]);set('workingLength',bore[2]);set('length',bore[3]);}
 }
 if(g==='Системы выравнивания плитки'){
  set('productType',/зажим/.test(t)?'Зажим':'Клин');set('jointWidth',/клин/.test(t)?'Не применяется':t.match(/шов\s+(\d+)\s*мм/)?.[1]);
  const q=product.inventoryName?.match(/(\d+)\s*шт/);if(q)set('packing',`${q[1]} шт.`);
 }
 if(['Монтажные пены','Пены-клеи'].includes(g)){
  if(/всесезон/.test(t))set('season','Всесезонная');
  if(/огнестойк/.test(t))set('productType','Огнестойкая');else set('productType','Обычная монтажная');
 }
 if(g==='Рулонная кровля'&&d.length===2)set('rollLength',d[0]);
 if(g==='Арматура')set('strengthGrade',name.match(/А\d+(?:С)?/)?.[0]);
 if(g==='Проволока'||g==='Катанка')set('diameter',t.match(/ø(\d+(?:[.,]\d+)?)/)?.[1]);
 if(g==='Трубы'){
  if(/водогаз/.test(t)){set('nominalDiameter',d[0]);set('diameter','Не применяется');set('profileSize',`ДУ ${d[0]}`);}
  else if(/электросвар/.test(t)){set('diameter',d[0]);set('nominalDiameter','Не применяется');set('profileSize',`Ø${d[0]}`);}
  else {set('diameter','Не применяется');set('nominalDiameter','Не применяется');}
 }
 if(['Уголки стальные','Заглушки для труб'].includes(g)&&d.length>=2){set('profileSize',size(d.slice(0,2)));if(d[2])set('thickness',d[2]);}
 if(g==='Полосы стальные'&&d.length===2){set('thickness',d[0]);set('width',d[1]);}
 if(g==='Листы стальные'){
  if(d.length===3){set('thickness',d[0]);set('sheetSize',size(d.slice(1)));}else if(d.length===2)set('sheetSize',size(d));
 }
 if(g==='Высечка'){
  set('thickness',t.match(/толщина\s*(\d+(?:[.,]\d+)?)/)?.[1]);if(d.length===2)set('sheetSize',size(d.map(v=>n(Number(v.replace(',','.'))*1000))));
 }
 if(g==='Швеллеры'){
  const mark=name.match(/Швеллер\s+(\d+(?:[.,]\d+)?[ПУ])/);set('productType',/гнут/.test(t)?'Гнутый':mark?.[1].endsWith('П')?'Параллельные полки (П)':'Уклон полок (У)');set('profileSize',d.length===3?size(d):mark?.[1]);
 }
 if(g==='Цемент'){set('cementType',name.match(/ЦЕМ\s+(II\/[^\s,]+|I)(?=\s|,)/)?.[0]);set('strengthGrade',name.match(/42,5Н/)?.[0]);}
 if(g==='Гипс строительный')set('strengthGrade',name.match(/Г-5\s*\/\s*Г-6/)?.[0]);
 if(g==='Кладка и монтаж'){set('strengthGrade',name.match(/М(?:150|300)/)?.[0]);}
 return f;
}
